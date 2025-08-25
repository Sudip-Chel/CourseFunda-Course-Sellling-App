import express from "express";
import { signup , login , logout , purchases } from "../controllers/user_controller.js";
import userMiddleware from "../middlewares/user_mid.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.get("/purchases" , userMiddleware, purchases);


export default router;