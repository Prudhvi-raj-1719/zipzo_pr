import React, { useState } from 'react';
import { Car, DollarSign, Star, Clock, MapPin, ToggleLeft, ToggleRight, Users } from 'lucide-react';

const DriverDashboard: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);

  const todayStats = {
    earnings: 127.50,
    rides: 8,
    hours: 5.5,
    rating: 4.8
  };

  const rideRequests = [
    {
      id: '1',
      pickup: 'Downtown Mall',
      destination: 'Airport Terminal 1',
      distance: '12.5 km',
      estimatedFare: 25.50,
      riderRating: 4.9,
      isEmergency: false
    },
    {
      id: '2',
      pickup: 'Central Hospital',
      destination: 'Medical Center',
      distance: '8.2 km',
      estimatedFare: 18.75,
      riderRating: 4.7,
      isEmergency: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Online Status */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Driver Dashboard</h1>
            <p className="opacity-90">
              {isOnline ? 'You are online and receiving ride requests' : 'You are offline'}
            </p>
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors"
          >
            {isOnline ? (
              <>
                <ToggleRight className="w-6 h-6" />
                <span>Online</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6" />
                <span>Offline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${todayStats.earnings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rides Completed</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.rides}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hours Online</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.hours}h</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.rating}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Ride Requests */}
      {isOnline ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ride Requests</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {rideRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{request.pickup}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-900">{request.destination}</span>
                    {request.isEmergency && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Emergency
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${request.estimatedFare}</p>
                    <p className="text-sm text-gray-600">{request.distance}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Rider rating: {request.riderRating}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      Decline
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                      Accept Ride
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Car className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">You're Offline</h3>
          <p className="text-gray-600 mb-6">Go online to start receiving ride requests from nearby riders.</p>
          <button
            onClick={() => setIsOnline(true)}
            className="px-6 py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
          >
            Go Online
          </button>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;