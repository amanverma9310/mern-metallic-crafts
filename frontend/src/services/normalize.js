// The existing frontend components were written against plain-object data
// with an `id` field (e.g. product.id, order.id). MongoDB documents use
// `_id` instead. Rather than touch every component, we normalize documents
// coming back from the API into the exact shape the UI already relies on.

export const normalizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export const normalizeProduct = (product) => {
  if (!product) return null;
  return {
    ...product,
    id: product.id || product._id,
  };
};

export const normalizeProducts = (products = []) => products.map(normalizeProduct);

// Maps a backend Order document back into the { id, user, items, shippingAddress,
// total, date, status } shape the original localStorage-based `orders` array used,
// so Orders.jsx / Dashboard.jsx / Settings.jsx keep working unmodified.
export const normalizeOrder = (order) => {
  if (!order) return null;
  return {
    id: order.orderNumber || order.id || order._id,
    user: order.user
      ? { name: order.user.name, email: order.user.email, id: order.user._id || order.user.id }
      : null,
    items: (order.items || []).map((item) => ({
      id: item.product,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    })),
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    status: order.status,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
  };
};

export const normalizeOrders = (orders = []) => orders.map(normalizeOrder);
