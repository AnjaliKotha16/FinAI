import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const navGroups = [
    {
      title: null, // Main group
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' }
      ]
    },
    {
      title: 'MONEY',
      items: [
        { label: 'Transactions', path: '/transactions', icon: '💳' },
        { label: 'Budgets', path: '/budgets', icon: '🎯' }
      ]
    },
    {
      title: 'PLANNING',
      items: [
        { label: 'Financial Goals', path: '/goals', icon: '🏆' },
        { label: 'Investment Planning', path: '/investments', icon: '🚀' }
      ]
    },
    {
      title: 'AI ASSISTANT',
      items: [
        { label: 'AI Financial Assistant', path: '/ai-assistant', icon: '🤖' }
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { label: 'AI Insights', path: '/insights', icon: '💡' },
        { label: 'Monthly Review', path: '/monthly-review', icon: '📅' },
        { label: 'Notifications', path: '/notifications', icon: '🔔' },
        { label: 'Financial Health', path: '/financial-health', icon: '🔍' }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Profile', path: '/profile', icon: '👤' },
        { label: 'Settings', path: '/settings', icon: '⚙️' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Header / Brand */}
        <div className="sidebar-brand">
          <div className="brand-title">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">Fin<span className="gradient-text">AI</span></span>
          </div>
          <span className="brand-subtitle">Finance Assistant</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Sidebar">✕</button>
        </div>

        {/* Navigation Items */}
        <div className="sidebar-nav-scroll">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="nav-group">
              {group.title && <div className="nav-group-title">{group.title}</div>}
              <ul className="nav-list">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                      >
                        <span className="nav-item-icon">{item.icon}</span>
                        <span className="nav-item-label">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar Footer / Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={logout}>
            <span className="logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
