// App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import useAuth from './hooks/useAuth';
import { initializeThemeClasses } from './utils/themeHelper';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Friends from './pages/Friends';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const App = () => {
  // Initialize theme classes when app loads
  useEffect(() => {
    // Add a small delay to ensure DOM is fully loaded
    const timer = setTimeout(() => {
      initializeThemeClasses();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <AuthProvider>
      <ThemeProvider>
        <SocketProvider>
          <Router>
            <div className="app-container">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/chat/:userId?" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <Chat />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/friends" element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                } />
                
                {/* Not found route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;