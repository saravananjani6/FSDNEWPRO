const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');
const RuleSet = require('../models/RuleSet');
const User = require('../models/User');
const starterRuleSet = require('./starterRules');

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ruralcare');

  await User.findOneAndUpdate(
    { email: 'admin@ruralcare.local' },
    {
      name: 'RuralCare Admin',
      email: 'admin@ruralcare.local',
      role: 'admin',
      village: 'Primary Health Centre',
      passwordHash: await User.hashPassword('AdminPass123')
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'worker@ruralcare.local' },
    {
      name: 'Sample Health Worker',
      email: 'worker@ruralcare.local',
      role: 'health_worker',
      village: 'Kaveri Nagar',
      passwordHash: await User.hashPassword('WorkerPass123')
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'doctor@ruralcare.local' },
    {
      name: 'Dr. S. Ramanathan (PHC Medical Officer)',
      email: 'doctor@ruralcare.local',
      role: 'doctor',
      village: 'Primary Health Centre',
      passwordHash: await User.hashPassword('DoctorPass123')
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await RuleSet.findOneAndUpdate(
    { version: starterRuleSet.version },
    { ...starterRuleSet, publishedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const clinics = [
    { name: 'Kaveri Primary Health Centre', village: 'Kaveri Nagar', phone: '+919876543210', address: 'Main Road, Kaveri Nagar', services: ['fever', 'maternal care', 'immunization'] },
    { name: 'Mullai Rural Clinic', village: 'Mullai', phone: '+919812345670', address: 'Bus Stand Road, Mullai', services: ['first aid', 'child health'] },
    { name: 'District Hospital', village: 'Town Center', phone: '+91108', address: 'Hospital Road, Town Center', services: ['emergency', 'obstetrics', 'surgery'] }
  ];
  for (const clinic of clinics) {
    await Clinic.findOneAndUpdate({ name: clinic.name }, { ...clinic, isActive: true, updatedAt: new Date() }, { upsert: true });
  }

  console.log('Seed complete');
  console.log('Admin: admin@ruralcare.local / AdminPass123');
  console.log('Health worker: worker@ruralcare.local / WorkerPass123');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
