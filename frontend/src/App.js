import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Chat from './components/Chat/Chat';
import Profile from './components/Profile/Profile';
import PageLoader from './components/Common/PageLoader';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to chat if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? <Navigate to="/chat" /> : children;
};

function App() {
  const [showPageLoader, setShowPageLoader] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const initTimer = setTimeout(() => {
      setAppReady(true);
    }, 1000);

    return () => clearTimeout(initTimer);
  }, []);

  const handleLoadingComplete = () => {
    setShowPageLoader(false);
  };

  if (showPageLoader) {
    return <PageLoader onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Root Route - Redirect to Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <Chat />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback Route - Redirect to Login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
