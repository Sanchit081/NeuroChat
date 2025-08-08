import api from "./api";

// User registration
export const register = async (userData) => {
  const { data } = await api.post("/auth/register", userData);
  return data;
};

// User login
export const login = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

// User logout
export const logout = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

// Get current authenticated user
export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};
