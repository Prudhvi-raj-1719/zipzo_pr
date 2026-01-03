import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'rider' | 'driver';
  // Rider-specific fields
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: string;
  // Driver-specific fields
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
  };
  licenseNumber?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  data?: {
    user: any;
  };
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('authService.register called with:', data);
    try {
      const response = await api.post('/auth/register', data);
      console.log('authService.register response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('authService.register error:', error);
      if (error?.response) {
        console.error('Error response:', error.response.data);
        return error.response.data;
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore network errors, still clear local session
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async getProfile(): Promise<any> {
    // server exposes /auth/me for current user
    const response = await api.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: any): Promise<any> {
    // server expects updatedetails for profile updates
    const response = await api.put('/auth/updatedetails', data);
    return response.data;
  }
}

export default new AuthService(); 