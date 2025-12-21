import mysql from "mysql2";
import mysqlPromise from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Create a connection to create the database if it doesn't exist
(async () => {
  try {
    const tempConnection = await mysqlPromise.createConnection({
      host: "localhost",
      user: "root",
      password: process.env.DB_PASSWORD || "",
    });
    await tempConnection.query("CREATE DATABASE IF NOT EXISTS admindb");
    console.log("✅ Database 'admindb' ready");
    await tempConnection.end();
  } catch (err) {
    console.log("❌ Database Creation Failed:", err.message);
  }
})();

const db = mysqlPromise.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD || "",
  database: "admindb",
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
