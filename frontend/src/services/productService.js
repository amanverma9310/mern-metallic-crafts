import api, { unwrap, withAuth } from "./api";
import { normalizeProduct, normalizeProducts } from "./normalize";

export const getProducts = async () => {
  const data = await unwrap(api.get("/products"));
  return normalizeProducts(data);
};

export const getProductById = async (id) => {
  const data = await unwrap(api.get(`/products/${id}`));
  return normalizeProduct(data);
};

export const createProduct = async (productData, token) => {
  const data = await unwrap(api.post("/products", productData, withAuth(token)));
  return normalizeProduct(data);
};

export const updateProduct = async (id, productData, token) => {
  const data = await unwrap(api.put(`/products/${id}`, productData, withAuth(token)));
  return normalizeProduct(data);
};

export const deleteProduct = async (id, token) => {
  await unwrap(api.delete(`/products/${id}`, withAuth(token)));
};
