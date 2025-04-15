import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Register.module.css';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme'; // Import if you have dark mode

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme || {}; // Use this if you have dark mode

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password
      });
      
      if (response.data.token) {
        login(response.data.token, response.data.user);
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.registerPage} ${darkMode ? styles.dark : ''}`}>
      <div className={styles.registerContainer}>
        <div className={styles.leftSide}>
          <div className={styles.logoContainer}>
            <div className={styles.emojiIcon}>🍋‍🟩</div>
            <h1 className={styles.logoText}>Juice</h1>
            <p className={styles.tagline}>Connect with friends</p>
          </div>
        </div>
        
        <div className={styles.rightSide}>
          {useTheme && (
            <button onClick={toggleDarkMode} className={styles.toggleBtn}>
              <span className={styles.toggleIcon}>
                {darkMode ? '☀️' : '🌙'}
              </span>
            </button>
          )}
          
          <h2 className={styles.title}>Create Your Account</h2>
          
          {errors.general && (
            <div className={styles.errorMessage}>{errors.general}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.formLabel}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                className={styles.formInput}
              />
              {errors.username && <p className={styles.errorText}>{errors.username}</p>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={styles.formInput}
              />
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.formLabel}>
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={styles.formInput}
              />
              {errors.fullName && <p className={styles.errorText}>{errors.fullName}</p>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className={styles.formInput}
              />
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.formLabel}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={styles.formInput}
              />
              {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
            </div>
            
            <div className={styles.buttonContainer}>
              <button
                type="submit"
                className={styles.registerButton}
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
          
          <div className={styles.loginLinkContainer}>
            Already have an account? <Link to="/login" className={styles.loginLink}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;