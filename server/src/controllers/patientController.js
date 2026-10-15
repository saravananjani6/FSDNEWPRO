const Patient = require('../models/Patient');
const crypto = require('crypto');
const uuidv4 = () => (crypto.randomUUID ? crypto.randomUUID() : ('loc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)));

// Generate unique readable patient ID
const generatePatientId = async () => {
  const count = await Patient.countDocuments();
  const nextNum = 10001 + count;
  return `P-${nextNum}`;
};

// @desc    Get all patients with search & filter
// @route   GET /api/patients
// @access  Private (Worker, Doctor, Admin)
const getPatients = async (req, res, next) => {
  try {
    const { search, village, limit = 50, page = 1 } = req.query;
    let query = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { patientId: searchRegex },
        { phone: searchRegex },
        { village: searchRegex }
      ];
    }

    if (village) {
      query.village = new RegExp(village, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: patients.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient by ID or localId
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let patient = null;

    // Check if id is valid mongo id or patientId or localId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(id);
    }
    if (!patient) {
      patient = await Patient.findOne({
        $or: [{ patientId: id }, { localId: id }],
        isDeleted: false
      });
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res, next) => {
  try {
    const {
      name,
      age,
      gender,
      village,
      phone,
      emergencyContact,
      address,
      localId,
      patientId,
      deviceId
    } = req.body;

    if (!name || age === undefined || !gender || !village) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, gender, and village are required fields'
      });
    }

    // Check if already created via this localId (idempotency)
    const effectiveLocalId = localId || uuidv4();
    const existing = await Patient.findOne({ localId: effectiveLocalId });
    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing,
        message: 'Patient already existed with this localId (idempotent response)'
      });
    }

    const assignedPatientId = patientId || (await generatePatientId());

    const patient = await Patient.create({
      patientId: assignedPatientId,
      localId: effectiveLocalId,
      name,
      age: Number(age),
      gender,
      village,
      phone: phone || '',
      emergencyContact: emergencyContact || '',
      address: address || '',
      registeredBy: req.user ? req.user.name : 'Health Worker',
      deviceId: deviceId || 'web-online',
      version: 1,
      syncStatus: 'synced'
    });

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient with optimistic concurrency version check
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { version, ...updateFields } = req.body;

    let patient = await Patient.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { patientId: id }, { localId: id }]
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Version checking for conflict detection
    if (version !== undefined && version < patient.version) {
      return res.status(409).json({
        success: false,
        message: `Conflict detected: Server has newer version (${patient.version}) than client (${version})`,
        serverVersion: patient.version,
        serverRecord: patient
      });
    }

    Object.assign(patient, updateFields);
    patient.version = (patient.version || 1) + 1;
    patient.syncStatus = 'synced';
    await patient.save();

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lookup patient by phone or patientId (public for patient lookup)
// @route   GET /api/patients/lookup/:identifier
// @access  Public
const lookupPatient = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide phone number or Patient ID' });
    }

    const patient = await Patient.findOne({
      $or: [
        { patientId: identifier.trim() },
        { phone: identifier.trim() },
        { localId: identifier.trim() }
      ],
      isDeleted: false
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'No patient record found matching that ID or phone number' });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor assists patient with clinical notes, diagnosis, prescription, referral
// @route   POST /api/patients/:id/assist
// @access  Private (Doctor, Admin)
const assistPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosis, notes, prescription, referral, action } = req.body;

    let patient = await Patient.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { patientId: id },
        { localId: id }
      ]
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const assistanceEntry = {
      doctorId: req.user ? (req.user._id || req.user.id) : 'doc-offline',
      doctorName: req.user ? req.user.name : 'Dr. Medical Officer',
      doctorRole: req.user ? req.user.role : 'doctor',
      diagnosis: diagnosis || '',
      notes: notes || '',
      prescription: prescription || '',
      referral: referral || '',
      action: action || 'Clinical Consultation Completed',
      assistedAt: new Date()
    };

    if (!patient.doctorAssistance) {
      patient.doctorAssistance = [];
    }

    patient.doctorAssistance.push(assistanceEntry);
    patient.version = (patient.version || 1) + 1;
    patient.updatedAt = new Date();
    await patient.save();

    res.json({
      success: true,
      message: 'Clinical assistance record saved successfully by doctor',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient (Strictly Admin only)
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Doctors and health workers cannot delete patient records. Only administrators are authorized.'
      });
    }

    const patient = await Patient.findOneAndDelete({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { patientId: id },
        { localId: id }
      ]
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      message: `Patient ${patient.name} (${patient.patientId}) successfully deleted by administrator`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  lookupPatient,
  assistPatient,
  deletePatient
};

