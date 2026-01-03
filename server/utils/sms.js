const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send SMS
exports.sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log('SMS sent:', result.sid);
    return result;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

// Send OTP SMS
exports.sendOTP = async (phone, otp) => {
  const message = `Your Zipzo verification code is: ${otp}. This code will expire in 5 minutes.`;
  return await this.sendSMS(phone, message);
};

// Send ride notification SMS
exports.sendRideNotificationSMS = async (phone, rideDetails) => {
  const message = `Zipzo: Your ride from ${rideDetails.pickup} to ${rideDetails.destination} has been ${rideDetails.status}. Driver: ${rideDetails.driverName}`;
  return await this.sendSMS(phone, message);
};

// Send emergency alert SMS
exports.sendEmergencyAlertSMS = async (phone, userName, location) => {
  const message = `🚨 EMERGENCY ALERT: ${userName} needs help at ${location}. Please contact them immediately or call emergency services.`;
  return await this.sendSMS(phone, message);
};

// Send driver arrival SMS
exports.sendDriverArrivalSMS = async (phone, driverName, vehicleInfo) => {
  const message = `Zipzo: Your driver ${driverName} has arrived! Look for ${vehicleInfo.color} ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.licensePlate})`;
  return await this.sendSMS(phone, message);
};

// Send ride completion SMS
exports.sendRideCompletionSMS = async (phone, fare) => {
  const message = `Zipzo: Your ride has been completed. Total fare: $${fare}. Thank you for choosing Zipzo!`;
  return await this.sendSMS(phone, message);
};

// Send bulk SMS
exports.sendBulkSMS = async (recipients, message) => {
  try {
    const promises = recipients.map(recipient => 
      this.sendSMS(recipient.phone, message.replace('{{name}}', recipient.name))
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Bulk SMS sent: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  } catch (error) {
    console.error('Bulk SMS sending failed:', error);
    throw error;
  }
};

// Validate phone number format
exports.validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Format phone number for Twilio
exports.formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.length === 10) {
    return `+1${cleaned}`; // Assuming US numbers
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phone; // Return as-is if already formatted
};