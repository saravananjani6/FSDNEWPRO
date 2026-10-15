import { db } from './db';

// Generate UUID for offline records
export function generateLocalUUID() {
  return 'loc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

// Generate readable local patient ID
export async function generateNextPatientId() {
  const count = await db.patients.count();
  const nextNum = 10001 + count;
  return `P-${nextNum}`;
}

export const patientRepository = {
  // Get all patients or search locally
  async getAll(searchTerm = '', villageFilter = '') {
    let collection = db.patients.orderBy('updatedAt').reverse();
    let results = await collection.toArray();

    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      results = results.filter((p) => {
        return (
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.patientId && p.patientId.toLowerCase().includes(term)) ||
          (p.phone && p.phone.includes(term)) ||
          (p.village && p.village.toLowerCase().includes(term))
        );
      });
    }

    if (villageFilter) {
      results = results.filter((p) => p.village && p.village.toLowerCase() === villageFilter.toLowerCase());
    }

    return results;
  },

  // Get patient by localId or patientId
  async getById(id) {
    let patient = await db.patients.where('localId').equals(id).first();
    if (!patient) {
      patient = await db.patients.where('patientId').equals(id).first();
    }
    return patient;
  },

  // Lookup patient by phone or patientId
  async lookup(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim();
    let patient = await db.patients.where('patientId').equals(clean).first();
    if (!patient) {
      patient = await db.patients.where('phone').equals(clean).first();
    }
    if (!patient) {
      patient = await db.patients.where('localId').equals(clean).first();
    }
    return patient;
  },

  // Create new patient locally
  async create(patientData, user = null) {
    const localId = patientData.localId || generateLocalUUID();
    const patientId = patientData.patientId || (await generateNextPatientId());
    const now = new Date().toISOString();

    const newRecord = {
      localId,
      serverId: null,
      patientId,
      name: patientData.name.trim(),
      age: Number(patientData.age),
      gender: patientData.gender,
      village: patientData.village.trim(),
      phone: patientData.phone || '',
      emergencyContact: patientData.emergencyContact || '',
      address: patientData.address || '',
      registeredBy: user ? user.name : 'Patient Self-Registration',
      deviceId: localStorage.getItem('vmcare_device_id') || localStorage.getItem('ashaseva_device_id') || 'browser-client',
      version: 1,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // Save to IndexedDB patients store
    await db.patients.put(newRecord);

    // Add to sync queue for upstream push
    await db.syncQueue.add({
      entityType: 'patient',
      entityLocalId: localId,
      operation: 'CREATE',
      payload: newRecord,
      status: 'pending',
      attempts: 0,
      createdAt: now
    });

    return newRecord;
  },

  // Update existing patient locally
  async update(localId, updates) {
    const existing = await db.patients.get(localId);
    if (!existing) {
      throw new Error(`Patient with localId ${localId} not found locally`);
    }

    const now = new Date().toISOString();
    const updatedRecord = {
      ...existing,
      ...updates,
      version: (existing.version || 1) + 1,
      syncStatus: 'pending',
      updatedAt: now
    };

    await db.patients.put(updatedRecord);

    await db.syncQueue.add({
      entityType: 'patient',
      entityLocalId: localId,
      operation: 'UPDATE',
      payload: updatedRecord,
      status: 'pending',
      attempts: 0,
      createdAt: now
    });

    return updatedRecord;
  },

  // Mark patient as synced from server response
  async markAsSynced(localId, serverData) {
    const existing = await db.patients.get(localId);
    if (existing) {
      await db.patients.update(localId, {
        serverId: serverData.serverId || existing.serverId,
        patientId: serverData.patientId || existing.patientId,
        version: serverData.version || existing.version,
        syncStatus: 'synced',
        updatedAt: serverData.updatedAt || existing.updatedAt
      });
    }
  },

  // Doctor assists patient with diagnosis, prescriptions & recommendations
  // (Doctors and Admin can assist)
  async assistPatient(id, assistanceData, doctorUser) {
    let patient = await this.getById(id);
    if (!patient) {
      throw new Error(`Patient not found`);
    }

    const now = new Date().toISOString();
    const assistanceEntry = {
      id: 'ast-' + Date.now().toString(36),
      doctorId: doctorUser ? (doctorUser.id || doctorUser._id) : 'doc-offline',
      doctorName: doctorUser ? doctorUser.name : 'Medical Officer',
      doctorRole: doctorUser ? doctorUser.role : 'doctor',
      diagnosis: assistanceData.diagnosis || '',
      notes: assistanceData.notes || '',
      prescription: assistanceData.prescription || '',
      referral: assistanceData.referral || '',
      action: assistanceData.action || 'Clinical Consultation Completed',
      assistedAt: now
    };

    const currentAssistance = Array.isArray(patient.doctorAssistance) ? patient.doctorAssistance : [];
    const updatedAssistance = [assistanceEntry, ...currentAssistance];

    const updatedRecord = {
      ...patient,
      doctorAssistance: updatedAssistance,
      version: (patient.version || 1) + 1,
      syncStatus: 'pending',
      updatedAt: now
    };

    await db.patients.put(updatedRecord);

    await db.syncQueue.add({
      entityType: 'patient',
      entityLocalId: patient.localId,
      operation: 'UPDATE',
      payload: updatedRecord,
      status: 'pending',
      attempts: 0,
      createdAt: now
    });

    return updatedRecord;
  },

  // Delete patient (STRICTLY Admin only - Doctors & Workers CANNOT delete)
  async delete(localIdOrPatientId, currentUser) {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access Denied: Only system administrators are authorized to delete patient records. Doctors and health workers do not have deletion permissions.');
    }

    const patient = await this.getById(localIdOrPatientId);
    if (!patient) {
      throw new Error('Patient record not found to delete');
    }

    // Delete patient from IndexedDB
    await db.patients.delete(patient.localId);

    // Delete patient's triage records
    await db.triageRecords.where('patientId').equals(patient.patientId).delete();

    // Queue sync deletion upstream
    await db.syncQueue.add({
      entityType: 'patient',
      entityLocalId: patient.localId,
      operation: 'DELETE',
      payload: { localId: patient.localId, patientId: patient.patientId, serverId: patient.serverId },
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString()
    });

    return true;
  }
};
