import React, { useEffect, useState } from 'react';
import { Menu, Bell, User, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationService, { Notification as NotificationType } from '../../services/notificationService';

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const resp = await notificationService.getNotifications();
      if (resp.success && resp.data?.notifications) {
        setNotifications(resp.data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handler = (e: any) => {
      const notification = e?.detail;
      if (notification) {
        setNotifications((prev) => [notification, ...prev]);
      }
    };

    window.addEventListener('new-notification', handler as EventListener);

    return () => {
      window.removeEventListener('new-notification', handler as EventListener);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const resp = await notificationService.markAsRead(id);
      if (resp.success && resp.data?.notification) {
        setNotifications((prev) => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Mark as read failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const resp = await notificationService.deleteNotification(id);
      if (resp.success) {
        setNotifications((prev) => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };


  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-3">
            <img
              src="/assets/logo.jpeg"
              alt="Zipzo Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900">Zipzo</h1>
              <p className="text-xs text-gray-500">zip your way everyday</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button onClick={() => setOpen(!open)} aria-label="Notifications" className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">{unreadCount}</span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-medium">Notifications</h4>
                  <button onClick={() => setNotifications([])} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
                </div>
                <div className="max-h-64 overflow-auto">
                  {notifications.length === 0 && (
                    <div className="p-4 text-sm text-gray-500">No notifications</div>
                  )}
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 border-b border-gray-100 flex items-start space-x-3 ${!n.isRead ? 'bg-blue-50' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{n.title}</div>
                          <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                        <div className="mt-2 flex items-center space-x-2">
                          {!n.isRead && (
                            <button onClick={() => handleMarkAsRead(n.id)} className="text-xs text-blue-600">Mark read</button>
                          )}
                          <button onClick={() => handleDelete(n.id)} className="text-xs text-red-600 flex items-center space-x-1"><Trash2 className="w-3 h-3" /><span>Delete</span></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100 text-center">
                  <button onClick={() => { notificationService.markAllAsRead().then(() => loadNotifications()); }} className="text-sm text-gray-700">Mark all as read</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;