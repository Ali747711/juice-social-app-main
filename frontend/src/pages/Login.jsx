// pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import Input from '../components/Input';
import Button from '../components/Button';
import { FaSun, FaMoon } from 'react-icons/fa';
import styles from './Login.module.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login, currentUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/');
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const result = await login(formData);
    setLoading(false);

    if (!result.success) {
      setErrors({ general: result.error });
    }
  };

  return (
    <div className={`${styles.loginPage} ${darkMode ? 'dark' : ''}`}>
      <div className={styles.loginContainer}>
        <div className={styles.leftSide}>
          <div className={styles.logoContainer}>
            <div className={styles.emojiIcon}>🍋‍🟩</div>
            <h1 className={styles.logoText}>Juice</h1>
          </div>
        </div>

        <div className={styles.rightSide}>
          <button
            onClick={toggleDarkMode}
            className={styles.toggleBtn}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <FaSun className={styles.toggleIcon} />
            ) : (
              <FaMoon className={styles.toggleIcon} />
            )}
          </button>

          <h2 className={styles.signInTitle}>Login to Your Account</h2>

          {errors.general && (
            <div className={styles.errorMessage}>{errors.general}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <Input
                label="Username or Email"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username or email"
                error={errors.username}
              />
            </div>

            <div className={styles.inputGroup}>
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                error={errors.password}
              />
            </div>

            <div className={styles.buttonContainer}>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                className={styles.goButton}
              >
                Login
              </Button>
            </div>
          </form>

          <div className={styles.footer}>
            <p>
              Don’t have an account?{' '}
              <Link to="/register" className={styles.footerLink}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
