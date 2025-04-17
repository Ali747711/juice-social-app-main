// src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://juice-social-app.onrender.com';

export const API_URLS = {
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  getUser: `${API_BASE_URL}/api/users/me`,
  updateProfile: `${API_BASE_URL}/api/users/update`,
  getFriends: `${API_BASE_URL}/api/friends`,
  searchUsers: `${API_BASE_URL}/api/users/search`,
  sendFriendRequest: `${API_BASE_URL}/api/friends/request/:userId`,
  getReceivedRequests: `${API_BASE_URL}/api/friends/requests`,
  getSentRequests: `${API_BASE_URL}/api/friends/requests/sent`,
  acceptFriendRequest: `${API_BASE_URL}/api/friends/request/:requestId/accept`,
  rejectFriendRequest: `${API_BASE_URL}/api/friends/request/:requestId/reject`,
  cancelFriendRequest: `${API_BASE_URL}/api/friends/request/:requestId`,
  removeFriend: `${API_BASE_URL}/api/friends/:friendId`,
};

export default API_BASE_URL;
