const { body, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
exports.validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['rider', 'driver'])
    .withMessage('Role must be either rider or driver')
];

// User login validation
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Ride booking validation
exports.validateRideBooking = [
  body('pickup.address')
    .notEmpty()
    .withMessage('Pickup address is required'),
  body('pickup.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Pickup coordinates must be an array of [longitude, latitude]'),
  body('destination.address')
    .notEmpty()
    .withMessage('Destination address is required'),
  body('destination.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Destination coordinates must be an array of [longitude, latitude]'),
  body('paymentMethod')
    .isIn(['cash', 'upi', 'card'])
    .withMessage('Payment method must be cash, upi, or card')
];

// Profile update validation
exports.validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('emergencyContact')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid emergency contact number')
];

// Driver vehicle info validation
exports.validateVehicleInfo = [
  body('vehicleInfo.make')
    .notEmpty()
    .withMessage('Vehicle make is required'),
  body('vehicleInfo.model')
    .notEmpty()
    .withMessage('Vehicle model is required'),
  body('vehicleInfo.year')
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid vehicle year'),
  body('vehicleInfo.color')
    .notEmpty()
    .withMessage('Vehicle color is required'),
  body('vehicleInfo.licensePlate')
    .notEmpty()
    .withMessage('License plate is required'),
  body('licenseNumber')
    .notEmpty()
    .withMessage('License number is required')
];

// Report validation
exports.validateReport = [
  body('reported')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('ride')
    .isMongoId()
    .withMessage('Please provide a valid ride ID'),
  body('type')
    .isIn(['inappropriate_behavior', 'safety_concern', 'fare_dispute', 'vehicle_issue', 'other'])
    .withMessage('Please provide a valid report type'),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
];