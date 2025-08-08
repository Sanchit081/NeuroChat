import axios from "axios";
import api from '../services/api';

// ✅ Dynamically set backend base URL based on environment
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://neurochat-cozz.onrender.com" // <-- Replace with your real Render backend URL
    : "http://localhost:5000"; // Local dev backend

// Create a reusable axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important if you're using cookies/session auth
});

// Optional: Log all requests in dev mode
if (process.env.NODE_ENV !== "production") {
  api.interceptors.request.use((config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  });
}

export default api;
