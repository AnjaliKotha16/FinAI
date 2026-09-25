import React from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import './NotificationDropdown.css';

export const NotificationDropdown = ({ notifications, onClose, onRefresh }) => {
  const navigate = useNavigate();

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif._id);
    }
    onClose();

    if (notif.metadata?.actionUrl) {
      navigate(notif.metadata.actionUrl);
    } else {
      navigate('/notifications');
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await notificationService.markAllAsRead();
    if (onRefresh) onRefresh();
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'warning') return '⚠️';
    if (severity === 'success') return '✨';
    return 'ℹ️';
  };

  return (
    <div className="notif-dropdown-menu" onClick={(e) => e.stopPropagation()}>
      <div className="notif-dropdown-header">
        <span className="notif-dropdown-title">🔔 Notifications</span>
        {notifications.some((n) => !n.isRead) && (
          <button className="mark-read-all-btn" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notif-dropdown-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            You're all caught up! No notifications.
          </div>
        ) : (
          notifications.slice(0, 5).map((notif) => (
            <div
              key={notif._id}
              className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => handleItemClick(notif)}
            >
              <div className="notif-icon-badge">{getSeverityIcon(notif.severity)}</div>
              <div className="notif-content">
                <span className="notif-item-title">{notif.title}</span>
                <span className="notif-item-message">{notif.message}</span>
                <span className="notif-item-time">
                  {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="notif-dropdown-footer">
        <button
          className="view-all-notifs-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => {
            onClose();
            navigate('/notifications');
          }}
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
};
