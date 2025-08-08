import axios from "axios";

// ✅ Dynamically set backend base URL with /api prefix
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://neurochat-cozz.onrender.com/api" // Render backend
    : "http://localhost:5000/api"; // Local backend

// Create a reusable axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Needed if using cookies/session auth
});

// Optional: Log requests in dev mode
if (process.env.NODE_ENV !== "production") {
  api.interceptors.request.use((config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  });
}

export default api;
