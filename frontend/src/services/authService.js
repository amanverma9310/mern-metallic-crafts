import api, { unwrap, withAuth } from "./api";
import { normalizeUser } from "./normalize";

export const register = async (name, email, password, confirmPassword) => {
  const data = await unwrap(
    api.post("/auth/register", { name, email, password, confirmPassword })
  );
  return { user: normalizeUser(data.user), token: data.token };
};

export const login = async (email, password) => {
  const data = await unwrap(api.post("/auth/login", { email, password }));
  return { user: normalizeUser(data.user), token: data.token };
};

export const loginAdmin = async (email, password) => {
  const data = await unwrap(api.post("/auth/admin/login", { email, password }));
  return { user: normalizeUser(data.user), token: data.token };
};

export const getMe = async (token) => {
  const data = await unwrap(api.get("/auth/me", withAuth(token)));
  return normalizeUser(data.user);
};

export const logout = async (token) => {
  await unwrap(api.post("/auth/logout", {}, withAuth(token)));
};

export const changeAdminPassword = async (newPassword, token) => {
  await unwrap(api.put("/auth/admin/password", { newPassword }, withAuth(token)));
};
