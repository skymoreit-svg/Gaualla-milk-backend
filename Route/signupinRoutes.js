import express from "express";
import {userController} from "../controller/all/userSignupin.js";
import { userMiddleware } from "../middlewere/userMiddlewere.js";
const routes= express.Router();

routes.post("/signup",userController.SignupUser)
routes.post("/login",userController.LoginUser)
routes.get("/logout",userController.logoutUser)
routes.get("/getuser",userMiddleware,userController.getUser)
routes.put("/updateuser",userMiddleware,userController.updateUser)
routes.put("/changepassword",userMiddleware,userController.changePassword)
routes.post("/fcm-token",userMiddleware,userController.saveFcmToken)

export default routes;