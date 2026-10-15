import * as SQLite from 'expo-sqlite';
import starterRules from '../assets/rules/starterRules.json';

const db = SQLite.openDatabaseSync('ruralcare.db');

export async function initDb() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS patients (localId TEXT PRIMARY KEY, name TEXT, ageGroup TEXT, sex TEXT, village TEXT, phone TEXT, isPregnant INTEGER, synced INTEGER DEFAULT 0, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS triage_records (localId TEXT PRIMARY KEY, patientLocalId TEXT, village TEXT, ageGroup TEXT, isPregnant INTEGER, symptoms TEXT, answers TEXT, result TEXT, ruleVersion INTEGER, synced INTEGER DEFAULT 0, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS clinics (id TEXT PRIMARY KEY, name TEXT, village TEXT, phone TEXT, address TEXT, services TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS rules (version INTEGER PRIMARY KEY, json TEXT, updatedAt TEXT);
  `);
  const existing = await db.getFirstAsync('SELECT version FROM rules ORDER BY version DESC LIMIT 1');
  if (!existing) {
    await db.runAsync('INSERT INTO rules (version, json, updatedAt) VALUES (?, ?, ?)', [starterRules.version, JSON.stringify(starterRules), new Date().toISOString()]);
    await seedClinics();
  }
}

async function seedClinics() {
  const clinics = [
    ['local-1', 'Kaveri Primary Health Centre', 'Kaveri Nagar', '+919876543210', 'Main Road', 'fever,maternal care'],
    ['local-2', 'Mullai Rural Clinic', 'Mullai', '+919812345670', 'Bus Stand Road', 'first aid,child health'],
    ['local-3', 'District Hospital', 'Town Center', '+91108', 'Hospital Road', 'emergency,obstetrics']
  ];
  for (const c of clinics) await db.runAsync('INSERT OR REPLACE INTO clinics VALUES (?, ?, ?, ?, ?, ?, ?)', [...c, new Date().toISOString()]);
}

export async function getSetting(key) {
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key=?', [key]);
  return row?.value || null;
}

export async function setSetting(key, value) {
  await db.runAsync('INSERT OR REPLACE INTO settings VALUES (?, ?)', [key, value]);
}

export async function getLatestRules() {
  const row = await db.getFirstAsync('SELECT json FROM rules ORDER BY version DESC LIMIT 1');
  return row ? JSON.parse(row.json) : starterRules;
}

export async function saveRules(ruleSet) {
  await db.runAsync('INSERT OR REPLACE INTO rules VALUES (?, ?, ?)', [ruleSet.version, JSON.stringify(ruleSet), new Date().toISOString()]);
}

export async function savePatient(patient) {
  await db.runAsync('INSERT OR REPLACE INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    patient.localId, patient.name, patient.ageGroup, patient.sex, patient.village, patient.phone, patient.isPregnant ? 1 : 0, 0, patient.updatedAt
  ]);
}

export async function listPatients() {
  return db.getAllAsync('SELECT * FROM patients ORDER BY updatedAt DESC');
}

export async function saveRecord(record) {
  await db.runAsync('INSERT OR REPLACE INTO triage_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    record.localId, record.patientLocalId || '', record.village || '', record.ageGroup, record.isPregnant ? 1 : 0,
    JSON.stringify(record.symptoms || []), JSON.stringify(record.answers || {}), JSON.stringify(record.result), record.ruleVersion, 0, record.updatedAt
  ]);
}

export async function listHistory() {
  const rows = await db.getAllAsync('SELECT * FROM triage_records ORDER BY updatedAt DESC LIMIT 50');
  return rows.map((r) => ({ ...r, symptoms: JSON.parse(r.symptoms), answers: JSON.parse(r.answers), result: JSON.parse(r.result) }));
}

export async function unsynced() {
  const rows = await db.getAllAsync('SELECT * FROM triage_records WHERE synced=0 ORDER BY updatedAt ASC');
  const records = rows.map((r) => ({ ...r, symptoms: JSON.parse(r.symptoms), answers: JSON.parse(r.answers), result: JSON.parse(r.result) }));
  const patients = await db.getAllAsync('SELECT * FROM patients WHERE synced=0');
  return { records, patients };
}

export async function markSynced(localIds, patientIds) {
  for (const id of localIds) await db.runAsync('UPDATE triage_records SET synced=1 WHERE localId=?', [id]);
  for (const id of patientIds) await db.runAsync('UPDATE patients SET synced=1 WHERE localId=?', [id]);
}

export async function listClinics() {
  return db.getAllAsync('SELECT * FROM clinics ORDER BY village, name');
}

export async function saveClinics(clinics) {
  for (const c of clinics) {
    await db.runAsync(
      'INSERT OR REPLACE INTO clinics (id, name, village, phone, address, services, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        c._id || c.id || `clinic-${Date.now()}`,
        c.name,
        c.village || '',
        c.phone,
        c.address || '',
        Array.isArray(c.services) ? c.services.join(',') : (c.services || ''),
        c.updatedAt || new Date().toISOString()
      ]
    );
  }
}

export async function getPatient(localId) {
  if (!localId) return null;
  return db.getFirstAsync('SELECT * FROM patients WHERE localId=?', [localId]);
}
