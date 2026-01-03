const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  verifyDriver,
  uploadAvatar,
  uploadDocuments,
  getNearbyDrivers,
  updateLocation,
  toggleOnlineStatus,
  getDashboardStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');
const { validateVehicleInfo, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// General user routes
router.get('/dashboard-stats', getDashboardStats);
router.get('/nearby-drivers', getNearbyDrivers);
router.put('/update-location', authorize('driver'), updateLocation);
router.put('/toggle-online', authorize('driver'), toggleOnlineStatus);
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);
router.post('/upload-documents', authorize('driver'), upload.array('documents', 5), uploadDocuments);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/verify', authorize('admin'), verifyDriver);

module.exports = router;