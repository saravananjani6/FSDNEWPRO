import Constants from 'expo-constants';
import * as Network from 'expo-network';
import { getLatestRules, getSetting, markSynced, saveClinics, saveRules, unsynced } from '../storage/db';

export async function getApiUrl() {
  const custom = await getSetting('customApiUrl');
  if (custom && custom.trim()) return custom.trim();
  return Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';
}

export async function isOnline() {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

export async function pullLatestRules() {
  if (!(await isOnline())) return { skipped: true, reason: 'offline' };
  try {
    const baseUrl = await getApiUrl();
    const local = await getLatestRules();
    const response = await fetch(`${baseUrl}/rules/latest`);
    if (!response.ok) return { skipped: true, reason: 'http_error' };
    const latest = await response.json();
    if (latest && latest.version > (local?.version || 0)) {
      await saveRules(latest);
      return { updated: true, version: latest.version };
    }
    return { updated: false, version: local?.version };
  } catch (err) {
    return { skipped: true, error: err.message };
  }
}

export async function pullClinics() {
  if (!(await isOnline())) return { skipped: true };
  try {
    const baseUrl = await getApiUrl();
    const response = await fetch(`${baseUrl}/sync/delta`);
    if (!response.ok) return { skipped: true };
    const data = await response.json();
    if (data.clinics && data.clinics.length > 0) {
      await saveClinics(data.clinics);
      return { updated: true, count: data.clinics.length };
    }
    return { updated: false, count: 0 };
  } catch (err) {
    return { skipped: true, error: err.message };
  }
}

export async function syncNow(token) {
  const online = await isOnline();
  if (!online) return { ok: false, message: 'Device is offline. Connect to internet to sync.' };
  if (!token) return { ok: false, message: 'Health worker login required to sync records to server.' };

  const baseUrl = await getApiUrl();
  const data = await unsynced();

  let recordsSynced = 0;
  let patientsSynced = 0;

  if (data.records.length > 0 || data.patients.length > 0) {
    const response = await fetch(`${baseUrl}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Device-Id': 'ruralcare-mobile'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `Sync failed with status ${response.status}`);
    }

    const result = await response.json();
    const recordIds = (result.records || []).map((r) => r.localId);
    const patientIds = (result.patients || []).map((p) => p.localId);
    await markSynced(recordIds, patientIds);
    recordsSynced = recordIds.length;
    patientsSynced = patientIds.length;
  }

  // Also pull newest rules and clinic updates
  await pullLatestRules();
  await pullClinics();

  return {
    ok: true,
    message: `Sync successful: ${recordsSynced} triage records & ${patientsSynced} patients uploaded. Rules & clinics updated.`
  };
}

export async function getSyncStatus() {
  const online = await isOnline();
  const data = await unsynced();
  return {
    online,
    pendingRecords: data.records.length,
    pendingPatients: data.patients.length
  };
}
