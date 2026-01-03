import React, { useState } from 'react';
import { MapPin, Navigation, Clock, DollarSign, Users, AlertTriangle, Filter, UserCheck } from 'lucide-react';
import rideService, { BookRideData } from '../../services/rideService';
import { useAuth } from '../../context/AuthContext';
import MapComponent from '../Map/MapComponent';
import AddressSearch from '../Map/AddressSearch';
import fareService, { FareCalculation } from '../../services/fareService';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

const BookRide: React.FC = () => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [preferFemaleDriver, setPreferFemaleDriver] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [fareCalculation, setFareCalculation] = useState<FareCalculation | null>(null);
  const { user } = useAuth();
  const canPreferFemale = user?.gender === 'female';

  const handlePickupSelect = (location: Location) => {
    setPickupLocation(location);
    setPickup(location.address);
  };

  const handleDropoffSelect = (location: Location) => {
    setDropoffLocation(location);
    setDestination(location.address);
  };

  const handleRouteCalculate = (distance: number, duration: number) => {
    setRouteInfo({ distance, duration });
    
    // Calculate fare with current preferences
    const fare = fareService.calculateFare(
      distance,
      isEmergency,
      canPreferFemale ? preferFemaleDriver : false
    );
    setFareCalculation(fare);
  }; 

  const handleEmergencyToggle = () => {
    const newEmergency = !isEmergency;
    setIsEmergency(newEmergency);
    
    // Recalculate fare if route info exists
    if (routeInfo) {
      const fare = fareService.calculateFare(
        routeInfo.distance,
        newEmergency,
        canPreferFemale ? preferFemaleDriver : false
      );
      setFareCalculation(fare);
    }
  }; 

  const handleFemaleDriverToggle = () => {
    if (!canPreferFemale) {
      setError('Female driver preference is available only to female riders.');
      return;
    }

    const newPreferFemale = !preferFemaleDriver;
    setPreferFemaleDriver(newPreferFemale);
    setError('');

    // Recalculate fare if route info exists
    if (routeInfo) {
      const fare = fareService.calculateFare(
        routeInfo.distance,
        isEmergency,
        newPreferFemale
      );
      setFareCalculation(fare);
    }
  }; 

  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      setError('Please select both pickup and destination locations on the map');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const rideData: BookRideData = {
        pickupLocation: {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          address: pickupLocation.address,
        },
        dropoffLocation: {
          latitude: dropoffLocation.latitude,
          longitude: dropoffLocation.longitude,
          address: dropoffLocation.address,
        },
        rideType: isEmergency ? 'emergency' : 'standard',
        estimatedFare: fareCalculation ? fareCalculation.totalFare : 0,
        preferFemaleDriver: preferFemaleDriver && canPreferFemale,
      };

      const response = await rideService.bookRide(rideData);
      
      if (response.success) {
        setSuccess('Ride booked successfully! A driver will be assigned shortly.');
        // Reset form
        setPickup('');
        setDestination('');
        setPickupLocation(null);
        setDropoffLocation(null);
        setRouteInfo(null);
        setFareCalculation(null);
        setIsEmergency(false);
        setPreferFemaleDriver(false);
      } else {
        setError(response.message || 'Failed to book ride. Please try again.');
      }
    } catch (error) {
      console.error('Error booking ride:', error);
      setError('An error occurred while booking your ride. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Book a Ride</h1>
        <p className="opacity-90">Select your pickup and destination on the map to find available drivers</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Map Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose directly from the map</h3>
        <MapComponent
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          onPickupSelect={handlePickupSelect}
          onDropoffSelect={handleDropoffSelect}
          onRouteCalculate={handleRouteCalculate}
        />
      </div>

      {/* Route Information */}
      {routeInfo && fareCalculation && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Route Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">Distance: {routeInfo.distance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">Duration: {Math.round(routeInfo.duration)} min</span>
            </div>
          </div>
          
          {/* Fare Breakdown */}
          <div className="border-t border-blue-200 pt-3">
            <div className="text-sm text-blue-700 mb-2">
              <strong>Fare Breakdown:</strong>
            </div>
            <div className="text-xs text-blue-600 space-y-1">
              <div>Base Fare: ₹{fareCalculation.breakdown.base}</div>
              <div>Distance ({routeInfo.distance.toFixed(1)} km): ₹{fareCalculation.breakdown.distance}</div>
              {fareCalculation.breakdown.emergency > 0 && (
                <div>Emergency Charge: ₹{fareCalculation.breakdown.emergency}</div>
              )}
              {fareCalculation.breakdown.femaleDriver > 0 && (
                <div>Female Driver: ₹{fareCalculation.breakdown.femaleDriver}</div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <div className="text-lg font-bold text-blue-900">
                Total: ₹{fareCalculation.totalFare}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Inputs (for manual entry) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Search for Addresses</h3>
        <div className="space-y-4">
            {/* Pickup Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pickup Location
              </label>
              <AddressSearch
                placeholder="Enter pickup location in Telangana..."
                onLocationSelect={handlePickupSelect}
                className="w-full"
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Destination
              </label>
              <AddressSearch
                placeholder="Enter destination in Telangana..."
                onLocationSelect={handleDropoffSelect}
                className="w-full"
              />
            </div>
        </div>
      </div>

      {/* Ride Options */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-6">
          {/* Ride Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Ride Preferences</h4>
            
            {/* Emergency Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Emergency Ride</div>
                  <div className="text-sm text-gray-500">Priority booking with extra charge</div>
                </div>
              </div>
              <button
                onClick={handleEmergencyToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isEmergency ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEmergency ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Female Driver Preference */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Female Driver</div>
                  <div className="text-sm text-gray-500">{canPreferFemale ? 'Prefer female drivers only' : 'Available only for female riders'}</div>
                </div>
              </div>
              <button
                onClick={handleFemaleDriverToggle}
                aria-disabled={!canPreferFemale}
                disabled={!canPreferFemale}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferFemaleDriver ? 'bg-pink-600' : 'bg-gray-200'
                } ${!canPreferFemale ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferFemaleDriver ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div> 


          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Payment Method</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-bold mb-1">₹</div>
                <span className="text-sm">Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-5 h-5 mx-auto mb-1 bg-gradient-to-r from-blue-600 to-green-600 rounded" />
                <span className="text-sm">Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Ride Button */}
      <button
        onClick={handleBookRide}
        disabled={isLoading || (!pickupLocation && !pickup) || (!dropoffLocation && !destination)}
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? 'Booking Ride...' : 'Book Ride'}
      </button>
    </div>
  );
};

export default BookRide;