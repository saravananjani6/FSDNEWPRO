const express = require('express');
const Patient = require('../models/Patient');
const TriageRecord = require('../models/TriageRecord');
const Clinic = require('../models/Clinic');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../utils/validate');

const router = express.Router();
router.use(protect);

const rules = (validationRules) => (req, res, next) => {
  req.validationRules = validationRules;
  next();
};

router.post('/', rules([
  { field: 'records', required: true, array: true },
  { field: 'patients', array: true }
]), validate, async (req, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'] || req.body.deviceId || 'unknown';
    const savedRecords = [];
    const savedPatients = [];

    for (const p of req.body.patients || []) {
      const existing = await Patient.findOne({ localId: p.localId, registeredBy: req.user._id });
      if (!existing || new Date(p.updatedAt) >= new Date(existing.updatedAt)) {
        const saved = await Patient.findOneAndUpdate(
          { localId: p.localId, registeredBy: req.user._id },
          { ...p, registeredBy: req.user._id, updatedAt: p.updatedAt || new Date() },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        savedPatients.push({ localId: p.localId, id: saved._id, updatedAt: saved.updatedAt });
      }
    }

    for (const r of req.body.records) {
      const existing = await TriageRecord.findOne({ localId: r.localId, deviceId });
      if (!existing || new Date(r.updatedAt) >= new Date(existing.updatedAt)) {
        const patient = r.patientLocalId ? await Patient.findOne({ localId: r.patientLocalId, registeredBy: req.user._id }) : null;
        const saved = await TriageRecord.findOneAndUpdate(
          { localId: r.localId, deviceId },
          { ...r, patient: patient?._id, worker: req.user._id, deviceId, syncedAt: new Date() },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        savedRecords.push({ localId: r.localId, id: saved._id, updatedAt: saved.updatedAt });
      }
    }
    res.json({ ok: true, records: savedRecords, patients: savedPatients });
  } catch (error) {
    next(error);
  }
});

router.get('/delta', async (req, res, next) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Number(req.query.limit || 25), 100);
    const clinics = await Clinic.find({ updatedAt: { $gt: since }, isActive: true }).skip((page - 1) * limit).limit(limit).lean();
    res.json({ clinics, page, limit });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
