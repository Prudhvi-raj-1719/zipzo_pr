import environment from '../config/environment';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  place_name: string;
}

class GeocodingService {
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  private accessToken = environment.MAPBOX_TOKEN;

  async searchAddress(query: string): Promise<GeocodingResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(query)}.json?access_token=${this.accessToken}&types=poi,address&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      return data.features.map((feature: any) => ({
        latitude: feature.center[1],
        longitude: feature.center[0],
        address: feature.place_name,
        place_name: feature.text
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${longitude},${latitude}.json?access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding request failed');
      }

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          latitude: feature.center[1],
          longitude: feature.center[0],
          address: feature.place_name,
          place_name: feature.text
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  async getDirections(
    pickup: { latitude: number; longitude: number },
    dropoff: { latitude: number; longitude: number }
  ): Promise<{ distance: number; duration: number; geometry: any } | null> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}?geometries=geojson&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error('Directions request failed');
      }

      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          geometry: route.geometry
        };
      }
      return null;
    } catch (error) {
      console.error('Directions error:', error);
      return null;
    }
  }
}

export default new GeocodingService(); 