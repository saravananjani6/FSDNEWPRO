const Patient = require('../models/Patient');
const TriageRecord = require('../models/TriageRecord');
const SyncLog = require('../models/SyncLog');
const crypto = require('crypto');
const uuidv4 = () => (crypto.randomUUID ? crypto.randomUUID() : ('sync-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)));

// Helper to generate human patient IDs
const generatePatientId = async () => {
  const count = await Patient.countDocuments();
  return `P-${10001 + count}`;
};

// Helper to generate triage record IDs
const generateRecordId = async () => {
  const count = await TriageRecord.countDocuments();
  return `TR-${10001 + count}`;
};

// @desc    Push batch of offline records to central server
// @route   POST /api/sync/push
// @access  Private (Worker, Doctor, Admin)
const pushSync = async (req, res, next) => {
  try {
    const { deviceId = 'unknown-device', patients = [], triageRecords = [] } = req.body;

    const processedPatients = [];
    const processedTriage = [];
    const conflicts = [];

    // --- 1. PROCESS PATIENTS ---
    for (const item of patients) {
      const {
        localId,
        patientId,
        name,
        age,
        gender,
        village,
        phone,
        emergencyContact,
        address,
        version = 1,
        registeredBy,
        operation = 'CREATE'
      } = item;

      if (!localId || !name) {
        continue;
      }

      try {
        let existing = await Patient.findOne({
          $or: [{ localId }, { patientId: patientId || '__none__' }]
        });

        if (!existing) {
          // New record created offline
          const assignedId = patientId || (await generatePatientId());
          const newPatient = await Patient.create({
            localId,
            patientId: assignedId,
            name,
            age: Number(age) || 0,
            gender: gender || 'other',
            village: village || 'Unknown Village',
            phone: phone || '',
            emergencyContact: emergencyContact || '',
            address: address || '',
            registeredBy: registeredBy || (req.user ? req.user.name : 'Health Worker'),
            deviceId,
            version: 1,
            syncStatus: 'synced'
          });

          await SyncLog.create({
            deviceId,
            userId: req.user ? req.user._id : 'anonymous',
            recordId: assignedId,
            entityType: 'patient',
            operation: 'CREATE',
            status: 'success',
            clientVersion: version,
            serverVersion: 1
          });

          processedPatients.push({
            localId,
            serverId: newPatient._id,
            patientId: newPatient.patientId,
            version: newPatient.version,
            syncStatus: 'synced',
            updatedAt: newPatient.updatedAt
          });
        } else {
          // Existing record: Conflict detection check
          if (version < existing.version) {
            // Server has newer modifications!
            conflicts.push({
              entityType: 'patient',
              localId,
              patientId: existing.patientId,
              clientRecord: item,
              serverRecord: existing,
              reason: `Server version (${existing.version}) is ahead of client version (${version})`
            });

            await SyncLog.create({
              deviceId,
              userId: req.user ? req.user._id : 'anonymous',
              recordId: existing.patientId,
              entityType: 'patient',
              operation: 'UPDATE',
              status: 'conflict',
              clientVersion: version,
              serverVersion: existing.version,
              errorMessage: 'Client version behind server version'
            });
          } else {
            // Safe to update
            existing.name = name || existing.name;
            existing.age = age !== undefined ? Number(age) : existing.age;
            existing.gender = gender || existing.gender;
            existing.village = village || existing.village;
            existing.phone = phone !== undefined ? phone : existing.phone;
            existing.emergencyContact = emergencyContact !== undefined ? emergencyContact : existing.emergencyContact;
            existing.address = address !== undefined ? address : existing.address;
            existing.version = (existing.version || 1) + 1;
            existing.syncStatus = 'synced';
            await existing.save();

            await SyncLog.create({
              deviceId,
              userId: req.user ? req.user._id : 'anonymous',
              recordId: existing.patientId,
              entityType: 'patient',
              operation: 'UPDATE',
              status: 'success',
              clientVersion: version,
              serverVersion: existing.version
            });

            processedPatients.push({
              localId,
              serverId: existing._id,
              patientId: existing.patientId,
              version: existing.version,
              syncStatus: 'synced',
              updatedAt: existing.updatedAt
            });
          }
        }
      } catch (err) {
        console.error('[Sync Patient Error]', err);
        await SyncLog.create({
          deviceId,
          recordId: localId,
          entityType: 'patient',
          operation: 'CREATE',
          status: 'failed',
          errorMessage: err.message
        });
      }
    }

    // --- 2. PROCESS TRIAGE RECORDS ---
    for (const tItem of triageRecords) {
      const {
        localId,
        recordId,
        patientId,
        patientName,
        patientAge,
        patientGender,
        symptoms = {},
        vitals = {},
        triageLevel,
        redFlags = [],
        recommendationEn,
        recommendationTa,
        notes = '',
        version = 1,
        healthcareWorkerName
      } = tItem;

      if (!localId || !patientId) {
        continue;
      }

      try {
        let existing = await TriageRecord.findOne({
          $or: [{ localId }, { recordId: recordId || '__none__' }]
        });

        if (!existing) {
          const assignedRecordId = recordId || (await generateRecordId());
          
          // Re-verify rules
          const ruleCheck = evaluateTriage(symptoms, vitals, patientAge || 30);
          const effectiveLevel = triageLevel || ruleCheck.triageLevel;
          const effectiveRecEn = recommendationEn || ruleCheck.recommendationEn;
          const effectiveRecTa = recommendationTa || ruleCheck.recommendationTa;
          const effectiveRedFlags = redFlags.length ? redFlags : ruleCheck.redFlags;

          const newRecord = await TriageRecord.create({
            localId,
            recordId: assignedRecordId,
            patientId,
            patientName: patientName || '',
            patientAge: Number(patientAge) || 0,
            patientGender: patientGender || 'other',
            symptoms,
            vitals,
            triageLevel: effectiveLevel,
            redFlags: effectiveRedFlags,
            recommendationEn: effectiveRecEn,
            recommendationTa: effectiveRecTa,
            notes,
            healthcareWorkerId: req.user ? req.user._id : 'worker-local',
            healthcareWorkerName: healthcareWorkerName || (req.user ? req.user.name : 'Health Worker'),
            deviceId,
            version: 1,
            syncStatus: 'synced'
          });

          await SyncLog.create({
            deviceId,
            userId: req.user ? req.user._id : 'anonymous',
            recordId: assignedRecordId,
            entityType: 'triage',
            operation: 'CREATE',
            status: 'success',
            clientVersion: version,
            serverVersion: 1
          });

          processedTriage.push({
            localId,
            serverId: newRecord._id,
            recordId: newRecord.recordId,
            patientId: newRecord.patientId,
            version: newRecord.version,
            syncStatus: 'synced',
            updatedAt: newRecord.updatedAt
          });
        } else {
          // If already exists, idempotent return
          processedTriage.push({
            localId,
            serverId: existing._id,
            recordId: existing.recordId,
            patientId: existing.patientId,
            version: existing.version,
            syncStatus: 'synced',
            updatedAt: existing.updatedAt
          });
        }
      } catch (err) {
        console.error('[Sync Triage Error]', err);
        await SyncLog.create({
          deviceId,
          recordId: localId,
          entityType: 'triage',
          operation: 'CREATE',
          status: 'failed',
          errorMessage: err.message
        });
      }
    }

    res.json({
      success: true,
      serverTime: new Date().toISOString(),
      processed: {
        patients: processedPatients,
        triageRecords: processedTriage
      },
      conflicts,
      message: `Successfully synchronized ${processedPatients.length} patients and ${processedTriage.length} triage records.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pull incremental updates since lastSync
// @route   GET /api/sync/pull
// @access  Private
const pullSync = async (req, res, next) => {
  try {
    const { lastSync } = req.query;
    let query = { isDeleted: false };

    if (lastSync) {
      const syncDate = new Date(lastSync);
      if (!isNaN(syncDate.getTime())) {
        query.updatedAt = { $gt: syncDate };
      }
    }

    const [patients, triageRecords] = await Promise.all([
      Patient.find(query).sort({ updatedAt: 1 }),
      TriageRecord.find(lastSync ? { updatedAt: { $gt: new Date(lastSync) } } : {}).sort({ updatedAt: 1 })
    ]);

    res.json({
      success: true,
      serverTime: new Date().toISOString(),
      count: {
        patients: patients.length,
        triageRecords: triageRecords.length
      },
      data: {
        patients,
        triageRecords
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sync server status and logs
// @route   GET /api/sync/status
// @access  Private
const getSyncStatus = async (req, res, next) => {
  try {
    const [recentLogs, totalPatients, totalTriage] = await Promise.all([
      SyncLog.find().sort({ createdAt: -1 }).limit(20),
      Patient.countDocuments(),
      TriageRecord.countDocuments()
    ]);

    res.json({
      success: true,
      serverTime: new Date().toISOString(),
      serverStatus: 'ONLINE',
      totals: {
        patients: totalPatients,
        triageRecords: totalTriage
      },
      recentLogs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  pushSync,
  pullSync,
  getSyncStatus
};
