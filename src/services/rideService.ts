// rideService.tsx
import api from './api';

export interface BookRideData {
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

  // Ride preferences
  rideType?: string;
  estimatedFare?: number;
  isEmergency?: boolean;
  preferFemaleDriver?: boolean; // ✅ ADDED
}

export interface RideResponse {
  success: boolean;
  message: string;
  ride?: any;
  rides?: any[];
}

class RideService {
  // =====================
  // Rider APIs
  // =====================

  async bookRide(data: BookRideData): Promise<RideResponse> {
    /**
     * IMPORTANT:
     * - preferFemaleDriver MUST come from UI
     * - backend will validate gender eligibility
     */
    const response = await api.post('/rides/book', {
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      rideType: data.rideType,
      estimatedFare: data.estimatedFare,
      isEmergency: data.isEmergency ?? false,
      preferFemaleDriver: data.preferFemaleDriver ?? false, // ✅ SENT
    });

    return response.data;
  }

  async getRideHistory(): Promise<RideResponse> {
    const response = await api.get('/rides/history');
    return response.data;
  }

  async getActiveRide(): Promise<RideResponse> {
    const response = await api.get('/rides/active');
    return response.data;
  }

  async cancelRide(rideId: string): Promise<RideResponse> {
    const response = await api.put(`/rides/${rideId}/cancel`);
    return response.data;
  }

  async completeRide(rideId: string): Promise<RideResponse> {
    const response = await api.put(`/rides/${rideId}/complete`);
    return response.data;
  }

  async getRideById(rideId: string): Promise<RideResponse> {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  }

  async updateRideLocation(
    rideId: string,
    location: {
      latitude: number;
      longitude: number;
    }
  ): Promise<RideResponse> {
    const response = await api.put(`/rides/${rideId}/location`, location);
    return response.data;
  }

  // =====================
  // Driver APIs
  // =====================

  async getAvailableRides(): Promise<RideResponse> {
    const response = await api.get('/rides/available');
    return response.data;
  }

  async acceptRide(rideId: string): Promise<RideResponse> {
    const response = await api.put(`/rides/${rideId}/accept`);
    return response.data;
  }

  async startRide(rideId: string): Promise<RideResponse> {
    const response = await api.put(`/rides/${rideId}/start`);
    return response.data;
  }
}

export default new RideService();
