import { Course } from "../models/course_model.js";
import { Purchase } from "../models/purchase_model.js";
import { Order } from "../models/order_model.js";
import { User } from "../models/user_model.js";


import mongoose from "mongoose";  

import { v2 as cloudinary } from "cloudinary";

export const createCourse = async (req, res) => {
  const adminId = req.adminId;
  const { title, description, price } = req.body;
  console.log(title, description, price);

  try {
    if (!title || !description || !price) {
      return res.status(400).json({ errors: "All fields are required" });
    }
    const { image } = req.files;
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ errors: "No file uploaded" });
    }

    const allowedFormat = ["image/png", "image/jpeg"];
    if (!allowedFormat.includes(image.mimetype)) {
      return res
        .status(400)
        .json({ errors: "Invalid file format. Only PNG and JPG are allowed" });
    }

    // claudinary code
    const cloud_response = await cloudinary.uploader.upload(image.tempFilePath);
    if (!cloud_response || cloud_response.error) {
      return res
        .status(400)
        .json({ errors: "Error uploading file to cloudinary" });
    }

    console.log(adminId);

    const courseData = {
      title,
      description,
      price,
      image: {
        public_id: cloud_response.public_id,
        url: cloud_response.url,
      },
      creatorId: adminId,
    };

    console.log("Course data before saving:", courseData);

    const course = await Course.create(courseData);
    res.json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating course" });
  }
};

export const updateCourse = async (req, res) => {
  const adminId = req.adminId;
  const { courseId } = req.params;
  const { title, description, price, image } = req.body;
  try {

    

    const courseSearch = await Course.findById(courseId);
    if (!courseSearch) {
      return res.status(404).json({ errors: "Course not found" });
    }
    const course = await Course.findOneAndUpdate(
      {
        _id: courseId,
        creatorId: adminId,
      },
      {
        title,
        description,
        price,
        image: {
          public_id: image?.public_id,
          url: image?.url,
        },
      }
    );
    if (!course) {
      return res
        .status(404)
        .json({ errors: "can't update, created by other admin" });
    }
    res.status(201).json({ message: "Course updated successfully", course });
  } catch (error) {
    res.status(500).json({ errors: "Error in course updating" });
    console.log("Error in course updating ", error);
  }
};

export const deleteCourse = async (req, res) => {
  const adminId = req.adminId;
  const { courseId } = req.params;
  try {
    const course = await Course.findOneAndDelete({
      _id: courseId,
      creatorId: adminId,
    });
    if (!course) {
      return res
        .status(404)
        .json({ errors: "can't delete, created by other admin" });
    }
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ errors: "Error in course deleting" });
    console.log("Error in course deleting", error);
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(201).json({ courses });
  } catch (error) {
    res.status(500).json({ errors: "Error in getting courses" });
    console.log("error to get courses", error);
  }
};

export const courseDetails = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ course });
  } catch (error) {
    res.status(500).json({ errors: "Error in getting course details" });
    console.log("Error in course details", error);
  }
};


import config from "../config.js";  

// controllers/course_controller.js
import crypto from "crypto";
import { razorpay } from "../config.js"; // from the snippet above



// Buy course

import jwt from "jsonwebtoken";
export const buyCourses = async (req, res) => {

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_USER_PASSWORD);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = decoded.userId;
  const user = await User.findById(userId);
  const userEmail = user ? user.email : "";
  const { courseId } = req.params;
  console.log("User ID: ", userId);


  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const existingPurchase = await Purchase.findOne({ userId, courseId });
    if (existingPurchase) {
      return res.status(400).json({ error: "User has already purchased this course" ,
        alreadyPurchased: true,
        purchase: existingPurchase,
      });
    }

    const parsedAmountPaise = Math.round(Number(course.price) * 100);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: parsedAmountPaise,
      currency: "INR",
      receipt: courseId,
      notes: { courseId, userId: String(userId) },
    });

    // Fetch user email (assumed to be in req.user or fetch here)
    // Example: const user = await User.findById(userId);
    // For now, omit email or pass empty string
    const orderCreateObj = {
  email: userEmail, // or userEmail if fetched as above
  userId:  new mongoose.Types.ObjectId(userId),  // NOT user._id
  courseId: new mongoose.Types.ObjectId(course._id),
  paymentId: "",
  amount: course.price,
  status: "created",
  orderId: order.id,  // razorpay order id
};

    await Order.create(orderCreateObj);

    return res.status(201).json({
      message: "Order created",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      course: {
        _id: course._id,
        title: course.title,
        price: course.price,
      },
    });
  } catch (error) {
    console.error("Error in course buying:", error);
    return res.status(500).json({ error: "Error in course buying" });
  }
};




// Verify payment signature and create Purchase

export const verifyPayment = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_USER_PASSWORD);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = decoded.userId;
  const { courseId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  try {
    console.log("Verifying payment with data:", req.body);

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const order = await Order.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        status: "succeeded",
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const purchase = await Purchase.create({
      userId: new mongoose.Types.ObjectId(userId),
      courseId: new mongoose.Types.ObjectId(courseId),
      provider: "razorpay",
      paymentId: razorpay_payment_id,
      status: "succeeded",
    });

    return res.status(201).json({ message: "Payment verified", purchase });
  } catch (error) {
    console.error("Error in payment verification:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};







