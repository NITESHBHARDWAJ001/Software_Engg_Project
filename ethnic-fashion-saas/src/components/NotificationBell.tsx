import { useEffect, useRef, useState } from 'react';
import { FiBell, FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiCheck } from 'react-icons/fi';
import { useNotificationStore } from '../store/notificationStore';
import { notificationService } from '../services/api/notificationService';
import { Notification } from '../types';
import { formatDate } from '../utils/helpers';
import { toast } from 'sonner';

export default function NotificationBell() {
  const { notifications, unreadCount, setNotifications, markAsRead, removeNotification } =
    useNotificationStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getUnreadNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification.id);
      markAsRead(notification.id);
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      removeNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <FiCheckCircle className="w-5 h-5 text-success" />;
      case 'WARNING':
        return <FiAlertCircle className="w-5 h-5 text-warning" />;
      case 'ERROR':
        return <FiAlertCircle className="w-5 h-5 text-danger" />;
      default:
        return <FiInfo className="w-5 h-5 text-info" />;
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary-dark font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin">
                  <FiBell className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            ) : unreadNotifications.length === 0 && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <FiBell className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <FiCheck className="w-8 h-8 text-success mb-2" />
                <p className="text-sm text-gray-600">All caught up!</p>
                <p className="text-xs text-gray-500 mt-1">You have no unread notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 border-primary bg-blue-50/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="text-xs text-primary hover:text-primary-dark font-medium"
                            onClick={() => setShowDropdown(false)}
                          >
                            View
                          </a>
                        )}
                        <button
                          onClick={() => handleMarkAsRead(notification)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Mark as read"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 text-gray-400 hover:text-danger rounded"
                          title="Delete notification"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > unreadNotifications.length && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-center">
              <a href="/notifications" className="text-xs text-primary hover:text-primary-dark font-medium">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
