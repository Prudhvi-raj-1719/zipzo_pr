import api from './api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  notifications?: Notification[];
  notification?: Notification;
}

class NotificationService {
  private socket: any = null;
  private pollInterval: any = null;

  async getNotifications(): Promise<NotificationResponse> {
    const response = await api.get('/notifications');
    return response.data;
  }

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<NotificationResponse> {
    // Matches the server route: /api/notifications/mark-all-read
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Socket.IO methods for real-time notifications
  connectSocket(userId: string, onNotification: (notification: Notification) => void) {
    // Start polling for now (30s). Keep interval id to allow disconnecting.
    if (this.pollInterval) return; // already polling
    this.startPolling(onNotification);
  }

  disconnectSocket() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private startPolling(onNotification: (notification: Notification) => void) {
    // Poll for new notifications every 30 seconds
    this.pollInterval = setInterval(async () => {
      try {
        const response = await this.getNotifications();
        if (response.success && response.data?.notifications) {
          const unreadNotifications = response.data.notifications.filter((n: any) => !n.isRead);
          unreadNotifications.forEach((notification: any) => {
            onNotification(notification);
          });
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000);
  }
}

export default new NotificationService(); 