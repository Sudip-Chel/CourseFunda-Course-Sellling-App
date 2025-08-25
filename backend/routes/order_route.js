import express from "express";
import { orderData } from "../controllers/order_controller.js";
import userMiddleware from "../middlewares/user_mid.js";

const router = express.Router();

router.post("/", userMiddleware, orderData);

export default router;