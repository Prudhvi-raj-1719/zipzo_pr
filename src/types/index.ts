export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  password?: string; // Optional for registration
  role: 'rider' | 'driver' | 'admin';
  gender: 'male' | 'female' | 'other';
  profilePicture?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface RiderProfile extends User {
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: string;
  preferFemaleDrivers: boolean;
  rideHistory: string[];
}

export interface DriverProfile extends User {
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
  };
  licenseNumber: string;
  rating: number;
  totalRides: number;
  isOnline: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  status: 'requested' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  estimatedFare: number;
  actualFare?: number;
  estimatedDuration: number;
  requestedAt: string;
  completedAt?: string;
  isEmergency: boolean;
  shareRoute: boolean;
  paymentMethod: 'cash' | 'upi' | 'card';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}