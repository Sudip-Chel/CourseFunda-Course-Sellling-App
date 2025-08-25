
import {Admin} from "../models/admin_model.js";
import bcrypt from "bcryptjs";
import * as z from "zod";
import jwt from "jsonwebtoken";
import config from "../config.js";

export const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const adminSchema = z.object({
    firstName: z.string().min(3, {message : "First name is required , must be at least 3 characters"}),
    lastName: z.string().min(3, {message :"Last name is required , must be at least 3 characters"}),
    email: z.string().email(),
    password: z.string().min(6, {message :"Password must be at least 6 characters long"}),
})

const validatedData = adminSchema.safeParse(req.body);
  if(!validatedData.success) {
  console.log(validatedData.error.issues);
  return res.status(400).json({ error: validatedData.error.issues.map(err => err.message) });
}
  const hashedPassword = await bcrypt.hash(password, 10);

 try {
     const existingUser = await Admin.findOne({ email : email });
    if (existingUser) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const newAdmin = new Admin({
      firstName, 
      lastName,
      email,
    password : hashedPassword});
    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully" , newAdmin });

 } catch (error) {
    res.status(500).json({ error: "Error during user signup" });
    console.log("Error during user signup:", error);
 }

};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email: email });
        const isPasswordValid =  await bcrypt.compare(password, admin.password);

        if (!admin || !isPasswordValid) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        //jwt token generation
        const token = jwt.sign({ userId: admin._id},  
         config.JWT_ADMIN_PASSWORD, {
            expiresIn: "1d",
        });

        const cookieOptions = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
            httpOnly: true, // can't be accessed via js directly
            secure: process.env.NODE_ENV === "production", // true for http only & Use secure cookies in production
            sameSite : "Strict", // CSRF protection
        }
        //send token in cookie
        res.cookie("jwt", token,cookieOptions);

        res.status(201).json({ message: "Login successful", admin , token });
    } catch (error) {
        res.status(500).json({ error: "Error during Admin login" });
        console.log("Error during Admin login:", error);
    }
};

export const logout = async (req, res) => {
    try {
        if(!req.cookies.jwt) {
            return res.status(401).json({ errors: "Kindly Login First" });
        }
        res.clearCookie("jwt");
        res.status(200).json({ message: "Logged out successful" });
    } catch (error) {
        res.status(500).json({ error: "Error during user logout" });
        console.log("Error during user logout:", error);
    }
};