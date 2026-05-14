import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/authService';
import socketService from '../services/socketService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        // Подключаем сокет только если еще не подключен
        if (!socketService.socket || !socketService.socket.connected) {
          console.log('🔌 Подключаем сокет...');
          socketService.connect(token);
        }
      } catch (e) {
        console.error('Ошибка токена:', e);
        logout();
      }
    } else {
      setUser(null);
      socketService.disconnect();
    }
  }, [token]);

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      return { success: true };
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        setStep('verify');
        return { success: false, requiresVerification: true };
      }
      return { success: false, error: err.response?.data?.error || 'Ошибка входа' };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.register(userData);
      alert(res.data.message);
      setStep('login');
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка регистрации';
      alert(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code) => {
    try {
      await authService.verify({ email, code });
      alert("Почта подтверждена! Теперь можно войти.");
      setStep('login');
      return { success: true };
    } catch (err) {
      alert("Неверный код");
      return { success: false, error: 'Неверный код' };
    }
  };

  const resendCode = async () => {
    try {
      await authService.resendCode(email);
      alert("Новый код отправлен на почту");
      return { success: true };
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка отправки");
      return { success: false, error: err.response?.data?.error };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    socketService.disconnect();
    setStep('login');
    setEmail('');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await authService.updateProfile(profileData);
      alert('Профиль обновлен');
      return { success: true, data: res.data };
    } catch (err) {
      alert('Ошибка обновления профиля');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        step,
        email,
        setEmail,
        setStep,
        login,
        register,
        verify,
        resendCode,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};