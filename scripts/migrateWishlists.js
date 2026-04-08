import pool from "../config.js";

async function migrateWishlists() {
  let connection;
  try {
    connection = await pool.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_wishlist (user_id, product_id),
        INDEX idx_user (user_id),
        INDEX idx_product (product_id)
      )
    `);

    console.log("✅ wishlists table created / already exists");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

migrateWishlists();
