import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user/token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear corrupt user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, access_token, refresh_token } = response.data.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data || new Error('An error occurred during login');
    }
  };

  // Register handler
  const register = async (name, email, password, passwordConfirmation) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      const { user: userData, access_token, refresh_token } = response.data.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data || new Error('An error occurred during registration');
    }
  };

  // Logout handler
  const logout = async () => {
    const activeFcmToken = localStorage.getItem('fcm_token');
    if (activeFcmToken) {
      try {
        await api.delete('/device-tokens', { data: { token: activeFcmToken } });
      } catch (error) {
        console.warn('Failed to delete FCM token from backend during logout:', error);
      }
      localStorage.removeItem('fcm_token');
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
