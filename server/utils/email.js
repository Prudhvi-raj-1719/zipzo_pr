const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email
exports.sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `Zipzo <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Zipzo!';
  const message = `
    Hi ${user.name},
    
    Welcome to Zipzo! We're excited to have you on board.
    
    ${user.role === 'rider' ? 
      'You can now start booking rides with verified drivers in your area.' :
      'Please complete your driver verification to start accepting ride requests.'
    }
    
    If you have any questions, feel free to contact our support team.
    
    Best regards,
    The Zipzo Team
  `;

  return await this.sendEmail({
    email: user.email,
    subject,
    message
  });
};

// Send ride confirmation email
exports.sendRideConfirmationEmail = async (user, ride) => {
  const subject = 'Ride Confirmation - Zipzo';
  const message = `
    Hi ${user.name},
    
    Your ride has been confirmed!
    
    Pickup: ${ride.pickup.address}
    Destination: ${ride.destination.address}
    Estimated Fare: $${ride.estimatedFare}
    
    Your driver will contact you shortly.
    
    Best regards,
    The Zipzo Team
  `;

  return await this.sendEmail({
    email: user.email,
    subject,
    message
  });
};

// Send ride completion email
exports.sendRideCompletionEmail = async (user, ride) => {
  const subject = 'Ride Completed - Zipzo';
  const message = `
    Hi ${user.name},
    
    Your ride has been completed successfully!
    
    From: ${ride.pickup.address}
    To: ${ride.destination.address}
    Final Fare: $${ride.actualFare}
    
    Thank you for choosing Zipzo!
    
    Best regards,
    The Zipzo Team
  `;

  return await this.sendEmail({
    email: user.email,
    subject,
    message
  });
};

// Send driver verification email
exports.sendDriverVerificationEmail = async (driver) => {
  const subject = 'Driver Verification Approved - Zipzo';
  const message = `
    Hi ${driver.name},
    
    Congratulations! Your driver account has been verified.
    
    You can now:
    - Go online to receive ride requests
    - Start earning money with Zipzo
    - Access all driver features
    
    Welcome to the Zipzo driver community!
    
    Best regards,
    The Zipzo Team
  `;

  return await this.sendEmail({
    email: driver.email,
    subject,
    message
  });
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, resetUrl) => {
  const subject = 'Password Reset Request - Zipzo';
  const message = `
    Hi ${user.name},
    
    You requested a password reset for your Zipzo account.
    
    Please click the link below to reset your password:
    ${resetUrl}
    
    This link will expire in 10 minutes.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    The Zipzo Team
  `;

  return await this.sendEmail({
    email: user.email,
    subject,
    message
  });
};

// Send emergency alert email
exports.sendEmergencyAlertEmail = async (adminEmail, user, location, message) => {
  const subject = '🚨 EMERGENCY ALERT - Zipzo';
  const emailMessage = `
    EMERGENCY ALERT
    
    User: ${user.name} (${user.email})
    Phone: ${user.phone}
    Location: ${location}
    Message: ${message}
    Time: ${new Date().toLocaleString()}
    
    Please take immediate action.
    
    Zipzo Emergency System
  `;

  return await this.sendEmail({
    email: adminEmail,
    subject,
    message: emailMessage
  });
};

// Send bulk email
exports.sendBulkEmail = async (recipients, subject, message) => {
  try {
    const transporter = createTransporter();
    const promises = [];

    for (const recipient of recipients) {
      const mailOptions = {
        from: `Zipzo <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject,
        text: message.replace('{{name}}', recipient.name),
        html: `<p>${message.replace('{{name}}', recipient.name)}</p>`
      };

      promises.push(transporter.sendMail(mailOptions));
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Bulk email sent: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  } catch (error) {
    console.error('Bulk email sending failed:', error);
    throw error;
  }
};