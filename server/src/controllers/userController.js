const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const SyncLog = require('../models/SyncLog');
const Patient = require('../models/Patient');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status / role (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive, phone, assignedVillage } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (phone !== undefined) user.phone = phone;
    if (assignedVillage !== undefined) user.assignedVillage = assignedVillage;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        assignedVillage: user.assignedVillage
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system audit logs
// @route   GET /api/users/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conflicts and unresolved sync issues
// @route   GET /api/users/conflicts
// @access  Private/Admin/Doctor
const getConflicts = async (req, res, next) => {
  try {
    const conflictLogs = await SyncLog.find({ status: 'conflict' })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: conflictLogs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve a conflict manually
// @route   POST /api/users/resolve-conflict
// @access  Private/Admin/Doctor
const resolveConflict = async (req, res, next) => {
  try {
    const { recordId, entityType, winningData, resolutionStrategy } = req.body;

    if (!recordId || !entityType || !winningData) {
      return res.status(400).json({ success: false, message: 'Missing conflict resolution data' });
    }

    if (entityType === 'patient') {
      const patient = await Patient.findOne({
        $or: [{ patientId: recordId }, { localId: recordId }]
      });

      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient record not found' });
      }

      Object.assign(patient, winningData);
      patient.version = (patient.version || 1) + 1;
      patient.syncStatus = 'synced';
      await patient.save();

      await SyncLog.create({
        deviceId: 'admin-console',
        userId: req.user ? req.user._id : 'admin',
        recordId,
        entityType: 'patient',
        operation: 'RESOLVE_CONFLICT',
        status: 'success',
        errorMessage: `Resolved via strategy: ${resolutionStrategy || 'manual-override'}`
      });

      return res.json({
        success: true,
        message: 'Conflict resolved successfully',
        data: patient
      });
    }

    res.status(400).json({ success: false, message: 'Unsupported entity type for conflict resolution' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUser,
  getAuditLogs,
  getConflicts,
  resolveConflict
};
