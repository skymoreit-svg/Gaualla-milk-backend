import express from "express";
import { adminController } from "../controller/admin/adminAuthController.js";
import { adminMiddleware } from "../middlewere/adminMiddleware.js";
import { fetchUsers } from "../controller/user/userController.js";

const routes = express.Router();

// Public routes
routes.post("/login", adminController.adminLogin);
routes.get("/verify", adminController.adminVerify);
routes.get("/logout", adminController.adminLogout);

// Protected routes (require admin authentication)
routes.get("/getadmin", adminMiddleware, adminController.getAdmin);
routes.put("/update-password", adminMiddleware, adminController.updateAdminPassword);
routes.get("/users", adminMiddleware, fetchUsers);

export default routes;
