import admin from "firebase-admin";
import pool from "../config.js";

let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin SDK initialized");
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin SDK initialized");
    } else {
      console.warn("Firebase credentials not configured. Push notifications disabled.");
    }
  } catch (err) {
    console.error("Firebase init error:", err.message);
  }
}

initFirebase();

export async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!firebaseInitialized) {
    console.log(`📱 [PUSH] Firebase not initialized — skipping push for "${title}"`);
    return null;
  }
  if (!fcmToken) {
    console.log(`📱 [PUSH] No device token — skipping push for "${title}"`);
    return null;
  }

  const tokenPreview = fcmToken.substring(0, 20) + "..." + fcmToken.substring(fcmToken.length - 10);
  console.log(`📱 [PUSH] Sending Android push: "${title}" → token: ${tokenPreview}`);

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: "high",
        notification: { sound: "default", channelId: "orders" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`📱 [PUSH] ✅ Sent successfully: ${response}`);
    return response;
  } catch (err) {
    console.error(`📱 [PUSH] ❌ Failed: ${err.message} (code: ${err.code})`);
    if (err.code === "messaging/registration-token-not-registered") {
      console.log(`📱 [PUSH] Clearing invalid token: ${tokenPreview}`);
      await pool.query(`UPDATE riders SET fcm_token = NULL WHERE fcm_token = ?`, [fcmToken]);
      await pool.query(`UPDATE users SET fcm_token = NULL WHERE fcm_token = ?`, [fcmToken]);
    }
    return null;
  }
}

export async function sendApnsNotification(apnsToken, title, body, data = {}) {
  if (!firebaseInitialized) {
    console.log(`🍎 [APNS] Firebase not initialized — skipping push for "${title}"`);
    return null;
  }
  if (!apnsToken) {
    console.log(`🍎 [APNS] No device token — skipping push for "${title}"`);
    return null;
  }

  const tokenPreview = apnsToken.substring(0, 20) + "..." + apnsToken.substring(apnsToken.length - 10);
  console.log(`🍎 [APNS] Sending iOS push: "${title}" → token: ${tokenPreview}`);

  try {
    const message = {
      token: apnsToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: "default",
            badge: 1,
            "content-available": 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`🍎 [APNS] ✅ Sent successfully: ${response}`);
    return response;
  } catch (err) {
    console.error(`🍎 [APNS] ❌ Failed: ${err.message} (code: ${err.code})`);
    if (err.code === "messaging/registration-token-not-registered") {
      console.log(`🍎 [APNS] Clearing invalid token: ${tokenPreview}`);
      await pool.query(`UPDATE users SET fcm_token = NULL WHERE fcm_token = ?`, [apnsToken]);
    }
    return null;
  }
}

export async function sendToRider(riderId, title, body, data = {}) {
  const [rows] = await pool.query(`SELECT fcm_token FROM riders WHERE id = ?`, [riderId]);
  if (rows.length === 0 || !rows[0].fcm_token) {
    console.log(`📱 [PUSH] Rider #${riderId} has no device token — skipping`);
    return null;
  }
  console.log(`📱 [PUSH] Sending to rider #${riderId}: "${title}"`);
  return sendPushNotification(rows[0].fcm_token, title, body, data);
}

export async function sendToUser(userId, title, body, data = {}) {
  const [rows] = await pool.query(`SELECT fcm_token, device_platform FROM users WHERE id = ?`, [userId]);
  if (rows.length === 0 || !rows[0].fcm_token) {
    console.log(`📱 [PUSH] User #${userId} has no device token — skipping push (DB notification still saved)`);
    return null;
  }

  const { fcm_token, device_platform } = rows[0];
  console.log(`📱 [PUSH] Sending to user #${userId} (platform: ${device_platform || "android"}): "${title}"`);

  if (device_platform === "ios") {
    return sendApnsNotification(fcm_token, title, body, data);
  }

  return sendPushNotification(fcm_token, title, body, data);
}

export async function createNotification(recipientType, recipientId, title, body, type = "general", data = null) {
  try {
    await pool.query(
      `INSERT INTO notifications (recipient_type, recipient_id, title, body, type, data) VALUES (?, ?, ?, ?, ?, ?)`,
      [recipientType, recipientId, title, body, type, data ? JSON.stringify(data) : null]
    );
    console.log(`🔔 [NOTIFY] DB notification saved: ${recipientType} #${recipientId} — "${title}" (type: ${type})`);
  } catch (err) {
    console.error("🔔 [NOTIFY] ❌ DB insert failed:", err.message);
  }
}

export async function notifyUser(userId, title, body, type = "general", data = {}) {
  console.log(`🔔 [NOTIFY] Notifying user #${userId}: "${title}" — ${body}`);
  await createNotification("user", userId, title, body, type, data);
  await sendToUser(userId, title, body, data);
}
