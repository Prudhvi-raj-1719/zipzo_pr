// AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import authService, { LoginData, RegisterData } from '../services/authService';
import notificationService from '../services/notificationService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      const parsedUser: User = JSON.parse(savedUser);
      setUser(parsedUser);

      authService.getProfile().catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
    }
  }, []);

  // Manage notification socket/polling when user logs in/out
  useEffect(() => {
    if (user) {
      notificationService.connectSocket(user.id, (notification) => {
        // Dispatch a DOM event so UI components (Header) can listen
        window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
      });
    } else {
      notificationService.disconnectSocket();
    }

    return () => {
      notificationService.disconnectSocket();
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password } as LoginData);

      if (response.success && response.token && response.data?.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const role = userData.role === 'driver' ? 'driver' : 'rider';

      const registerData: RegisterData = {
        name: userData.name || '',
        email: userData.email || '',
        password: userData.password || '',
        phone: userData.phone || '',
        role,

        ...(role === 'rider' && {
          gender: userData.gender ?? 'other', // ✅ FIX
          emergencyContact: userData.phone || '',
        }),

        ...(role === 'driver' && {
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            color: 'White',
            licensePlate: 'ABC123',
          },
          licenseNumber: 'DL123456789',
        }),
      };

      const response = await authService.register(registerData);

      if (response.success && response.token && response.data?.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Registration failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      notificationService.disconnectSocket();
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const response = await authService.updateProfile(updates);

      if (response.success && response.data?.user) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Profile update failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateProfile, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
