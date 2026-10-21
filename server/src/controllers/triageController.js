const TriageRecord = require('../models/TriageRecord');
const Patient = require('../models/Patient');
const { evaluateTriage } = require('../services/triageEngine');
const crypto = require('crypto');
const uuidv4 = () => (crypto.randomUUID ? crypto.randomUUID() : ('rec-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)));

// Generate triage record ID
const generateRecordId = async () => {
  const count = await TriageRecord.countDocuments();
  const nextNum = 10001 + count;
  return `TR-${nextNum}`;
};

// @desc    Perform & save a triage assessment
// @route   POST /api/triage
// @access  Private
const createTriageRecord = async (req, res, next) => {
  try {
    const {
      patientId,
      symptoms = {},
      vitals = {},
      notes = '',
      localId,
      deviceId,
      triageLevel: clientTriageLevel,
      recommendationEn: clientRecEn,
      recommendationTa: clientRecTa,
      redFlags: clientRedFlags,
      confidenceScore: clientConfidenceScore,
      confidenceLabel: clientConfidenceLabel
    } = req.body;

    // Lookup patient
    const patient = patientId ? await Patient.findOne({
      $or: [{ patientId }, { localId: patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }]
    }) : null;

    const patientAge = patient ? patient.age : 30;
    const patientName = patient ? patient.name : 'Unknown';
    const patientGender = patient ? patient.gender : 'other';

    // Run triage engine evaluation if not pre-evaluated or verify client result
    const evaluated = evaluateTriage(symptoms, vitals, patientAge);

    const effectiveLevel = clientTriageLevel || evaluated.triageLevel;
    const effectiveRecEn = clientRecEn || evaluated.recommendationEn;
    const effectiveRecTa = clientRecTa || evaluated.recommendationTa;
    const effectiveRedFlags = clientRedFlags && clientRedFlags.length ? clientRedFlags : evaluated.redFlags;

    const effectiveLocalId = localId || uuidv4();

    // Idempotency check
    const existing = await TriageRecord.findOne({ localId: effectiveLocalId });
    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing,
        message: 'Triage record already exists with this localId (idempotent)'
      });
    }

    const assignedRecordId = await generateRecordId();

    const record = await TriageRecord.create({
      recordId: assignedRecordId,
      localId: effectiveLocalId,
      patientId: patient ? patient.patientId : patientId,
      patientName: patient ? patientName : 'Anonymous self-assessment',
      patientAge,
      patientGender,
      symptoms,
      vitals,
      triageLevel: effectiveLevel,
      redFlags: effectiveRedFlags,
      recommendationEn: effectiveRecEn,
      recommendationTa: effectiveRecTa,
      confidenceScore: Number.isFinite(Number(clientConfidenceScore)) ? Number(clientConfidenceScore) : undefined,
      confidenceLabel: clientConfidenceLabel || '',
      notes,
      healthcareWorkerId: req.user ? req.user._id : 'worker-local',
      healthcareWorkerName: req.user ? req.user.name : 'VMcare Health Worker',
      deviceId: deviceId || 'web-online',
      version: 1,
      syncStatus: 'synced'
    });

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single triage record
// @route   GET /api/triage/:id
// @access  Private
const getTriageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let record = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      record = await TriageRecord.findById(id);
    }
    if (!record) {
      record = await TriageRecord.findOne({
        $or: [{ recordId: id }, { localId: id }]
      });
    }

    if (!record) {
      return res.status(404).json({ success: false, message: 'Triage record not found' });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all triage history for a patient
// @route   GET /api/patients/:id/triage
// @access  Private
const getPatientTriageHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const records = await TriageRecord.find({
      $or: [{ patientId: id }, { localId: id }]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics & summary
// @route   GET /api/triage/dashboard/metrics
// @access  Private
const getDashboardMetrics = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      totalTriage,
      todayTriage,
      emergencyCount,
      urgentCount,
      nonUrgentCount,
      recentRecords
    ] = await Promise.all([
      Patient.countDocuments({ isDeleted: false }),
      TriageRecord.countDocuments(),
      TriageRecord.countDocuments({ createdAt: { $gte: startOfToday } }),
      TriageRecord.countDocuments({ triageLevel: 'EMERGENCY' }),
      TriageRecord.countDocuments({ triageLevel: 'URGENT' }),
      TriageRecord.countDocuments({ triageLevel: 'NON-URGENT' }),
      TriageRecord.find().sort({ createdAt: -1 }).limit(10)
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        totalTriage,
        todayTriage,
        emergencyCount,
        urgentCount,
        nonUrgentCount,
        recentRecords
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all triage records with filters (for Admin Queue)
// @route   GET /api/triage
// @access  Admin
const getAllTriageRecords = async (req, res, next) => {
  try {
    const { level, search, limit = 50, page = 1 } = req.query;
    let query = {};
    if (level && ['EMERGENCY', 'URGENT', 'NON-URGENT'].includes(level.toUpperCase())) {
      query.triageLevel = level.toUpperCase();
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { patientName: searchRegex },
        { patientId: searchRegex },
        { recordId: searchRegex }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await TriageRecord.countDocuments(query);
    const records = await TriageRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: records.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: records
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTriageRecord,
  getTriageById,
  getPatientTriageHistory,
  getDashboardMetrics,
  getAllTriageRecords
};

