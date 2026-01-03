const User = require('../models/User');
const Ride = require('../models/Ride');
const Report = require('../models/Report');
const { uploadToCloudinary } = require('../utils/fileUpload');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { role, isVerified, isActive, page = 1, limit = 10, search } = req.query;
    
    const query = {};
    
    // Build query filters
    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    let stats = {};
    
    if (user.role === 'rider') {
      const rideCount = await Ride.countDocuments({ rider: user._id });
      const completedRides = await Ride.countDocuments({ 
        rider: user._id, 
        status: 'completed' 
      });
      
      stats = {
        totalRides: rideCount,
        completedRides,
        cancelledRides: rideCount - completedRides
      };
    } else if (user.role === 'driver') {
      const rideCount = await Ride.countDocuments({ driver: user._id });
      const completedRides = await Ride.countDocuments({ 
        driver: user._id, 
        status: 'completed' 
      });
      
      stats = {
        totalRides: rideCount,
        completedRides,
        cancelledRides: rideCount - completedRides,
        totalEarnings: user.totalEarnings
      };
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - deactivate user instead of removing
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify driver
// @route   PUT /api/users/:id/verify
// @access  Private/Admin
exports.verifyDriver = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'driver') {
      return res.status(400).json({
        success: false,
        message: 'Only drivers can be verified'
      });
    }

    user.isVerified = true;
    await user.save();

    // Send notification to driver
    const Notification = require('../models/Notification');
    await Notification.create({
      user: user._id,
      title: '✅ Driver Verification Approved',
      message: 'Congratulations! Your driver account has been verified. You can now start accepting ride requests.',
      type: 'success'
    });

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'zipzo/avatars',
      width: 300,
      height: 300,
      crop: 'fill'
    });

    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: result.secure_url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: {
        user,
        imageUrl: result.secure_url
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload driver documents
// @route   POST /api/users/upload-documents
// @access  Private/Driver
exports.uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload documents'
      });
    }

    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.buffer, {
        folder: 'zipzo/documents',
        resource_type: 'auto'
      })
    );

    const results = await Promise.all(uploadPromises);
    const documentUrls = results.map(result => result.secure_url);

    // Update user documents
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        licenseDocument: documentUrls[0], // Assuming first document is license
        isVerified: false // Reset verification status for admin review
      },
      { new: true }
    ).select('-password');

    // Notify admin about new document upload
    const adminUsers = await User.find({ role: 'admin' });
    const Notification = require('../models/Notification');
    
    for (const admin of adminUsers) {
      await Notification.create({
        user: admin._id,
        title: '📄 New Driver Documents',
        message: `${user.name} has uploaded new documents for verification`,
        type: 'info',
        data: { userId: user._id }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        documentUrls
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby drivers
// @route   GET /api/users/nearby-drivers
// @access  Private
exports.getNearbyDrivers = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const drivers = await User.find({
      role: 'driver',
      isActive: true,
      isVerified: true,
      isOnline: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    }).select('name profilePicture vehicleInfo rating currentLocation');

    res.status(200).json({
      success: true,
      count: drivers.length,
      data: {
        drivers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver location
// @route   PUT /api/users/update-location
// @access  Private/Driver
exports.updateLocation = async (req, res, next) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [longitude, latitude] are required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        currentLocation: {
          type: 'Point',
          coordinates
        }
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle driver online status
// @route   PUT /api/users/toggle-online
// @access  Private/Driver
exports.toggleOnlineStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can toggle online status'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Driver verification required to go online'
      });
    }

    user.isOnline = !user.isOnline;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user,
        isOnline: user.isOnline
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    let stats = {};

    if (req.user.role === 'rider') {
      const totalRides = await Ride.countDocuments({ rider: req.user.id });
      const completedRides = await Ride.countDocuments({ 
        rider: req.user.id, 
        status: 'completed' 
      });
      const totalSpent = await Ride.aggregate([
        { $match: { rider: req.user._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$actualFare' } } }
      ]);

      stats = {
        totalRides,
        completedRides,
        totalSpent: totalSpent[0]?.total || 0,
        averageRating: req.user.rating || 0
      };
    } else if (req.user.role === 'driver') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayRides = await Ride.countDocuments({
        driver: req.user.id,
        status: 'completed',
        completedAt: { $gte: today }
      });

      const todayEarnings = await Ride.aggregate([
        { 
          $match: { 
            driver: req.user._id, 
            status: 'completed',
            completedAt: { $gte: today }
          } 
        },
        { $group: { _id: null, total: { $sum: '$actualFare' } } }
      ]);

      stats = {
        totalRides: req.user.totalRides,
        totalEarnings: req.user.totalEarnings,
        todayRides,
        todayEarnings: todayEarnings[0]?.total || 0,
        rating: req.user.rating,
        isOnline: req.user.isOnline
      };
    } else if (req.user.role === 'admin') {
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalDrivers = await User.countDocuments({ role: 'driver', isActive: true });
      const activeDrivers = await User.countDocuments({ 
        role: 'driver', 
        isActive: true, 
        isOnline: true 
      });
      const totalRides = await Ride.countDocuments();
      const pendingVerifications = await User.countDocuments({ 
        role: 'driver', 
        isVerified: false,
        isActive: true
      });
      const activeReports = await Report.countDocuments({ 
        status: { $in: ['pending', 'investigating'] }
      });

      const monthlyRevenue = await Ride.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$actualFare' } } }
      ]);

      stats = {
        totalUsers,
        totalDrivers,
        activeDrivers,
        totalRides,
        pendingVerifications,
        activeReports,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      };
    }

    res.status(200).json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};