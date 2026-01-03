import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import environment from '../../config/environment';

interface Location {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface AddressSearchProps {
  placeholder: string;
  onLocationSelect: (location: Location) => void;
  className?: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({
  placeholder,
  onLocationSelect,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Telangana bounding box coordinates
  const TELANGANA_BOUNDS = {
    north: 19.5, // Northern boundary
    south: 15.5, // Southern boundary
    east: 81.0,  // Eastern boundary
    west: 77.0,  // Western boundary
  };

  // Major Telangana cities and landmarks for better search results
  const TELANGANA_LOCATIONS = [
    'Hyderabad, Telangana',
    'Warangal, Telangana',
    'Karimnagar, Telangana',
    'Nizamabad, Telangana',
    'Adilabad, Telangana',
    'Khammam, Telangana',
    'Nalgonda, Telangana',
    'Medak, Telangana',
    'Rangareddy, Telangana',
    'Mahabubnagar, Telangana',
    'Nalgonda, Telangana',
    'Suryapet, Telangana',
    'Jagtial, Telangana',
    'Peddapalli, Telangana',
    'Jayashankar Bhupalpally, Telangana',
    'Kumuram Bheem, Telangana',
    'Mancherial, Telangana',
    'Nirmal, Telangana',
    'Rajanna Sircilla, Telangana',
    'Siddipet, Telangana',
    'Vikarabad, Telangana',
    'Wanaparthy, Telangana',
    'Yadadri Bhuvanagiri, Telangana',
  ];

  const searchAddress = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Add "Telangana" to the search query if not already present
      let enhancedQuery = searchQuery;
      if (!searchQuery.toLowerCase().includes('telangana')) {
        enhancedQuery = `${searchQuery}, Telangana`;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(enhancedQuery)}.json?` +
        `access_token=${environment.MAPBOX_TOKEN}&` +
        `country=IN&` +
        `types=poi,address&` +
        `bbox=${TELANGANA_BOUNDS.west},${TELANGANA_BOUNDS.south},${TELANGANA_BOUNDS.east},${TELANGANA_BOUNDS.north}&` +
        `limit=10`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      
      // Filter results to ensure they're within Telangana
      const telanganaResults = data.features
        .filter((feature: any) => {
          const [lng, lat] = feature.center;
          return (
            lat >= TELANGANA_BOUNDS.south &&
            lat <= TELANGANA_BOUNDS.north &&
            lng >= TELANGANA_BOUNDS.west &&
            lng <= TELANGANA_BOUNDS.east
          );
        })
        .map((feature: any, index: number) => ({
          id: `${feature.id || index}`,
          address: feature.place_name,
          latitude: feature.center[1],
          longitude: feature.center[0],
        }));

      setResults(telanganaResults);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  const handleLocationSelect = (location: Location) => {
    setQuery(location.address);
    onLocationSelect(location);
    setShowResults(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleLocationSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setResults([]);
        break;
    }
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (results.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm">Searching Telangana locations...</p>
            </div>
          ) : (
            <div>
              {results.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No locations found in Telangana</p>
                  <p className="text-xs mt-1">Try searching for a specific area or landmark</p>
                </div>
              ) : (
                <div>
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs text-gray-600 font-medium">Telangana Locations</p>
                  </div>
                  {results.map((location, index) => (
                    <button
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      } ${index < results.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {location.address}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Telangana, India
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressSearch; 