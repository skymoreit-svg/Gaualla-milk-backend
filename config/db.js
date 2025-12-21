import mysql from "mysql2";
import mysqlPromise from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Create a connection to create the database if it doesn't exist
(async () => {
  try {
    const tempConnection = await mysqlPromise.createConnection({
      host: process.env.DB_HOST || "",
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || "",
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Database '${process.env.DB_NAME}' ready`);
    await tempConnection.end();
  } catch (err) {
    console.log("❌ Database Creation Failed:", err.message);
  }
})();

const db = mysqlPromise.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
  waitForConnections: true,
  queueLimit: 0,
});

// Check DB connection (async)
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ MySQL Connected Successfully!");
    connection.release();
  } catch (err) {
    console.log("❌ MySQL Connection Failed:", err.message);
  }
})();

export default db;