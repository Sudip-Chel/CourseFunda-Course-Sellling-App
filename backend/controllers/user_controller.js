import {User} from "../models/user_model.js";
import { Purchase } from "../models/purchase_model.js"; 
import {Course} from "../models/course_model.js";
import bcrypt from "bcryptjs";
import * as z from "zod";
import jwt from "jsonwebtoken";
import config from "../config.js";
import mongoose from "mongoose";

export const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const userSchema = z.object({
    firstName: z.string().min(3, {message : "First name is required , must be at least 3 characters"}),
    lastName: z.string().min(3, {message :"Last name is required , must be at least 3 characters"}),
    email: z.string().email(),
    password: z.string().min(6, {message :"Password must be at least 6 characters long"}),
})
const validatedData = userSchema.safeParse(req.body);
  if(!validatedData.success) {
    console.log(validatedData.error.issues);
    return res.status(400).json({ error: validatedData.error.issues.map(err => err.message) });
  }
  
  // ... validation as before
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ firstName, lastName, email, password: hashedPassword });
    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, config.JWT_USER_PASSWORD, { expiresIn: "1d" });
    res.status(201).json({
      message: "User created successfully",
      user: newUser,
      token
    });
  } catch (error) {
    res.status(500).json({ error: "Error during user signup" });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id },
      config.JWT_USER_PASSWORD,
      { expiresIn: "1d" }
    );
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.status(201).json({
      message: "Login successful",
      user,
      token
    });
  } catch (error) {
    res.status(500).json({ error: "Error during user login" });
  }
};


export const logout = async (req, res) => {
  try {
    if (!req.cookies.jwt) {
      return res.status(401).json({ error: "Kindly Login First" });
    }
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logged out successful" });
  } catch (error) {
    res.status(500).json({ error: "Error during user logout" });
  }
};



export const purchases = async (req, res) => {
  const userId = req.userId;
  try {
    const purchases = await Purchase.find({ userId: new mongoose.Types.ObjectId(userId) });

    const purchasedCourseId = purchases.map(p => p.courseId);

    const courseData = await Course.find({ _id: { $in: purchasedCourseId } });

    res.status(200).json({ purchases, courseData });
  } catch (error) {
    console.log("Error in fetching user purchases:", error);
    res.status(500).json({ error: "Error in fetching user purchases" });
  }
};





