import api, { unwrap, withAuth } from "./api";

export const getServerCart = async (token) => {
  const data = await unwrap(api.get("/cart", withAuth(token)));
  return data.items || [];
};

export const syncServerCart = async (items, token) => {
  const data = await unwrap(api.put("/cart", { items }, withAuth(token)));
  return data.items || [];
};

export const clearServerCart = async (token) => {
  await unwrap(api.delete("/cart", withAuth(token)));
};
