import pool from "../config/db.js";
import { hashedpassword } from "../helper/hashing.js";
import dotenv from "dotenv";

dotenv.config();

async function createAdmin() {
  const connection = await pool.getConnection();
  try {
    // Get admin details from command line arguments or use defaults
    const args = process.argv.slice(2);
    const name = args[0] || "Admin";
    const email = args[1] || "admin@example.com";
    const password = args[2] || "admin123";

    console.log("🚀 Creating admin user...");
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // Check if admin already exists
    const [existingAdmin] = await connection.query(
      `SELECT * FROM admins WHERE email = ?`,
      [email]
    );

    if (existingAdmin.length > 0) {
      console.log("❌ Admin with this email already exists!");
      return;
    }

    // Hash password
    const hashedPassword = await hashedpassword(password);

    // Insert admin
    const [result] = await connection.query(
      `INSERT INTO admins (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashedPassword]
    );

    console.log("✅ Admin created successfully!");
    console.log(`Admin ID: ${result.insertId}`);
    console.log(`Email: ${email}`);
    console.log("\n📝 You can now login with these credentials.");

  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    connection.release();
    pool.end();
  }
}

createAdmin();
