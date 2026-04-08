import express from "express";
import { userMiddleware } from "../middlewere/userMiddlewere.js";
import { createAddress, getAddress, UpdatedefaultAddress, updateAddress, deleteAddress } from "../controller/user/AddressController.js";

const route = express.Router();

route.post("/create",userMiddleware,createAddress)
route.get("/get",userMiddleware,getAddress)
route.get("/update/:address_id",userMiddleware,UpdatedefaultAddress)
route.put("/edit/:address_id",userMiddleware,updateAddress)
route.delete("/delete/:address_id",userMiddleware,deleteAddress)





export default route;


