import axios from "axios";

// Falls back to localhost:5000 for local development if VITE_API_URL isn't set.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL });

/**
 * Builds an axios config with an Authorization header for the given token.
 * Tokens are passed explicitly (rather than read from localStorage inside an
 * interceptor) so each call always uses the exact token the caller has in
 * hand - important here since this app can have a customer token AND a
 * separate admin token active in the same browser at once.
 */
export const withAuth = (token, config = {}) => ({
  ...config,
  headers: {
    ...(config.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

/**
 * Every backend response follows { success, data } or { success, message }.
 * This unwraps that envelope and normalizes errors to a plain message string
 * so callers can just do: try { const data = await unwrap(api.get(...)) }.
 */
export const unwrap = async (requestPromise) => {
  try {
    const response = await requestPromise;
    return response.data.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }
};

export default api;
