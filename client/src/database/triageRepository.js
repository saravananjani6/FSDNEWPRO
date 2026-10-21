import { db } from './db';
import { generateLocalUUID } from './patientRepository';

export async function generateNextRecordId() {
  const count = await db.triageRecords.count();
  const nextNum = 10001 + count;
  return `TR-${nextNum}`;
}

export const triageRepository = {
  // Get all triage records
  async getAll() {
    return await db.triageRecords.orderBy('createdAt').reverse().toArray();
  },

  // Get triage records for a specific patient
  async getByPatientId(patientId) {
    const records = await db.triageRecords
      .where('patientId')
      .equals(patientId)
      .reverse()
      .sortBy('createdAt');
    return records;
  },

  // Create triage record locally
  async create(recordData, user = null) {
    const localId = recordData.localId || generateLocalUUID();
    const recordId = recordData.recordId || (await generateNextRecordId());
    const now = new Date().toISOString();

    const newRecord = {
      localId,
      recordId,
      patientId: recordData.patientId,
      patientName: recordData.patientName || '',
      patientAge: Number(recordData.patientAge) || 0,
      patientGender: recordData.patientGender || '',
      symptoms: recordData.symptoms || {},
      vitals: recordData.vitals || {},
      triageLevel: recordData.triageLevel,
      redFlags: recordData.redFlags || [],
      recommendationEn: recordData.recommendationEn,
      recommendationTa: recordData.recommendationTa,
      confidenceScore: recordData.confidenceScore,
      confidenceLabel: recordData.confidenceLabel || '',
      notes: recordData.notes || '',
      healthcareWorkerName: user ? user.name : 'Patient Self-Assessment',
      deviceId: localStorage.getItem('vmcare_device_id') || 'browser-client',
      version: 1,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // Save to IndexedDB
    await db.triageRecords.put(newRecord);

    // Queue for sync
    await db.syncQueue.add({
      entityType: 'triage',
      entityLocalId: localId,
      operation: 'CREATE',
      payload: newRecord,
      status: 'pending',
      attempts: 0,
      createdAt: now
    });

    return newRecord;
  },

  // Mark triage record as synced
  async markAsSynced(localId, serverData) {
    const existing = await db.triageRecords.get(localId);
    if (existing) {
      await db.triageRecords.update(localId, {
        serverId: serverData.serverId || existing.serverId,
        recordId: serverData.recordId || existing.recordId,
        version: serverData.version || existing.version,
        syncStatus: 'synced',
        updatedAt: serverData.updatedAt || existing.updatedAt
      });
    }
  },

  // Compute offline dashboard stats directly from IndexedDB
  async getLocalMetrics() {
    const patients = await db.patients.toArray();
    const triage = await db.triageRecords.toArray();
    const pendingCount = await db.syncQueue.where('status').equals('pending').count();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTriage = triage.filter((t) => new Date(t.createdAt) >= startOfToday);
    const emergencyCases = triage.filter((t) => t.triageLevel === 'EMERGENCY');
    const urgentCases = triage.filter((t) => t.triageLevel === 'URGENT');
    const nonUrgentCases = triage.filter((t) => t.triageLevel === 'NON-URGENT');

    const lastSyncObj = await db.settings.get('lastSyncTimestamp');

    return {
      totalPatients: patients.length,
      totalTriage: triage.length,
      todayTriage: todayTriage.length,
      emergencyCount: emergencyCases.length,
      urgentCount: urgentCases.length,
      nonUrgentCount: nonUrgentCases.length,
      pendingSyncCount: pendingCount,
      lastSyncTimestamp: lastSyncObj ? lastSyncObj.value : null,
      recentRecords: triage.slice(0, 5)
    };
  }
};
