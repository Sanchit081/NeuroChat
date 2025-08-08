import axios from "axios";

// ✅ Base URL points to backend + `/api`
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://neurochat-cozz.onrender.com/api" // add `/api`
    : "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

if (process.env.NODE_ENV !== "production") {
  api.interceptors.request.use((config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  });
}

export default api;
