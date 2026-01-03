import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import environment from '../../config/environment';

// Set your Mapbox access token
mapboxgl.accessToken = environment.MAPBOX_TOKEN;

const SimpleMapTest: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    console.log('SimpleMapTest: Initializing...');
    console.log('Token:', environment.MAPBOX_TOKEN ? 'Present' : 'Missing');
    console.log('Container:', mapContainer.current);

    if (!mapContainer.current) {
      console.error('Container not found');
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.006, 40.7128],
        zoom: 9
      });

      map.current.on('load', () => {
        console.log('SimpleMapTest: Map loaded!');
      });

      map.current.on('error', (e) => {
        console.error('SimpleMapTest: Map error:', e);
      });

    } catch (error) {
      console.error('SimpleMapTest: Error creating map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Simple Map Test</h3>
      <div 
        ref={mapContainer} 
        className="w-full h-64 border-2 border-red-500 bg-blue-100"
      />
      <p className="text-sm text-gray-600 mt-2">
        Token: {environment.MAPBOX_TOKEN ? '✅ Loaded' : '❌ Missing'}
      </p>
    </div>
  );
};

export default SimpleMapTest; 