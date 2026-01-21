import { useState } from 'react';
import type { PerformanceNotification } from '../../types/performance';
import './NotificationPanel.css';

interface NotificationPanelProps {
  notifications: PerformanceNotification[];
  onMarkRead: (id: string) => void;
  onClear: (id: string) => void;
  onNotificationClick?: (notification: PerformanceNotification) => void;
}

export function NotificationPanel({ notifications, onMarkRead, onClear, onNotificationClick }: Readonly<NotificationPanelProps>) {
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent marking as read when clicking dismiss
    setDismissingIds(prev => new Set(prev).add(notificationId));

    // After animation completes, actually remove the notification
    setTimeout(() => {
      onClear(notificationId);
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }, 300);
  };
  if (notifications.length === 0) {
    return (
      <div className="ai-studio-notification-panel-empty">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <p>No notifications</p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTypeIcon = (type: string, severity: string) => {
    if (severity === 'critical') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    }
    if (severity === 'warning') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    }
    if (type === 'analysis_complete') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    );
  };

  return (
    <div className="ai-studio-notification-panel">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`ai-studio-notification-item ${notification.severity} ${notification.read ? 'read' : 'unread'} ${dismissingIds.has(notification.id) ? 'dismissing' : ''}`}
        >
          <button
            type="button"
            className={`ai-studio-notification-main ${notification.relatedTaskId ? 'clickable' : ''}`}
            onClick={() => {
              if (!notification.read) onMarkRead(notification.id);
              if (notification.relatedTaskId && onNotificationClick) {
                onNotificationClick(notification);
              }
            }}
          >
            <span className="ai-studio-notification-icon">
              {getTypeIcon(notification.type, notification.severity)}
            </span>
            <span className="ai-studio-notification-content">
              <span className="ai-studio-notification-header">
                <span className="ai-studio-notification-title">{notification.title}</span>
                <span className="ai-studio-notification-time-wrapper">
                  <span className="ai-studio-notification-time">{formatTime(notification.createdAt)}</span>
                  {!notification.read && <span className="ai-studio-notification-dot" />}
                </span>
              </span>
              <span className="ai-studio-notification-message">{notification.message}</span>
              <span className="ai-studio-notification-employee">{notification.employeeName}</span>
            </span>
          </button>
          <button
            type="button"
            className="ai-studio-notification-dismiss"
            onClick={(e) => handleDismiss(e, notification.id)}
            title="Dismiss notification"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
