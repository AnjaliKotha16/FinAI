import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="brand-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Fin<span className="gradient-text">AI</span></span>
          <span className="phase-badge">Phase 2</span>
        </Link>

        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <div className="user-nav-group">
                <span className="user-greeting">👤 {user?.name}</span>
                <button className="btn-logout-nav" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <div className="auth-nav-buttons">
              <Link to="/register" className="btn-nav-register">Register</Link>
              <Link to="/login" className="btn-nav-login">Login</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
