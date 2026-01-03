import React, { useState } from 'react';
import { MapPin, Clock, Star, AlertTriangle, Users, Car } from 'lucide-react';

interface RiderDashboardProps {
  onNavigate?: (view: string) => void;
}

const RiderDashboard: React.FC<RiderDashboardProps> = ({ onNavigate }) => {
  const [emergencyMode, setEmergencyMode] = useState(false);

  const recentRides = [
    {
      id: '1',
      date: '2024-01-15',
      pickup: 'Downtown Mall',
      destination: 'Airport Terminal 1',
      driver: 'John Smith',
      rating: 4.8,
      fare: 25.50,
      status: 'completed'
    },
    {
      id: '2',
      date: '2024-01-12',
      pickup: 'Office Complex',
      destination: 'Home',
      driver: 'Sarah Johnson',
      rating: 5.0,
      fare: 18.75,
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="opacity-90">Ready for your next ride?</p>
      </div>

      {/* Emergency Mode Toggle */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${emergencyMode ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${emergencyMode ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Emergency Mode</h3>
              <p className="text-sm text-gray-600">Priority booking for urgent travel</p>
            </div>
          </div>
          <button
            onClick={() => setEmergencyMode(!emergencyMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emergencyMode ? 'bg-red-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emergencyMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => onNavigate?.('book-ride')} aria-label="Book a ride" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Book a Ride</h3>
              <p className="text-sm text-gray-600">Find a ride to your destination</p>
            </div>
          </div>
        </button>

        <button onClick={() => onNavigate?.('ride-sharing')} aria-label="Share route" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Share Route</h3>
              <p className="text-sm text-gray-600">Find commuters on same route</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rides</p>
              <p className="text-2xl font-bold text-gray-900">47</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">4.9</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">$543</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Rides */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Rides</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentRides.map((ride) => (
            <div key={ride.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">{ride.pickup}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-medium text-gray-900">{ride.destination}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{ride.date}</span>
                    <span>Driver: {ride.driver}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{ride.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">${ride.fare}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {ride.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;