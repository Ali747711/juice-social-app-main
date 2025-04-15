// src/utils/api.js
const API_BASE_URL = 'https://juice-social-app.onrender.com'; // Replace with your actual backend URL
const BASE_URL = import.meta.env.VITE_API_URL;

export const API_URLS = {
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  getUser: `${API_BASE_URL}/api/users/me`,
  updateProfile: `${API_BASE_URL}/api/users/update`,
  getFriends: `${API_BASE_URL}/api/friends/list`,
  // Add all other API endpoints
};

export default API_BASE_URL;
