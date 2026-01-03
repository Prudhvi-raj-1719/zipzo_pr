const express = require('express');
const {
  createReport,
  getReports,
  getReport,
  updateReport,
  getMyReports,
  getReportStats,
  deleteReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { validateReport, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// User routes
router.post('/', validateReport, handleValidationErrors, createReport);
router.get('/my-reports', getMyReports);

// Admin routes
router.get('/', authorize('admin'), getReports);
router.get('/stats', authorize('admin'), getReportStats);
router.get('/:id', authorize('admin'), getReport);
router.put('/:id', authorize('admin'), updateReport);
router.delete('/:id', authorize('admin'), deleteReport);

module.exports = router;