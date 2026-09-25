import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { notificationService } from '../services/notificationService';
import './NotificationsPage.css';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState('all'); // 'all' or 'unread'
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchNotifications(filterTab === 'unread');
  }, [filterTab]);

  const fetchNotifications = async (unreadOnly) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await notificationService.getNotifications(unreadOnly);

      if (res.ok && res.data?.data) {
        setNotifications(res.data.data);
      } else {
        setErrorMsg(res.data?.message || 'Failed to load notifications.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to notification service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'warning') return '⚠️';
    if (severity === 'success') return '✨';
    return 'ℹ️';
  };

  return (
    <div className="notifs-container">
      <PageHeader
        title="Notification Center"
        subtitle="Stay updated on your budgets, goals, savings milestones, and financial reviews."
        phaseBadge="Phase 15"
        icon="🔔"
      />

      {/* Controls Bar */}
      <div className="notifs-controls-bar">
        <div className="notifs-tabs">
          <button
            className={`notif-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Notifications
          </button>
          <button
            className={`notif-tab-btn ${filterTab === 'unread' ? 'active' : ''}`}
            onClick={() => setFilterTab('unread')}
          >
            Unread
          </button>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button className="mark-all-read-btn-large" onClick={handleMarkAllAsRead}>
            ✓ Mark All as Read
          </button>
        )}
      </div>

      {/* Main List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading notifications...
        </div>
      ) : errorMsg ? (
        <div className="notifs-empty-state">
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Unable to load notifications</h3>
          <p style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
          <button className="notif-tab-btn active" onClick={() => fetchNotifications(filterTab === 'unread')}>
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="notifs-empty-state">
          <div style={{ fontSize: '3rem' }}>✨</div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>You're all caught up!</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            No new notifications. Proactive alerts will appear here when budgets near limits or goal milestones are reached.
          </p>
        </div>
      ) : (
        <div className="notifs-list">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notif-card ${notif.severity} ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => handleMarkAsRead(notif._id)}
            >
              <div className={`notif-card-icon ${notif.severity}`}>
                {getSeverityIcon(notif.severity)}
              </div>

              <div className="notif-card-body">
                <div className="notif-card-header">
                  <span className="notif-card-title">
                    {!notif.isRead && <span className="unread-dot" title="Unread" />}
                    {notif.title}
                  </span>
                  <button
                    className="delete-notif-btn"
                    title="Delete Notification"
                    onClick={(e) => handleDelete(e, notif._id)}
                  >
                    🗑️
                  </button>
                </div>

                <div className="notif-card-message">{notif.message}</div>

                <div className="notif-card-footer">
                  <span>
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}
                  </span>

                  {notif.metadata?.actionUrl && (
                    <button
                      className="notif-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif._id);
                        navigate(notif.metadata.actionUrl);
                      }}
                    >
                      View Details →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
