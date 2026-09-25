import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProtectedRoute.css';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="protected-loading-container">
        <div className="spinner"></div>
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /login while preserving intended destination state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
