// src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://juice-social-app.onrender.com';

export const API_URLS = {
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  getUser: `${API_BASE_URL}/api/users/me`,
  updateProfile: `${API_BASE_URL}/api/users/update`,
  getFriends: `${API_BASE_URL}/api/friends/list`,
  searchUsers: `${API_BASE_URL}/api/users/search`, // Add this line
  // Add all other API endpoints
};

export default API_BASE_URL;
