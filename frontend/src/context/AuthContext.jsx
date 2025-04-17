// context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL, { API_URLS } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Axios Request Interceptor
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });
  // Initialize with stored token and user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');    
    if (storedUser && storedToken) {      
      setCurrentUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);
  
  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(API_URLS.getUser);
      setCurrentUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching current user:', error);
      logout();
      setLoading(false);
    }
  };
  
  // Register a new user
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await axios.post(API_URLS.register, userData);
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
            
      setCurrentUser(user);
      setError(null);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      setLoading(false);
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };
  
  // Login user
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await axios.post(API_URLS.login, credentials);
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
           setCurrentUser(user);

      setError(null);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      setLoading(false);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };
  
  // Logout user
  const logout = async () => {
    try {
      // Call logout API if user is logged in
      if (currentUser) {
        // Add a logout URL to your API_URLS object in api.js
        await axios.post(`${API_BASE_URL}/api/auth/logout`);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
    }
  };
  
  // Update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const res = await axios.put(API_URLS.updateProfile, profileData);
      setCurrentUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setLoading(false);
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed');
      setLoading(false);
      return { success: false, error: error.response?.data?.message || 'Profile update failed' };
    }
  };
  
  // Change password
  const changePassword = async (passwordData) => {
    setLoading(true);
    try {
      // Add a changePassword URL to your API_URLS object in api.js
      await axios.put(`${API_BASE_URL}/api/auth/change-password`, passwordData);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Password change failed');
      setLoading(false);
      return { success: false, error: error.response?.data?.message || 'Password change failed' };
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
