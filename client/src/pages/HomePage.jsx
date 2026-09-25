import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          AI-Powered Personal Finance & Investment Assistant
        </h1>
       

        <div className="hero-cta-group">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-hero-primary">
              🚀 Go to Dashboard ({user?.name})
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-hero-primary">
                Get Started - Register
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
