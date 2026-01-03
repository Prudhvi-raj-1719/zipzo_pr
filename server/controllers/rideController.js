const Ride = require("../models/Ride");
const User = require("../models/User");
const Notification = require("../models/Notification");
const {
  calculateDistance,
  calculateFare,
  findNearbyDrivers,
} = require("../utils/rideUtils");
const { sendNotification } = require("../utils/notifications");

// @desc    Book a ride
// @route   POST /api/rides
// @access  Private (Rider)
exports.bookRide = async (req, res, next) => {
  try {
    const {
      pickup,
      destination,
      isEmergency,
      shareRoute,
      paymentMethod,
      preferFemaleDriver,
    } = req.body;

    // Validate female driver preference - only female riders can request female driver
    if (preferFemaleDriver && req.user.gender !== "female") {
      return res.status(403).json({
        success: false,
        message: "Female driver preference is only available to female riders",
      });
    }

    // Create ride
    const ride = await Ride.create({
      rider: req.user.id,
      pickup,
      destination,
      estimatedFare,
      distance,
      estimatedDuration,
      isEmergency,
      shareRoute,
      paymentMethod,
    });

    // Find nearby drivers (respecting female preference only when applicable)
    const preferFemale = !!preferFemaleDriver && req.user.gender === "female";
    const nearbyDrivers = await findNearbyDrivers(
      pickup.coordinates,
      10000, // 10km radius
      preferFemale
    );

    // Send notifications to nearby drivers
    for (const driver of nearbyDrivers) {
      await sendNotification(driver._id, {
        title: isEmergency
          ? "🚨 Emergency Ride Request"
          : "🚗 New Ride Request",
        message: `New ride request from ${pickup.address} to ${destination.address}`,
        type: "ride_request",
        data: { rideId: ride._id },
      });
    }

    // Populate ride data
    await ride.populate("rider", "name phone profilePicture");

    res.status(201).json({
      success: true,
      data: {
        ride,
        nearbyDrivers: nearbyDrivers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available rides for driver
// @route   GET /api/rides/available
// @access  Private (Driver)
exports.getAvailableRides = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const rides = await Ride.find({
      status: "requested",
      "pickup.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      },
    })
      .populate("rider", "name phone profilePicture rating")
      .sort({ isEmergency: -1, requestedAt: 1 });

    res.status(200).json({
      success: true,
      count: rides.length,
      data: {
        rides,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a ride
// @route   PUT /api/rides/:id/accept
// @access  Private (Driver)
exports.acceptRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.status !== "requested") {
      return res.status(400).json({
        success: false,
        message: "Ride is no longer available",
      });
    }

    // Update ride
    ride.driver = req.user.id;
    ride.status = "accepted";
    ride.acceptedAt = new Date();
    await ride.save();

    // Update driver status
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false, // Driver becomes unavailable
    });

    // Notify rider
    await sendNotification(ride.rider, {
      title: "🎉 Ride Accepted!",
      message: `${req.user.name} has accepted your ride request`,
      type: "ride_update",
      data: { rideId: ride._id },
    });

    // Populate ride data
    await ride.populate([
      { path: "rider", select: "name phone profilePicture" },
      {
        path: "driver",
        select: "name phone profilePicture vehicleInfo rating",
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a ride
// @route   PUT /api/rides/:id/start
// @access  Private (Driver)
exports.startRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to start this ride",
      });
    }

    if (ride.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be started",
      });
    }

    // Update ride
    ride.status = "in-progress";
    ride.startedAt = new Date();
    await ride.save();

    // Notify rider
    await sendNotification(ride.rider, {
      title: "🚗 Ride Started",
      message: "Your ride has started. Enjoy your journey!",
      type: "ride_update",
      data: { rideId: ride._id },
    });

    res.status(200).json({
      success: true,
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a ride
// @route   PUT /api/rides/:id/complete
// @access  Private (Driver)
exports.completeRide = async (req, res, next) => {
  try {
    const { actualFare, actualDuration } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this ride",
      });
    }

    if (ride.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be completed",
      });
    }

    // Update ride
    ride.status = "completed";
    ride.completedAt = new Date();
    ride.actualFare = actualFare || ride.estimatedFare;
    ride.actualDuration = actualDuration;
    ride.paymentStatus =
      ride.paymentMethod === "cash" ? "completed" : "pending";
    await ride.save();

    // Update driver stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: {
        totalRides: 1,
        totalEarnings: ride.actualFare,
      },
      isOnline: true, // Driver becomes available again
    });

    // Update rider's ride history
    await User.findByIdAndUpdate(ride.rider, {
      $push: { rideHistory: ride._id },
    });

    // Notify rider
    await sendNotification(ride.rider, {
      title: "✅ Ride Completed",
      message: `Your ride has been completed. Fare: $${ride.actualFare}`,
      type: "ride_update",
      data: { rideId: ride._id },
    });

    res.status(200).json({
      success: true,
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a ride
// @route   PUT /api/rides/:id/cancel
// @access  Private
exports.cancelRide = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Check if user is authorized to cancel
    const isRider = ride.rider.toString() === req.user.id;
    const isDriver = ride.driver && ride.driver.toString() === req.user.id;

    if (!isRider && !isDriver) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this ride",
      });
    }

    if (ride.status === "completed" || ride.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be cancelled",
      });
    }

    // Update ride
    ride.status = "cancelled";
    ride.cancelledAt = new Date();
    ride.cancellationReason = reason;
    await ride.save();

    // If driver cancels, make them available again
    if (isDriver) {
      await User.findByIdAndUpdate(req.user.id, {
        isOnline: true,
      });
    }

    // Notify the other party
    const notifyUserId = isRider ? ride.driver : ride.rider;
    if (notifyUserId) {
      await sendNotification(notifyUserId, {
        title: "❌ Ride Cancelled",
        message: `The ride has been cancelled. Reason: ${reason}`,
        type: "ride_update",
        data: { rideId: ride._id },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's rides
// @route   GET /api/rides/my-rides
// @access  Private
exports.getMyRides = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};

    // Build query based on user role
    if (req.user.role === "rider") {
      query.rider = req.user.id;
    } else if (req.user.role === "driver") {
      query.driver = req.user.id;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate("rider", "name phone profilePicture")
      .populate("driver", "name phone profilePicture vehicleInfo rating")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ride.countDocuments(query);

    res.status(200).json({
      success: true,
      count: rides.length,
      total,
      data: {
        rides,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ride by ID
// @route   GET /api/rides/:id
// @access  Private
exports.getRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("rider", "name phone profilePicture")
      .populate("driver", "name phone profilePicture vehicleInfo rating");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Check if user is authorized to view this ride
    const isRider = ride.rider._id.toString() === req.user.id;
    const isDriver = ride.driver && ride.driver._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isRider && !isDriver && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this ride",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate a ride
// @route   PUT /api/rides/:id/rate
// @access  Private
exports.rateRide = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed rides",
      });
    }

    const isRider = ride.rider.toString() === req.user.id;
    const isDriver = ride.driver && ride.driver.toString() === req.user.id;

    if (!isRider && !isDriver) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to rate this ride",
      });
    }

    // Update rating based on user role
    if (isRider) {
      ride.driverRating = rating;
      ride.driverFeedback = feedback;

      // Update driver's overall rating
      const driverRides = await Ride.find({
        driver: ride.driver,
        status: "completed",
        driverRating: { $exists: true },
      });

      const avgRating =
        driverRides.reduce((sum, r) => sum + r.driverRating, 0) /
        driverRides.length;
      await User.findByIdAndUpdate(ride.driver, { rating: avgRating });
    } else if (isDriver) {
      ride.riderRating = rating;
      ride.riderFeedback = feedback;
    }

    await ride.save();

    res.status(200).json({
      success: true,
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ride location (for real-time tracking)
// @route   PUT /api/rides/:id/location
// @access  Private (Driver)
exports.updateRideLocation = async (req, res, next) => {
  try {
    const { coordinates } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this ride location",
      });
    }

    if (ride.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Can only update location for rides in progress",
      });
    }

    // Update current location
    ride.currentLocation = {
      type: "Point",
      coordinates,
    };

    // Add to route history
    ride.route.push({
      coordinates,
      timestamp: new Date(),
    });

    await ride.save();

    // Emit real-time update via Socket.IO
    req.app.get("io").to(`ride_${ride._id}`).emit("locationUpdate", {
      rideId: ride._id,
      coordinates,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};
