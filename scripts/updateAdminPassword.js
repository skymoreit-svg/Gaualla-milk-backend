import pool from "../config/db.js";
import { hashedpassword, compairPassword } from "../helper/hashing.js";
import dotenv from "dotenv";

dotenv.config();

async function updateAdminPassword() {
  const connection = await pool.getConnection();
  try {
    // Get admin details from command line arguments
    const args = process.argv.slice(2);
    const email = args[0];
    const newPassword = args[1];

    if (!email || !newPassword) {
      console.log("❌ Usage: node scripts/updateAdminPassword.js <email> <newPassword>");
      console.log("Example: node scripts/updateAdminPassword.js admin@example.com newpassword123");
      return;
    }

    if (newPassword.length < 6) {
      console.log("❌ Password must be at least 6 characters long!");
      return;
    }

    console.log("🚀 Updating admin password...");
    console.log(`Email: ${email}`);

    // Check if admin exists
    const [admin] = await connection.query(
      `SELECT * FROM admins WHERE email = ?`,
      [email]
    );

    if (admin.length === 0) {
      console.log("❌ Admin not found with this email!");
      return;
    }

    // Hash new password
    const hashedPassword = await hashedpassword(newPassword);

    // Update password
    await connection.query(
      `UPDATE admins SET password = ? WHERE email = ?`,
      [hashedPassword, email]
    );

    console.log("✅ Admin password updated successfully!");
    console.log(`Email: ${email}`);
    console.log("\n📝 You can now login with the new password.");

  } catch (error) {
    console.error("❌ Error updating admin password:", error);
  } finally {
    connection.release();
    pool.end();
  }
}

updateAdminPassword();
