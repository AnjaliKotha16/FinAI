import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.message || 'Invalid email or password.');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back to <span className="gradient-text">FinAI</span></h2>
          <p>Sign in to access your financial dashboard</p>
        </div>

        {errorMessage && (
          <div className="auth-alert error-alert">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-sm"></span> Logging in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
