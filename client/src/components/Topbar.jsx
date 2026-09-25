import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { NotificationDropdown } from './NotificationDropdown';
import './Topbar.css';

export const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Map route path to human-readable page title
  const getPageTitle = (pathname) => {
    const routeTitles = {
      '/dashboard': 'Dashboard',
      '/transactions': 'Transactions Management',
      '/budgets': 'Budgets & Planning',
      '/analytics': 'Spending Analysis',
      '/goals': 'Financial Goals',
      '/investments': 'Investment Planning',
      '/ai-assistant': 'AI Financial Assistant',
      '/financial-health': 'Financial Health Insights',
      '/insights': 'AI Financial Insights',
      '/monthly-review': 'Monthly Financial Review',
      '/notifications': 'Notification Center',
      '/profile': 'User Profile',
      '/settings': 'Application Settings'
    };
    return routeTitles[pathname] || 'Financial Assistant';
  };

  const currentTitle = getPageTitle(location.pathname);
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const fetchNotificationState = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.ok && res.data?.data) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications state:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotificationState();
    }
  }, [user, location.pathname, fetchNotificationState]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        {/* Mobile Hamburger Toggle Button */}
        <button
          className="topbar-hamburger"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          ☰
        </button>

        <h1 className="topbar-page-title">{currentTitle}</h1>
      </div>

      <div className="topbar-right">
        {/* Notification Bell & Dropdown */}
        <div className="notif-bell-wrapper">
          <button
            className="notif-bell-btn"
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowDropdown(false);
            }}
            title="Notifications"
          >
            <span>🔔</span>
            {unreadCount > 0 && <span className="notif-badge-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>

          {showNotifDropdown && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setShowNotifDropdown(false)}
              onRefresh={fetchNotificationState}
            />
          )}
        </div>

        {/* User Greeting & Profile Dropdown */}
        <div className="user-profile-menu">
          <button
            className="user-profile-trigger"
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifDropdown(false);
            }}
            aria-expanded={showDropdown}
          >
            <div className="user-avatar">{userInitial}</div>
            <div className="user-info-text">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">Authenticated</span>
            </div>
            <span className="dropdown-caret">▼</span>
          </button>

          {showDropdown && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-header">
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
              </div>
              <hr className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/profile');
                }}
              >
                👤 View Profile
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/settings');
                }}
              >
                ⚙️ Settings
              </button>
              <hr className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
