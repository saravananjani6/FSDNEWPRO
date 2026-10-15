import { db } from '../database/db';
import { apiRequest } from './api';

export const syncService = {
  // Execute full sync (push pending queue then pull incremental server changes)
  async performFullSync(onProgress = null) {
    const result = {
      pushedPatients: 0,
      pushedTriage: 0,
      pulledPatients: 0,
      pulledTriage: 0,
      conflicts: [],
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      if (onProgress) onProgress({ status: 'pushing', message: 'Uploading pending offline records...' });

      // 1. Gather all pending items from syncQueue
      const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();

      if (pendingItems.length > 0) {
        const patientsToPush = [];
        const triageToPush = [];

        for (const item of pendingItems) {
          if (item.entityType === 'patient') {
            patientsToPush.push(item.payload);
          } else if (item.entityType === 'triage') {
            triageToPush.push(item.payload);
          }
        }

        const deviceId = localStorage.getItem('vmcare_device_id') || localStorage.getItem('ashaseva_device_id') || 'tablet-vmcare-01';

        const pushResponse = await apiRequest('/sync/push', {
          method: 'POST',
          body: JSON.stringify({
            deviceId,
            patients: patientsToPush,
            triageRecords: triageToPush
          })
        });

        if (pushResponse.success) {
          const { processed, conflicts = [] } = pushResponse;

          // Update local patients with server-confirmed sync status
          for (const p of processed.patients || []) {
            const local = await db.patients.get(p.localId);
            if (local) {
              await db.patients.update(p.localId, {
                serverId: p.serverId,
                patientId: p.patientId,
                version: p.version,
                syncStatus: 'synced',
                updatedAt: p.updatedAt
              });
            }
          }

          // Update local triage records with server-confirmed sync status
          for (const t of processed.triageRecords || []) {
            const local = await db.triageRecords.get(t.localId);
            if (local) {
              await db.triageRecords.update(t.localId, {
                serverId: t.serverId,
                recordId: t.recordId,
                version: t.version,
                syncStatus: 'synced',
                updatedAt: t.updatedAt
              });
            }
          }

          // Handle conflicts if any returned
          if (conflicts.length > 0) {
            result.conflicts = conflicts;
            for (const c of conflicts) {
              await db.conflicts.put({
                id: c.localId || 'conflict-' + Date.now(),
                entityType: c.entityType,
                localId: c.localId,
                details: c,
                status: 'unresolved',
                createdAt: new Date().toISOString()
              });
            }
          }

          // Remove successfully pushed items from sync queue
          const pushedLocalIds = new Set([
            ...(processed.patients || []).map((p) => p.localId),
            ...(processed.triageRecords || []).map((t) => t.localId)
          ]);

          for (const item of pendingItems) {
            if (pushedLocalIds.has(item.entityLocalId)) {
              await db.syncQueue.delete(item.id);
            }
          }

          result.pushedPatients = (processed.patients || []).length;
          result.pushedTriage = (processed.triageRecords || []).length;
        }
      }

      // 2. Incremental Pull: Download records created or updated elsewhere since lastSync
      if (onProgress) onProgress({ status: 'pulling', message: 'Checking for updates from central hospital server...' });

      const lastSyncSetting = await db.settings.get('lastSyncTimestamp');
      const lastSync = lastSyncSetting ? lastSyncSetting.value : null;

      const pullUrl = lastSync ? `/sync/pull?lastSync=${encodeURIComponent(lastSync)}` : '/sync/pull';
      const pullResponse = await apiRequest(pullUrl, { method: 'GET' });

      if (pullResponse.success && pullResponse.data) {
        const { patients = [], triageRecords = [] } = pullResponse.data;

        // Upsert pulled patients into local Dexie store
        for (const sp of patients) {
          const existing = await db.patients.where('localId').equals(sp.localId).first() ||
                           await db.patients.where('patientId').equals(sp.patientId).first();

          if (!existing) {
            await db.patients.put({
              localId: sp.localId || 'server-p-' + sp.patientId,
              serverId: sp._id,
              patientId: sp.patientId,
              name: sp.name,
              age: sp.age,
              gender: sp.gender,
              village: sp.village,
              phone: sp.phone || '',
              emergencyContact: sp.emergencyContact || '',
              address: sp.address || '',
              registeredBy: sp.registeredBy,
              deviceId: sp.deviceId,
              version: sp.version,
              syncStatus: 'synced',
              createdAt: sp.createdAt,
              updatedAt: sp.updatedAt
            });
            result.pulledPatients++;
          } else if (existing.syncStatus === 'synced' && sp.version > (existing.version || 1)) {
            await db.patients.update(existing.localId, {
              ...sp,
              syncStatus: 'synced'
            });
            result.pulledPatients++;
          }
        }

        // Upsert pulled triage records into local Dexie store
        for (const st of triageRecords) {
          const existing = await db.triageRecords.where('localId').equals(st.localId).first() ||
                           await db.triageRecords.where('recordId').equals(st.recordId).first();

          if (!existing) {
            await db.triageRecords.put({
              localId: st.localId || 'server-tr-' + st.recordId,
              serverId: st._id,
              recordId: st.recordId,
              patientId: st.patientId,
              patientName: st.patientName,
              patientAge: st.patientAge,
              patientGender: st.patientGender,
              symptoms: st.symptoms,
              vitals: st.vitals,
              triageLevel: st.triageLevel,
              redFlags: st.redFlags,
              recommendationEn: st.recommendationEn,
              recommendationTa: st.recommendationTa,
              notes: st.notes,
              healthcareWorkerName: st.healthcareWorkerName,
              deviceId: st.deviceId,
              version: st.version,
              syncStatus: 'synced',
              createdAt: st.createdAt,
              updatedAt: st.updatedAt
            });
            result.pulledTriage++;
          }
        }

        // Update last successful sync timestamp
        const serverTime = pullResponse.serverTime || new Date().toISOString();
        await db.settings.put({ key: 'lastSyncTimestamp', value: serverTime });
        result.timestamp = serverTime;
      }

      if (onProgress) onProgress({ status: 'completed', message: 'Synchronization completed successfully!' });
      return { success: true, ...result };
    } catch (error) {
      console.warn('[Sync Engine Warning]', error.message);
      result.error = error.message;

      // Update failed attempts on syncQueue
      const failedItems = await db.syncQueue.where('status').equals('pending').toArray();
      for (const f of failedItems) {
        await db.syncQueue.update(f.id, {
          attempts: (f.attempts || 0) + 1,
          lastError: error.message
        });
      }

      if (onProgress) onProgress({ status: 'failed', message: 'Offline or server unreachable. Local records remain safe.' });
      return { success: false, ...result };
    }
  },

  // Get current sync status summary
  async getStatus() {
    const pendingCount = await db.syncQueue.where('status').equals('pending').count();
    const conflictCount = await db.conflicts.where('status').equals('unresolved').count();
    const lastSyncObj = await db.settings.get('lastSyncTimestamp');

    return {
      pendingCount,
      conflictCount,
      lastSyncTimestamp: lastSyncObj ? lastSyncObj.value : null
    };
  }
};
