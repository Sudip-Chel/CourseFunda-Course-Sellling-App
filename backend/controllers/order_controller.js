import { Order } from "../models/order_model.js";
import { Purchase } from "../models/purchase_model.js";

export const orderData = async (req, res) => {
  const order = req.body;

  try {
    // Create order record
    const orderInfo = await Order.create(order);
    console.log("Order created:", orderInfo);

    // Extract userId and courseId
    const userId = orderInfo?.userId;
    const courseId = orderInfo?.courseId;

    // Create purchase only after successfully creating the order
    if (userId && courseId) {
      await Purchase.create({ userId, courseId });
    } else {
      console.warn('UserId or CourseId missing in created order; skipping Purchase creation.');
    }

    // Send response after all DB operations succeed
    res.status(201).json({ message: "Order created successfully", orderInfo });
  } catch (error) {
    console.error("Error in order creation:", error);
    res.status(500).json({ errors: "Error in order creation" });
  }
};
