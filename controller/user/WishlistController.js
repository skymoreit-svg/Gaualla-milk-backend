import pool from "../../config.js";

export const addToWishlist = async (req, res) => {
  try {
    const { user } = req;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const [[existing]] = await pool.query(
      `SELECT * FROM wishlists WHERE product_id = ? AND user_id = ?`,
      [product_id, user.id]
    );

    if (existing) {
      return res.json({ success: true, message: "Already in wishlist" });
    }

    await pool.execute(
      `INSERT INTO wishlists (product_id, user_id) VALUES (?, ?)`,
      [product_id, user.id]
    );

    return res.json({ success: true, message: "Added to wishlist" });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { user } = req;
    const { product_id } = req.params;

    await pool.execute(
      `DELETE FROM wishlists WHERE product_id = ? AND user_id = ?`,
      [product_id, user.id]
    );

    return res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const { user } = req;

    const [items] = await pool.query(
      `       SELECT w.id as wishlist_id, w.product_id, w.created_at as added_at,
              p.name, p.slug, p.price, p.old_price, p.images, p.unit_quantity
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [user.id]
    );

    return res.json({ success: true, wishlist: items });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const checkWishlist = async (req, res) => {
  try {
    const { user } = req;
    const { product_id } = req.params;

    const [[item]] = await pool.query(
      `SELECT id FROM wishlists WHERE product_id = ? AND user_id = ?`,
      [product_id, user.id]
    );

    return res.json({ success: true, inWishlist: !!item });
  } catch (error) {
    console.error("Check wishlist error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { user } = req;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const [[existing]] = await pool.query(
      `SELECT id FROM wishlists WHERE product_id = ? AND user_id = ?`,
      [product_id, user.id]
    );

    if (existing) {
      await pool.execute(
        `DELETE FROM wishlists WHERE product_id = ? AND user_id = ?`,
        [product_id, user.id]
      );
      return res.json({ success: true, message: "Removed from wishlist", inWishlist: false });
    }

    await pool.execute(
      `INSERT INTO wishlists (product_id, user_id) VALUES (?, ?)`,
      [product_id, user.id]
    );
    return res.json({ success: true, message: "Added to wishlist", inWishlist: true });
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
