import api from './api';
import { environment } from '../config/environment';

export interface RideShareRequest {
  id: string;
  driverId: string;
  driverName: string;
  driverGender: 'male' | 'female' | 'other';
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  route: {
    distance: number;
    duration: number;
    waypoints: Array<{ latitude: number; longitude: number }>;
  };
  availableSeats: number;
  price: number;
  departureTime: string;
  createdAt: string;
  status: 'active' | 'full' | 'completed' | 'cancelled';
}

export interface RideShareBooking {
  id: string;
  rideShareId: string;
  riderId: string;
  riderName: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface CreateRideShareData {
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  route: {
    distance: number;
    duration: number;
    waypoints: Array<{ latitude: number; longitude: number }>;
  };
  availableSeats: number;
  price: number;
  departureTime: string;
}

export interface SearchRideShareFilters {
  startLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  maxDistance?: number; // km
  maxPrice?: number;
  driverGender?: 'male' | 'female';
  departureTime?: string;
}

class RideSharingService {
  // Create a new ride share
  async createRideShare(data: CreateRideShareData): Promise<RideShareRequest> {
    const response = await api.post('/rides/share', data);
    return response.data;
  }

  // Search for available ride shares
  async searchRideShares(filters: SearchRideShareFilters): Promise<RideShareRequest[]> {
    const params = new URLSearchParams();
    
    if (filters.startLocation) {
      params.append('startLat', filters.startLocation.latitude.toString());
      params.append('startLng', filters.startLocation.longitude.toString());
    }
    
    if (filters.endLocation) {
      params.append('endLat', filters.endLocation.latitude.toString());
      params.append('endLng', filters.endLocation.longitude.toString());
    }
    
    if (filters.maxDistance) {
      params.append('maxDistance', filters.maxDistance.toString());
    }
    
    if (filters.maxPrice) {
      params.append('maxPrice', filters.maxPrice.toString());
    }
    
    if (filters.driverGender) {
      params.append('driverGender', filters.driverGender);
    }
    
    if (filters.departureTime) {
      params.append('departureTime', filters.departureTime);
    }

    const response = await api.get(`/rides/share/search?${params.toString()}`);
    return response.data;
  }

  // Book a ride share
  async bookRideShare(rideShareId: string, pickupLocation: any, dropoffLocation: any): Promise<RideShareBooking> {
    const response = await api.post(`/rides/share/${rideShareId}/book`, {
      pickupLocation,
      dropoffLocation,
    });
    return response.data;
  }

  // Get user's ride shares (as driver)
  async getMyRideShares(): Promise<RideShareRequest[]> {
    const response = await api.get('/rides/share/my-rides');
    return response.data;
  }

  // Get user's ride share bookings (as rider)
  async getMyRideShareBookings(): Promise<RideShareBooking[]> {
    const response = await api.get('/rides/share/my-bookings');
    return response.data;
  }

  // Cancel a ride share
  async cancelRideShare(rideShareId: string): Promise<void> {
    await api.delete(`/rides/share/${rideShareId}`);
  }

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<void> {
    await api.delete(`/rides/share/bookings/${bookingId}`);
  }

  // Check if a location is along the route
  isLocationAlongRoute(
    routeWaypoints: Array<{ latitude: number; longitude: number }>,
    location: { latitude: number; longitude: number },
    tolerance: number = 0.5 // km
  ): boolean {
    // Simple distance-based check
    for (const waypoint of routeWaypoints) {
      const distance = this.calculateDistance(
        waypoint.latitude,
        waypoint.longitude,
        location.latitude,
        location.longitude
      );
      
      if (distance <= tolerance) {
        return true;
      }
    }
    return false;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default new RideSharingService(); 