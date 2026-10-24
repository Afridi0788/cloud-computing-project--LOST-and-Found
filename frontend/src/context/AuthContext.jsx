import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check existing session on application start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await authAPI.getMe();
        if (response.data?.user) {
          setUser(response.data.user);
        }
      } catch (err) {
        // Unauthenticated session - perfectly normal on initial load
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { user: loggedInUser, token } = response.data;
      if (token) {
        localStorage.setItem('token', token);
      }
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await authAPI.register({ name, email, password });
      const { user: registeredUser, token } = response.data;
      if (token) {
        localStorage.setItem('token', token);
      }
      setUser(registeredUser);
      return { success: true, user: registeredUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
