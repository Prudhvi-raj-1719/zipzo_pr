import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Calendar, Clock, Users, DollarSign, Search, Plus, X } from 'lucide-react';
import MapComponent from '../Map/MapComponent';
import AddressSearch from '../Map/AddressSearch';
import rideSharingService, { 
  RideShareRequest, 
  CreateRideShareData, 
  SearchRideShareFilters 
} from '../../services/rideSharingService';
import fareService from '../../services/fareService';

interface Location {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
}

const RideSharing: React.FC = () => {
  const { user } = useAuth();
  const [isDriver, setIsDriver] = useState(false);
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [availableSeats, setAvailableSeats] = useState(1);
  const [departureTime, setDepartureTime] = useState('');
  const [price, setPrice] = useState(0);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; waypoints: Array<{ latitude: number; longitude: number }> } | null>(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState<RideShareRequest[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchRideShareFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  
  // My rides state
  const [myRides, setMyRides] = useState<RideShareRequest[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setIsDriver(user.role === 'driver');
      loadMyRides();
      loadMyBookings();
    }
  }, [user]);

  const loadMyRides = async () => {
    if (isDriver) {
      try {
        const rides = await rideSharingService.getMyRideShares();
        setMyRides(rides);
      } catch (error) {
        console.error('Error loading my rides:', error);
      }
    }
  };

  const loadMyBookings = async () => {
    try {
      const bookings = await rideSharingService.getMyRideShareBookings();
      setMyBookings(bookings);
    } catch (error) {
      console.error('Error loading my bookings:', error);
    }
  };

  const handleStartLocationSelect = (location: Location) => {
    setStartLocation(location);
  };

  const handleEndLocationSelect = (location: Location) => {
    setEndLocation(location);
  };

  const handleRouteCalculate = (distance: number, duration: number, waypoints: Array<{ latitude: number; longitude: number }>) => {
    setRouteInfo({ distance, duration, waypoints });
    
    // Calculate price based on distance
    const fareCalculation = fareService.calculateFare(distance);
    setPrice(fareCalculation.totalFare);
  };

  const handleCreateRideShare = async () => {
    if (!startLocation || !endLocation || !routeInfo || !departureTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const rideShareData: CreateRideShareData = {
        startLocation: {
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
          address: startLocation.address,
        },
        endLocation: {
          latitude: endLocation.latitude,
          longitude: endLocation.longitude,
          address: endLocation.address,
        },
        route: routeInfo,
        availableSeats,
        price,
        departureTime,
      };

      await rideSharingService.createRideShare(rideShareData);
      alert('Ride share created successfully!');
      loadMyRides();
      
      // Reset form
      setStartLocation(null);
      setEndLocation(null);
      setRouteInfo(null);
      setDepartureTime('');
      setAvailableSeats(1);
      setPrice(0);
    } catch (error) {
      console.error('Error creating ride share:', error);
      alert('Failed to create ride share');
    }
  };

  const handleSearchRides = async () => {
    if (!searchFilters.startLocation || !searchFilters.endLocation) {
      alert('Please select start and end locations');
      return;
    }

    setIsSearching(true);
    try {
      const results = await rideSharingService.searchRideShares(searchFilters);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching rides:', error);
      alert('Failed to search rides');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookRide = async (rideShare: RideShareRequest) => {
    try {
      await rideSharingService.bookRideShare(
        rideShare.id,
        searchFilters.startLocation!,
        searchFilters.endLocation!
      );
      alert('Ride booked successfully!');
      loadMyBookings();
    } catch (error) {
      console.error('Error booking ride:', error);
      alert('Failed to book ride');
    }
  };

  const handleCancelRide = async (rideShareId: string) => {
    try {
      await rideSharingService.cancelRideShare(rideShareId);
      alert('Ride cancelled successfully!');
      loadMyRides();
    } catch (error) {
      console.error('Error cancelling ride:', error);
      alert('Failed to cancel ride');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ride Sharing</h1>
        <p className="text-gray-600">Share rides and save money on your journey</p>
      </div>

      {/* Driver Section - Create Ride Share */}
      {isDriver && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Offer a Ride
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Location
                </label>
                <AddressSearch
                  placeholder="Enter start location in Telangana..."
                  onLocationSelect={handleStartLocationSelect}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Location
                </label>
                <AddressSearch
                  placeholder="Enter end location in Telangana..."
                  onLocationSelect={handleEndLocationSelect}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Time
                </label>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {routeInfo && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Route Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700">Distance: {routeInfo.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700">Duration: {Math.round(routeInfo.duration)} min</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateRideShare}
                disabled={!startLocation || !endLocation || !routeInfo || !departureTime}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Ride Share
              </button>
            </div>

            <div>
              <MapComponent
                onRouteCalculate={handleRouteCalculate}
                startLocation={startLocation}
                endLocation={endLocation}
              />
            </div>
          </div>
        </div>
      )}

      {/* Rider Section - Search Rides */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Find a Ride
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Location
              </label>
              <AddressSearch
                placeholder="Enter start location in Telangana..."
                onLocationSelect={(location) => setSearchFilters(prev => ({ ...prev, startLocation: location }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Location
              </label>
              <AddressSearch
                placeholder="Enter end location in Telangana..."
                onLocationSelect={(location) => setSearchFilters(prev => ({ ...prev, endLocation: location }))}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price (₹)
                </label>
                <input
                  type="number"
                  value={searchFilters.maxPrice || ''}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, maxPrice: parseFloat(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Gender
                </label>
                <select
                  value={searchFilters.driverGender || ''}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, driverGender: e.target.value as 'male' | 'female' || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSearchRides}
              disabled={isSearching}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search Rides'}
            </button>
          </div>

          <div>
            <MapComponent
              onRouteCalculate={handleRouteCalculate}
              startLocation={searchFilters.startLocation || null}
              endLocation={searchFilters.endLocation || null}
            />
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Rides</h3>
            {searchResults.map((ride) => (
              <div key={ride.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">{ride.driverName}</span>
                      <span className="text-sm text-gray-500">({ride.driverGender})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">From:</span> {ride.startLocation.address}
                      </div>
                      <div>
                        <span className="font-medium">To:</span> {ride.endLocation.address}
                      </div>
                      <div>
                        <span className="font-medium">Distance:</span> {ride.route.distance.toFixed(1)} km
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {Math.round(ride.route.duration)} min
                      </div>
                      <div>
                        <span className="font-medium">Price:</span> ₹{ride.price}
                      </div>
                      <div>
                        <span className="font-medium">Seats:</span> {ride.availableSeats}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Departure: {new Date(ride.departureTime).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookRide(ride)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Book Ride
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Rides Section */}
      {isDriver && myRides.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Ride Shares</h2>
          <div className="space-y-4">
            {myRides.map((ride) => (
              <div key={ride.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">From:</span> {ride.startLocation.address}
                      </div>
                      <div>
                        <span className="font-medium">To:</span> {ride.endLocation.address}
                      </div>
                      <div>
                        <span className="font-medium">Price:</span> ₹{ride.price}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {ride.status}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelRide(ride.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Bookings Section */}
      {myBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Bookings</h2>
          <div className="space-y-4">
            {myBookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">From:</span> {booking.pickupLocation.address}
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {booking.dropoffLocation.address}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {booking.status}
                  </div>
                  <div>
                    <span className="font-medium">Booked:</span> {new Date(booking.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RideSharing; 