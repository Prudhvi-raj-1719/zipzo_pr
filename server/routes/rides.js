const express = require('express');
const {
  bookRide,
  getAvailableRides,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
  getMyRides,
  getRide,
  rateRide,
  updateRideLocation
} = require('../controllers/rideController');
const { protect, authorize, requireVerification } = require('../middleware/auth');
const { validateRideBooking, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Rider routes
router.post('/', authorize('rider'), validateRideBooking, handleValidationErrors, bookRide);
router.get('/my-rides', getMyRides);
router.get('/:id', getRide);
router.put('/:id/rate', rateRide);
router.put('/:id/cancel', cancelRide);

// Driver routes
router.get('/available', authorize('driver'), requireVerification, getAvailableRides);
router.put('/:id/accept', authorize('driver'), requireVerification, acceptRide);
router.put('/:id/start', authorize('driver'), requireVerification, startRide);
router.put('/:id/complete', authorize('driver'), requireVerification, completeRide);
router.put('/:id/location', authorize('driver'), requireVerification, updateRideLocation);

module.exports = router;