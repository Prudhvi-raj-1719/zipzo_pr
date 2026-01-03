const Report = require('../models/Report');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Notification = require('../models/Notification');

// @desc    Create a report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res, next) => {
  try {
    const { reported, ride, type, description, evidence } = req.body;

    // Verify the ride exists and user was part of it
    const rideDoc = await Ride.findById(ride);
    if (!rideDoc) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user was part of the ride
    const isRider = rideDoc.rider.toString() === req.user.id;
    const isDriver = rideDoc.driver && rideDoc.driver.toString() === req.user.id;

    if (!isRider && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'You can only report users from your rides'
      });
    }

    // Verify reported user exists
    const reportedUser = await User.findById(reported);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found'
      });
    }

    // Create report
    const report = await Report.create({
      reporter: req.user.id,
      reported,
      ride,
      type,
      description,
      evidence: evidence || []
    });

    // Populate report data
    await report.populate([
      { path: 'reporter', select: 'name email' },
      { path: 'reported', select: 'name email' },
      { path: 'ride', select: 'pickup destination status' }
    ]);

    // Notify admins about new report
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await Notification.create({
        user: admin._id,
        title: '🚨 New Report Filed',
        message: `A new ${type.replace('_', ' ')} report has been filed`,
        type: 'warning',
        data: { reportId: report._id }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private/Admin
exports.getReports = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;

    const reports = await Report.find(query)
      .populate('reporter', 'name email profilePicture')
      .populate('reported', 'name email profilePicture')
      .populate('ride', 'pickup destination status requestedAt')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      data: {
        reports
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private/Admin
exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email profilePicture phone')
      .populate('reported', 'name email profilePicture phone')
      .populate('ride', 'pickup destination status requestedAt completedAt actualFare')
      .populate('resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id
// @access  Private/Admin
exports.updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update report
    report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    
    if (status === 'resolved') {
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
    }

    await report.save();

    // Populate updated report
    await report.populate([
      { path: 'reporter', select: 'name email' },
      { path: 'reported', select: 'name email' },
      { path: 'resolvedBy', select: 'name email' }
    ]);

    // Notify reporter about status update
    await Notification.create({
      user: report.reporter._id,
      title: '📋 Report Status Updated',
      message: `Your report has been ${status}`,
      type: status === 'resolved' ? 'success' : 'info',
      data: { reportId: report._id }
    });

    res.status(200).json({
      success: true,
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's reports
// @route   GET /api/reports/my-reports
// @access  Private
exports.getMyReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reports = await Report.find({ reporter: req.user.id })
      .populate('reported', 'name profilePicture')
      .populate('ride', 'pickup destination status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments({ reporter: req.user.id });

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      data: {
        reports
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report statistics
// @route   GET /api/reports/stats
// @access  Private/Admin
exports.getReportStats = async (req, res, next) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Report.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ 
      status: { $in: ['pending', 'investigating'] }
    });

    // Recent reports trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReports = await Report.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        pendingReports,
        recentReports,
        byStatus: stats,
        byType: typeStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private/Admin
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};