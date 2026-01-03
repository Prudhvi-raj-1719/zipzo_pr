const User = require('../models/User');

// Calculate distance between two coordinates using Haversine formula
exports.calculateDistance = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Calculate fare based on distance and other factors
exports.calculateFare = (distance, isEmergency = false, isShared = false) => {
  const baseFare = 5.00; // Base fare in dollars
  const perKmRate = 1.50; // Rate per kilometer
  const emergencyMultiplier = 1.5; // 50% extra for emergency rides
  const sharedDiscount = 0.7; // 30% discount for shared rides

  let fare = baseFare + (distance * perKmRate);

  if (isEmergency) {
    fare *= emergencyMultiplier;
  }

  if (isShared) {
    fare *= sharedDiscount;
  }

  return Math.round(fare * 100) / 100; // Round to 2 decimal places
};

// Find nearby drivers
exports.findNearbyDrivers = async (coordinates, maxDistance = 10000, preferFemale = false) => {
  try {
    const query = {
      role: 'driver',
      isActive: true,
      isVerified: true,
      isOnline: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: maxDistance
        }
      }
    };

    // Add gender filter if preferred
    if (preferFemale) {
      query.gender = 'female';
    }

    const drivers = await User.find(query)
      .select('name profilePicture vehicleInfo rating currentLocation')
      .limit(20); // Limit to 20 nearest drivers

    return drivers;
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    return [];
  }
};

// Calculate estimated time of arrival
exports.calculateETA = (distance, averageSpeed = 40) => {
  // averageSpeed in km/h, returns time in minutes
  const timeInHours = distance / averageSpeed;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
};

// Generate route optimization suggestions
exports.optimizeRoute = (waypoints) => {
  // This is a simplified version. In production, you'd use Mapbox Directions API
  // or other routing services for actual route optimization

  if (waypoints.length <= 2) {
    return waypoints;
  }

  // Simple nearest neighbor algorithm for demonstration
  const optimized = [waypoints[0]]; // Start with first waypoint
  const remaining = waypoints.slice(1, -1); // Middle waypoints
  const destination = waypoints[waypoints.length - 1]; // End waypoint

  let current = waypoints[0];

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = this.calculateDistance(current, remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      const distance = this.calculateDistance(current, remaining[i]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nearest = remaining.splice(nearestIndex, 1)[0];
    optimized.push(nearest);
    current = nearest;
  }

  optimized.push(destination);
  return optimized;
};

// Check if coordinates are within service area
exports.isWithinServiceArea = (coordinates, serviceAreas) => {
  // serviceAreas should be an array of polygon coordinates
  // This is a simplified check - in production, use proper geospatial queries

  if (!serviceAreas || serviceAreas.length === 0) {
    return true; // If no service areas defined, allow all locations
  }

  // For now, return true. Implement proper polygon containment check
  return true;
};

// Calculate surge pricing multiplier
exports.calculateSurgeMultiplier = async (coordinates, radius = 5000) => {
  try {
    // Get number of active rides in the area
    const Ride = require('../models/Ride');

    const activeRides = await Ride.countDocuments({
      status: { $in: ['requested', 'accepted', 'in-progress'] },
      'pickup.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: radius
        }
      }
    });

    // Get number of available drivers in the area
    const availableDrivers = await User.countDocuments({
      role: 'driver',
      isActive: true,
      isVerified: true,
      isOnline: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: radius
        }
      }
    });

    // Calculate demand-supply ratio
    const ratio = availableDrivers > 0 ? activeRides / availableDrivers : 2;

    // Apply surge multiplier based on ratio
    if (ratio >= 2) return 2.0; // 2x surge
    if (ratio >= 1.5) return 1.5; // 1.5x surge
    if (ratio >= 1) return 1.2; // 1.2x surge

    return 1.0; // No surge
  } catch (error) {
    console.error('Error calculating surge multiplier:', error);
    return 1.0;
  }
};
