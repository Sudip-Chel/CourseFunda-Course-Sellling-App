import express from "express";
import {
  courseDetails,
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
  buyCourses,
  verifyPayment
} from "../controllers/course_controller.js";
import userMiddleware from "../middlewares/user_mid.js";
import adminMiddleware from "../middlewares/admin_mid.js";

const router = express.Router();
// routes/course_routes.js





router.post("/create",adminMiddleware, createCourse);
router.put("/update/:courseId",adminMiddleware , updateCourse);
router.delete("/delete/:courseId" , adminMiddleware, deleteCourse);

router.get("/courses", getCourses);
router.get("/:courseId", courseDetails);



router.post("/buy/:courseId", userMiddleware, buyCourses);
router.post("/payment/verify", userMiddleware, verifyPayment);

export default router;