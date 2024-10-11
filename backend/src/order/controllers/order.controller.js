// Please don't change the pre-written code
// Import the necessary modules here

import { createNewOrderRepo } from "../model/order.repository.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";
import { getProductDetailsRepo } from "../../product/model/product.repository.js";

export const createNewOrder = async (req, res, next) => {
  // Write your code here for placing a new order
  try {
    const userId = req.user._id;
    const {
      shippingInfo,
      orderedItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;
    const deliveredAt = new Date();
    deliveredAt.setDate(deliveredAt.getDate() + 3);

    // Validate the request body
    if (
      !shippingInfo ||
      !orderedItems ||
      !paymentInfo ||
      !itemsPrice ||
      !taxPrice ||
      !shippingPrice ||
      !totalPrice
    ) {
      return next(new ErrorHandler(400, "All fields are required"));
    }

    // Prepare the order data
    const orderData = {
      shippingInfo,
      orderedItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      user: userId,
      paidAt: Date.now(),
      deliveredAt,
      orderStatus: "Processing",
    };

    // Check stock availability for all ordered items
    for (const item of orderedItems) {
      const product = await getProductDetailsRepo(item.product);

      if (!product) {
        return next(
          new ErrorHandler(404, `Product with ID ${item.product} not found`)
        );
      }

      // Ensure product stock is greater than requested quantity and greater than 0
      if (product.stock <= 0 || product.stock < item.quantity) {
        return next(
          new ErrorHandler(
            409,
            `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          )
        );
      }
    }

    // Call the repository to create the new order
    const newOrder = await createNewOrderRepo(orderData);

    // Update product stock after order creation
    await Promise.all(
      orderedItems.map(async (item) => {
        const product = await getProductDetailsRepo(item.product);
        product.stock -= item.quantity;
        return product.save();
      })
    );

    // Send success response
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    // Handle any errors
    next(new ErrorHandler(500, error.message));
  }
};
