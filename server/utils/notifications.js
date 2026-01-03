const Notification = require('../models/Notification');
const { sendEmail } = require('./email');
const { sendSMS } = require('./sms');

// Send notification to user
exports.sendNotification = async (userId, notificationData) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      user: userId,
      ...notificationData
    });

    // Get user details for email/SMS
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      console.error('User not found for notification:', userId);
      return notification;
    }

    // Send real-time notification via Socket.IO if available
    const io = global.io;
    if (io) {
      io.to(`user_${userId}`).emit('newNotification', notification);
    }

    // Send email notification for important types
    const emailTypes = ['ride_request', 'ride_update', 'emergency', 'payment'];
    if (emailTypes.includes(notificationData.type)) {
      try {
        await sendEmail({
          email: user.email,
          subject: notificationData.title,
          message: notificationData.message
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    // Send SMS for emergency notifications
    if (notificationData.type === 'emergency') {
      try {
        await sendSMS(user.phone, notificationData.message);
      } catch (error) {
        console.error('Failed to send SMS notification:', error);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send bulk notifications
exports.sendBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await this.sendNotification(userId, notificationData);
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

// Send notification to all users of a specific role
exports.sendRoleNotification = async (role, notificationData) => {
  try {
    const User = require('../models/User');
    const users = await User.find({ role, isActive: true }).select('_id');
    const userIds = users.map(user => user._id);
    
    return await this.sendBulkNotifications(userIds, notificationData);
  } catch (error) {
    console.error('Error sending role notification:', error);
    throw error;
  }
};

// Send emergency alert
exports.sendEmergencyAlert = async (userId, location, message) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Send to emergency contact if available
    if (user.emergencyContact) {
      try {
        await sendSMS(user.emergencyContact, 
          `EMERGENCY ALERT: ${user.name} needs help. Location: ${location}. Message: ${message}`
        );
      } catch (error) {
        console.error('Failed to send emergency SMS:', error);
      }
    }

    // Notify all nearby drivers
    const nearbyDrivers = await User.find({
      role: 'driver',
      isActive: true,
      isOnline: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location
          },
          $maxDistance: 5000 // 5km radius
        }
      }
    });

    const driverIds = nearbyDrivers.map(driver => driver._id);
    await this.sendBulkNotifications(driverIds, {
      title: '🚨 EMERGENCY ALERT',
      message: `Emergency situation nearby. Please assist if possible.`,
      type: 'emergency',
      data: { userId, location, message }
    });

    // Notify admins
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const adminIds = admins.map(admin => admin._id);
    
    await this.sendBulkNotifications(adminIds, {
      title: '🚨 EMERGENCY ALERT',
      message: `Emergency alert from ${user.name}. Immediate attention required.`,
      type: 'emergency',
      data: { userId, location, message }
    });

    return true;
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    throw error;
  }
};

// Clean up old notifications
exports.cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    throw error;
  }
};

// Get notification preferences for user
exports.getNotificationPreferences = async (userId) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    // Default preferences if not set
    return {
      email: true,
      sms: user.role === 'driver', // SMS for drivers by default
      push: true,
      rideUpdates: true,
      promotions: false,
      emergencyAlerts: true
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return {};
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (userId, preferences) => {
  try {
    // In a real app, you'd store these preferences in the user model
    // For now, we'll just return success
    console.log(`Updated notification preferences for user ${userId}:`, preferences);
    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};