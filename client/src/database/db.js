import Dexie from 'dexie';

// Initialize IndexedDB with Dexie
export const db = new Dexie('VMCareRuralHealthDB');

db.version(1).stores({
  patients: '&localId, patientId, name, phone, village, syncStatus, updatedAt, version',
  triageRecords: '&localId, recordId, patientId, triageLevel, syncStatus, createdAt, updatedAt',
  syncQueue: '++id, entityType, entityLocalId, operation, status, attempts, createdAt',
  settings: '&key, value',
  conflicts: '&id, entityType, localId, status, createdAt'
});

// Helper to seed initial demo data locally if database is completely empty
export async function seedLocalDataIfEmpty() {
  const patientCount = await db.patients.count();
  if (patientCount === 0) {
    console.log('[IndexedDB] Initializing default local offline seed records...');

    const demoPatients = [
      {
        localId: 'local-p-10001-uuid',
        serverId: null,
        patientId: 'P-10001',
        name: 'Selvi Meenakshi',
        age: 48,
        gender: 'female',
        village: 'Thiruvalangadu',
        phone: '9876543210',
        emergencyContact: 'Ramu (Husband) - 9876543211',
        address: '12, West Mada Street',
        registeredBy: 'Self-Registration',
        deviceId: 'local-offline-device',
        version: 1,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        localId: 'local-p-10002-uuid',
        serverId: null,
        patientId: 'P-10002',
        name: 'Murugan Arumugam',
        age: 62,
        gender: 'male',
        village: 'Melur',
        phone: '9789012345',
        emergencyContact: 'Kannan (Son) - 9789012346',
        address: '45, Pillayar Kovil Street',
        registeredBy: 'Self-Registration',
        deviceId: 'local-offline-device',
        version: 1,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        localId: 'local-p-10003-uuid',
        serverId: null,
        patientId: 'P-10003',
        name: 'Lakshmi Narayanan',
        age: 26,
        gender: 'female',
        village: 'Keeladi',
        phone: '9443210987',
        emergencyContact: 'Narayanan (Father) - 9443210988',
        address: '8, Chettiar Street',
        registeredBy: 'Self-Registration',
        deviceId: 'local-offline-device',
        version: 1,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const demoTriage = [
      {
        localId: 'local-tr-10001-uuid',
        recordId: 'TR-10001',
        patientId: 'P-10002',
        patientName: 'Murugan Arumugam',
        patientAge: 62,
        patientGender: 'male',
        symptoms: {
          chestPain: true,
          breathingDifficulty: true,
          dizziness: true
        },
        vitals: {
          temperature: 98.4,
          heartRate: 136,
          spO2: 88,
          respiratoryRate: 32,
          systolicBP: 195,
          diastolicBP: 110
        },
        triageLevel: 'EMERGENCY',
        redFlags: [
          'Chest pain with respiratory distress or fainting (மார்பு வலியுடன் மூச்சுத்திணறல்/மயக்கம்)',
          'Critically low oxygen saturation: 88% (ஆக்சிஜன் அளவு மிகக் குறைவு)',
          'Critical heart rate: 136 bpm (ஆபத்தான இதய துடிப்பு)'
        ],
        recommendationEn: 'EMERGENCY: Immediate medical attention required! Call ambulance (108) or transport immediately.',
        recommendationTa: 'அவசரம்: உடனடியாக மருத்துவ சிகிச்சை தேவை! 108 அவசர ஊர்தியை அழைக்கவும்.',
        notes: 'Emergency transfer initiated.',
        healthcareWorkerName: 'Patient Self-Assessment',
        deviceId: 'local-offline-device',
        version: 1,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        localId: 'local-tr-10002-uuid',
        recordId: 'TR-10002',
        patientId: 'P-10001',
        patientName: 'Selvi Meenakshi',
        patientAge: 48,
        patientGender: 'female',
        symptoms: {
          fever: true,
          vomiting: true,
          diarrhea: true
        },
        vitals: {
          temperature: 102.6,
          heartRate: 108,
          spO2: 95,
          respiratoryRate: 22,
          systolicBP: 110,
          diastolicBP: 72
        },
        triageLevel: 'URGENT',
        redFlags: [
          'High fever: 102.6°F (அதிக காய்ச்சல்)',
          'Vomiting and diarrhea: Dehydration risk (வாந்தி மற்றும் வயிற்றுப்போக்கு)'
        ],
        recommendationEn: 'URGENT: Same-day medical doctor evaluation recommended at PHC.',
        recommendationTa: 'அவசரக் கவனிப்பு: இன்றே ஆரம்ப சுகாதார நிலையத்தில் மருத்துவரிடம் செல்லவும்.',
        notes: 'Advised ORS.',
        healthcareWorkerName: 'Patient Self-Assessment',
        deviceId: 'local-offline-device',
        version: 1,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    await db.patients.bulkAdd(demoPatients);
    await db.triageRecords.bulkAdd(demoTriage);
    await db.settings.put({ key: 'lastSyncTimestamp', value: new Date().toISOString() });
    await db.settings.put({ key: 'language', value: 'ta' }); // Default to Tamil as requested
  }
}
