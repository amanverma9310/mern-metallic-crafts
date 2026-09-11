import api, { unwrap, withAuth } from "./api";
import { normalizeOrder, normalizeOrders } from "./normalize";

export const placeOrder = async ({ items, shippingAddress, paymentMethod }, token) => {
  const data = await unwrap(
    api.post("/orders", { items, shippingAddress, paymentMethod }, withAuth(token))
  );
  return normalizeOrder(data);
};

export const getMyOrders = async (token) => {
  const data = await unwrap(api.get("/orders/me", withAuth(token)));
  return normalizeOrders(data);
};

export const getAllOrders = async (token) => {
  const data = await unwrap(api.get("/orders", withAuth(token)));
  return normalizeOrders(data);
};

export const updateOrderStatus = async (orderId, status, token) => {
  const data = await unwrap(
    api.put(`/orders/${orderId}/status`, { status }, withAuth(token))
  );
  return normalizeOrder(data);
};

export const deleteAllOrders = async (token) => {
  await unwrap(api.delete("/orders", withAuth(token)));
};
