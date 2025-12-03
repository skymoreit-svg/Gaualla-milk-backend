import pool from "../config/db.js";

async function migrate() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("🚀 Running admin migrations...");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ admins table ready");

    await connection.commit();
    console.log("🎉 Admin migrations completed successfully!");

  } catch (err) {
    await connection.rollback();
    console.error("❌ Admin migration failed:", err);
  } finally {
    connection.release();
    pool.end();
  }
}

migrate();
