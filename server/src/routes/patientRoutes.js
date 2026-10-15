const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  lookupPatient,
  assistPatient,
  deletePatient
} = require('../controllers/patientController');
const { getPatientTriageHistory } = require('../controllers/triageController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Public lookup for patient self-service
router.get('/lookup/:identifier', lookupPatient);

// 1. ALL roles (Admin, Health Worker, Doctor) can access patient directory & particulars
router.get('/', protect, requireRole('admin', 'health_worker', 'doctor'), getPatients);
router.get('/:id', protect, requireRole('admin', 'health_worker', 'doctor'), getPatientById);
router.get('/:id/triage', protect, requireRole('admin', 'health_worker', 'doctor'), getPatientTriageHistory);

// 2. Health Workers and Admin can create patients info and enter particulars
router.post('/', protect, requireRole('admin', 'health_worker'), createPatient);
router.put('/:id', protect, requireRole('admin', 'health_worker'), updatePatient);

// 3. Doctors (and Admin) can assist the patient with diagnosis, prescriptions & referrals
router.post('/:id/assist', protect, requireRole('doctor', 'admin'), assistPatient);

// 4. STRICTLY Admin only can delete patient records (Doctors & Workers CANNOT delete)
router.delete('/:id', protect, requireRole('admin'), deletePatient);

module.exports = router;
