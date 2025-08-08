// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://neurochat-cozz.onrender.com/api' // Production backend URL
    : 'http://localhost:5000/api';              // Local backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Ensures cookies & auth tokens are sent
});

export default api;
