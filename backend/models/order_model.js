import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
  },
  userId: {
  type: mongoose.Types.ObjectId,
  required: true,
  ref: "User"
},
courseId: {
  type: mongoose.Types.ObjectId,
  required: true,
  ref: "Course"
},
  paymentId: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["created", "paid", "failed", "succeeded"],
    default: "created",
  },
}, {
  timestamps: true,
});

export const Order = mongoose.model("Order", orderSchema);
