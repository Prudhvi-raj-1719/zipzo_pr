import api from './api';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  userType: 'rider' | 'driver';
  avatar?: string;
  rating?: number;
  totalRides?: number;
}

export interface UserResponse {
  success: boolean;
  message: string;
  user?: any;
  users?: any[];
}

class UserService {
  async getUserProfile(): Promise<UserResponse> {
    const response = await api.get('/users/profile');
    return response.data;
  }

  async updateUserProfile(data: Partial<UserProfile>): Promise<UserResponse> {
    const response = await api.put('/users/profile', data);
    return response.data;
  }

  async uploadAvatar(file: File): Promise<UserResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getUsersByType(userType: 'rider' | 'driver'): Promise<UserResponse> {
    const response = await api.get(`/users?userType=${userType}`);
    return response.data;
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }

  async updateUserStatus(status: 'online' | 'offline'): Promise<UserResponse> {
    const response = await api.put('/users/status', { status });
    return response.data;
  }

  async getDriverLocation(driverId: string): Promise<any> {
    const response = await api.get(`/users/${driverId}/location`);
    return response.data;
  }
}

export default new UserService(); 