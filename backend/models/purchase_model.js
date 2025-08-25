import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseId: {
    type: mongoose.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  provider: {
    type: String,            // e.g., "razorpay"
  },
  paymentId: {
    type: String,            // Razorpay payment ID
  },
  status: {
    type: String,            // e.g., "succeeded"
  }
});

export const Purchase = mongoose.model("Purchase", purchaseSchema);
