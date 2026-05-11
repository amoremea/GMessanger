import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthLayout } from './components/Layout/AuthLayout';
import { MainApp } from './components/MainApp';
import { useAuth } from './hooks/useAuth';
import './App.css';

const AppContent = () => {
  const { token } = useAuth();

  if (!token) {
    return <AuthLayout />;
  }

  return <MainApp />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;