// src/utils/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://juice-social-app.onrender.com';

// Create an axios instance with default config
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is a network error or timeout, retry the request
    if (
      (error.code === 'ECONNABORTED' || 
      !error.response || 
      error.code === 'ERR_NETWORK' ||
      error.message.includes('Network Error')) && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      // Add a slight delay before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Retrying request to ${originalRequest.url}`);
      return axiosInstance(originalRequest);
    }

    // If server returns 401 Unauthorized, the token might be expired
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized request - token might be expired');
      // You could add logic here to refresh the token if needed
    }

    return Promise.reject(error);
  }
);

// Helper function to make API requests with retry logic
export const apiRequest = async (method, url, data = null, options = {}) => {
  const maxRetries = options.maxRetries || 3;
  let retries = 0;
  let lastError = null;

  while (retries < maxRetries) {
    try {
      let response;
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await axiosInstance.get(url, { params: data });
          break;
        case 'post':
          response = await axiosInstance.post(url, data);
          break;
        case 'put':
          response = await axiosInstance.put(url, data);
          break;
        case 'delete':
          response = await axiosInstance.delete(url, { data });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      return response.data;
    } catch (error) {
      lastError = error;
      retries++;
      
      // Only retry on network errors or 5xx server errors
      if (
        !error.response ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        error.message.includes('Network Error') ||
        (error.response && error.response.status >= 500)
      ) {
        console.log(`Request failed (attempt ${retries}/${maxRetries}), retrying...`);
        // Exponential backoff: 1s, 2s, 4s, etc.
        await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** (retries - 1))));
        continue;
      }
      
      // For other errors (4xx), don't retry
      break;
    }
  }
  
  // If we got here, all retries failed
  console.error(`Request failed after ${maxRetries} attempts:`, lastError);
  throw lastError;
};

export const API_URLS = {
  // Auth endpoints
  login: `/api/auth/login`,
  register: `/api/auth/register`,
  logout: `/api/auth/logout`,
  
  // User endpoints
  getUser: `/api/users/me`,
  updateProfile: `/api/users/update`,
  searchUsers: `/api/users/search`,
  
  // Friend endpoints
  getFriends: `/api/friends`,
  getFriendSuggestions: `/api/friends/suggestions`,
  getFriendStatus: `/api/friends/status/:userId`,
  getReceivedRequests: `/api/friends/requests`,
  getSentRequests: `/api/friends/requests/sent`,
  
  // Friend request endpoints
  sendFriendRequest: `/api/friends/request/:userId`,
  acceptFriendRequest: `/api/friends/request/:requestId/accept`,
  rejectFriendRequest: `/api/friends/request/:requestId/reject`,
  cancelFriendRequest: `/api/friends/request/:requestId`,
  removeFriend: `/api/friends/:friendId`,
  
  // Message endpoints
  getConversations: `/api/messages`,
  getMessages: `/api/messages/:userId`,
  sendMessage: `/api/messages/:userId`,
  markMessageRead: `/api/messages/:messageId/read`,
  
  // Upload endpoints
  uploadFiles: `/api/upload`,
  
  // Utility endpoints
  healthCheck: `/health`,
};

// Helper function to format URLs with parameters
export const formatUrl = (url, params) => {
  let formattedUrl = url;
  if (params) {
    Object.keys(params).forEach(key => {
      formattedUrl = formattedUrl.replace(`:${key}`, params[key]);
    });
  }
  return formattedUrl;
};

export default API_BASE_URL;
