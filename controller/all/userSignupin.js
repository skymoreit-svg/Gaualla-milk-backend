import dotenv from "dotenv";
dotenv.config()
import pool from "../../config.js";
import { compairPassword, hashedpassword } from "../../helper/hashing.js";
import { createToken } from "../../helper/Jwttoken.js";


export const SignupUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success:false, message: "All fields are required" });
    }

    const [existingUser] = await pool.query(
      `SELECT * FROM users WHERE email = ? OR phone = ?`,
      [email, phone]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({success:false, message: "User already exists with this email or phone" });
    }


    const hashedPassword = await  hashedpassword(password)

const [result]=    await pool.query(
      `INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)`,
      [name, email, phone, hashedPassword]
    );

    const userId = result.insertId;

const token = createToken(userId);

res.cookie("user", token, {
 path:'/',
        httpOnly:true,
        expires: new Date(Date.now()+7000 *86400*5),
        sameSite:'none',
      secure:true,
})









    return res.status(201).json({success:true, token , message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({success:false,  message: "Internal server error" });
  }
};













export const LoginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: "Email/Phone and password are required" });
    }

    // find user by email OR phone
    const [user] = await pool.query(
      `SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      [email, phone]
    );

    if (user.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existingUser = user[0];

    // check password
    const isMatch = await compairPassword(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // generate token
    const token = createToken(existingUser.id);

    // set cookie
    res.cookie("user", token, {
     path:'/',
        httpOnly:true,
        expires: new Date(Date.now()+7000 *86400*5),
        sameSite:'none',
      secure:true,
    });

    return res.status(200).json({
      success: true,token,
      message: "Login successful",
      
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logoutUser=async (req,res)=>{
  res.cookie("user", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now()), // 90 days
      sameSite: "none",
      secure: true, 
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
      
    });
}

const getUser= async(req,res)=>{
  const {user}=req;
  return res.json({user,success:true})
}

const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone } = req.body;

    if (!name && !email && !phone) {
      return res.status(400).json({ success: false, message: "At least one field is required" });
    }

    const [existing] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updatedName = name || existing[0].name;
    const updatedEmail = email || existing[0].email;
    const updatedPhone = phone || existing[0].phone;

    if (email && email !== existing[0].email) {
      const [dup] = await pool.query(`SELECT id FROM users WHERE email = ? AND id != ?`, [email, userId]);
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }

    if (phone && phone !== existing[0].phone) {
      const [dup] = await pool.query(`SELECT id FROM users WHERE phone = ? AND id != ?`, [phone, userId]);
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: "Phone number already in use" });
      }
    }

    await pool.query(
      `UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?`,
      [updatedName, updatedEmail, updatedPhone, userId]
    );

    const [updatedRows] = await pool.query(`SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = ?`, [userId]);

    return res.json({ success: true, message: "Profile updated successfully", user: updatedRows[0] });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};





const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const [rows] = await pool.query(`SELECT password FROM users WHERE id = ?`, [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await compairPassword(oldPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const hashed = await hashedpassword(newPassword);
    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [hashed, userId]);

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const saveFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcm_token, platform } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ success: false, message: "Push token is required" });
    }

    await pool.query(`UPDATE users SET fcm_token = NULL WHERE fcm_token = ? AND id != ?`, [fcm_token, userId]);
    await pool.query(`UPDATE users SET fcm_token = ?, device_platform = ? WHERE id = ?`, [fcm_token, platform || "android", userId]);

    return res.json({ success: true, message: "Push token saved" });
  } catch (error) {
    console.error("Save FCM token error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteAccount = async (req, res) => {
  const userId = req.user?.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Remove user-scoped data first to avoid FK conflicts.
    await connection.query(`DELETE FROM carts WHERE user_id = ?`, [userId]);
    await connection.query(`DELETE FROM wishlists WHERE user_id = ?`, [userId]);
    await connection.query(`DELETE FROM newaddresses WHERE site_user_id = ?`, [userId]);

    // Keep order history but remove direct user/device identifiers.
    await connection.query(`UPDATE transactions SET site_user_id = NULL WHERE site_user_id = ?`, [userId]);
    await connection.query(`UPDATE orders SET site_user_id = NULL, address_id = NULL WHERE site_user_id = ?`, [userId]);

    const [deleted] = await connection.query(`DELETE FROM users WHERE id = ?`, [userId]);

    // Fallback: anonymize the user if hard delete is blocked by DB constraints.
    if (!deleted.affectedRows) {
      await connection.query(
        `UPDATE users
         SET name = ?, email = ?, phone = ?, password = ?, fcm_token = NULL, device_platform = NULL, updated_at = NOW()
         WHERE id = ?`,
        [`Deleted User ${userId}`, `deleted_${userId}@example.com`, `deleted_${userId}`, "deleted_account", userId]
      );
    }

    await connection.commit();

    res.cookie("user", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now()),
      sameSite: "none",
      secure: true,
    });

    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Delete account error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete account" });
  } finally {
    connection.release();
  }
};

export const userController={
    SignupUser,
    LoginUser,
    logoutUser,
    getUser,
    updateUser,
    changePassword,
    saveFcmToken,
    deleteAccount
}




