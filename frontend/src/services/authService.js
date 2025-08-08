// src/services/authService.js
import api from "./api"; // uses the dynamic base URL

// Register a new user
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Login user
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Get logged-in user's profile
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

// Update profile (with or without profile picture)
export const updateProfile = async (formData) => {
  const response = await api.put('/auth/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Logout
export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// Delete account
export const deleteAccount = async () => {
  const response = await api.delete('/auth/account');
  return response.data;
};

// Get current user (using /me endpoint)
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
