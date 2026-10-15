const express = require('express');
const router = express.Router();
const {
  createTriageRecord,
  getTriageById,
  getDashboardMetrics,
  getAllTriageRecords
} = require('../controllers/triageController');
const { protect, optionalAuth, requireAdmin } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

// Patient Kiosk / Self-Assessment Creation
router.post('/', optionalAuth, logAudit('TRIAGE_ASSESSMENT_CREATE', 'TriageRecord'), createTriageRecord);
router.get('/:id', optionalAuth, getTriageById);

// Admin-Protected Metrics & Triage Queue
router.get('/dashboard/metrics', protect, requireAdmin, getDashboardMetrics);
router.get('/', protect, requireAdmin, getAllTriageRecords);

module.exports = router;

