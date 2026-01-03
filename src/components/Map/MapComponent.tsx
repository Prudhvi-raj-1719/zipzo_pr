import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import environment from '../../config/environment';
import geocodingService from '../../services/geocodingService';

// Set your Mapbox access token
mapboxgl.accessToken = environment.MAPBOX_TOKEN;

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface MapComponentProps {
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  onPickupSelect: (location: Location) => void;
  onDropoffSelect: (location: Location) => void;
  onRouteCalculate?: (distance: number, duration: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  pickupLocation,
  dropoffLocation,
  onPickupSelect,
  onDropoffSelect,
  onRouteCalculate
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isSelectingPickup, setIsSelectingPickup] = useState(false);
  const [isSelectingDropoff, setIsSelectingDropoff] = useState(false);

  // Telangana center coordinates (Hyderabad)
  const TELANGANA_CENTER = [78.4867, 17.3850]; // Hyderabad coordinates
  const TELANGANA_BOUNDS = {
    north: 19.5,
    south: 15.5,
    east: 81.0,
    west: 77.0,
  };

  useEffect(() => {
    if (map.current) return;

    if (!environment.MAPBOX_TOKEN || environment.MAPBOX_TOKEN.includes('example')) {
      console.error('Mapbox token not configured properly');
      return;
    }

    const container = mapContainer.current;
    if (!container) {
      console.error('Map container not found');
      return;
    }

    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      setTimeout(() => {
        if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
          initializeMap();
        }
      }, 100);
      return;
    }

    initializeMap();

    function initializeMap() {
      try {
        if (!container) return;
        
        map.current = new mapboxgl.Map({
          container: container,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: TELANGANA_CENTER as [number, number], // Hyderabad, Telangana
          zoom: 8, // Zoom out to show more of Telangana
          maxBounds: [
            [TELANGANA_BOUNDS.west, TELANGANA_BOUNDS.south], // Southwest
            [TELANGANA_BOUNDS.east, TELANGANA_BOUNDS.north]  // Northeast
          ] as [[number, number], [number, number]],
          maxZoom: 18,
          minZoom: 6
        });

        map.current.on('load', () => {
          setIsMapLoaded(true);
          setTimeout(() => {
            if (map.current) {
              map.current.resize();
            }
          }, 100);
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
        });

        return () => {
          if (map.current) {
            map.current.remove();
          }
        };
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  }, []);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add pickup marker
    if (pickupLocation) {
      const pickupMarker = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([pickupLocation.longitude, pickupLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>Pickup</h3><p>${pickupLocation.address}</p>`))
        .addTo(map.current);
    }

    // Add dropoff marker
    if (dropoffLocation) {
      const dropoffMarker = new mapboxgl.Marker({ color: '#10B981' })
        .setLngLat([dropoffLocation.longitude, dropoffLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>Destination</h3><p>${dropoffLocation.address}</p>`))
        .addTo(map.current);
    }

    // Fit map to show both markers
    if (pickupLocation && dropoffLocation) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([pickupLocation.longitude, pickupLocation.latitude]);
      bounds.extend([dropoffLocation.longitude, dropoffLocation.latitude]);
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [pickupLocation, dropoffLocation, isMapLoaded]);

  // Handle map click for location selection
  const handleMapClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    if (!map.current) return;

    const { lng, lat } = e.lngLat;
    
    try {
      // Use geocoding service for reverse geocoding
      const result = await geocodingService.reverseGeocode(lat, lng);
      
      if (result) {
        const location: Location = {
          latitude: result.latitude,
          longitude: result.longitude,
          address: result.address
        };

        if (isSelectingPickup) {
          onPickupSelect(location);
          setIsSelectingPickup(false);
        } else if (isSelectingDropoff) {
          onDropoffSelect(location);
          setIsSelectingDropoff(false);
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  }, [isSelectingPickup, isSelectingDropoff, onPickupSelect, onDropoffSelect]);

  // Add click event listener
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [handleMapClick, isMapLoaded]);

  // Calculate route when both locations are set
  useEffect(() => {
    if (!map.current || !isMapLoaded || !pickupLocation || !dropoffLocation) return;

    const calculateRoute = async () => {
      // Remove existing route
      if (map.current!.getSource('route')) {
        map.current!.removeLayer('route');
        map.current!.removeSource('route');
      }

      try {
        // Use geocoding service for directions
        const routeData = await geocodingService.getDirections(
          { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
          { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude }
        );

        if (routeData && map.current) {
          // Add route to map
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: routeData.geometry
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          // Calculate distance and duration
          if (onRouteCalculate) {
            onRouteCalculate(routeData.distance, routeData.duration);
          }
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    calculateRoute();
  }, [pickupLocation, dropoffLocation, isMapLoaded, onRouteCalculate]);

  const startPickupSelection = () => {
    setIsSelectingPickup(true);
    setIsSelectingDropoff(false);
    if (map.current) {
      map.current.getCanvas().style.cursor = 'crosshair';
    }
  };

  const startDropoffSelection = () => {
    setIsSelectingDropoff(true);
    setIsSelectingPickup(false);
    if (map.current) {
      map.current.getCanvas().style.cursor = 'crosshair';
    }
  };

  const cancelSelection = () => {
    setIsSelectingPickup(false);
    setIsSelectingDropoff(false);
    if (map.current) {
      map.current.getCanvas().style.cursor = '';
    }
  };

  return (
    <div className="relative">
      <div className="mb-4 flex gap-2">
        <button
          onClick={startPickupSelection}
          disabled={isSelectingPickup}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSelectingPickup
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isSelectingPickup ? 'Click on map to set pickup' : 'Set Pickup'}
        </button>
        <button
          onClick={startDropoffSelection}
          disabled={isSelectingDropoff}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSelectingDropoff
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isSelectingDropoff ? 'Click on map to set destination' : 'Set Destination'}
        </button>
        {(isSelectingPickup || isSelectingDropoff) && (
          <button
            onClick={cancelSelection}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="relative">
        {!isMapLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={mapContainer} 
          className="w-full h-96 rounded-lg border border-gray-300"
          style={{ 
            minHeight: '384px',
            height: '384px',
            width: '100%'
          }}
        />
      </div>
      
      {(isSelectingPickup || isSelectingDropoff) && (
        <div className="mt-2 text-sm text-gray-600">
          {isSelectingPickup && "Click anywhere on the map to set your pickup location"}
          {isSelectingDropoff && "Click anywhere on the map to set your destination"}
        </div>
      )}
    </div>
  );
};

export default MapComponent; 