import OrderModel from "./order.schema.js";

export const createNewOrderRepo = async (data) => {
  // Write your code here for placing a new order
  const newOrder = new OrderModel(data);

  // Save the new order to the database
  await newOrder.save();

  // Return the saved order
  return newOrder;
};
