import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist, checkWishlist, toggleWishlist } from "../controller/user/WishlistController.js";
import { userMiddleware } from "../middlewere/userMiddlewere.js";

const route = express.Router();

route.post("/add", userMiddleware, addToWishlist);
route.post("/toggle", userMiddleware, toggleWishlist);
route.get("/all", userMiddleware, getWishlist);
route.get("/check/:product_id", userMiddleware, checkWishlist);
route.delete("/remove/:product_id", userMiddleware, removeFromWishlist);

export default route;
