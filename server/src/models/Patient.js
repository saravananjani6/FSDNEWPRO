const mongoose = require('mongoose');

const doctorAssistanceSchema = new mongoose.Schema({
  doctorId: { type: String },
  doctorName: { type: String },
  doctorRole: { type: String, default: 'doctor' },
  diagnosis: { type: String, default: '' },
  notes: { type: String, default: '' },
  prescription: { type: String, default: '' },
  referral: { type: String, default: '' },
  action: { type: String, default: 'Clinical Consultation' },
  assistedAt: { type: Date, default: Date.now }
}, { _id: true });

const patientSchema = new mongoose.Schema({
  localId: { type: String },
  patientId: { type: String },
  name: { type: String, required: true, trim: true },
  age: { type: Number },
  ageGroup: { type: String, enum: ['infant', 'child', 'adult', 'older_adult'], default: 'adult' },
  gender: { type: String, default: 'other' },
  sex: { type: String, default: 'other' },
  village: { type: String, default: '', index: true },
  phone: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  address: { type: String, default: '' },
  isPregnant: { type: Boolean, default: false },
  registeredBy: { type: String, default: 'Health Worker' },
  deviceId: { type: String, default: '' },
  version: { type: Number, default: 1 },
  syncStatus: { type: String, default: 'synced' },
  isDeleted: { type: Boolean, default: false },
  doctorAssistance: [doctorAssistanceSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

patientSchema.index({ localId: 1 }, { sparse: true });
patientSchema.index({ patientId: 1 }, { sparse: true });

module.exports = mongoose.model('Patient', patientSchema);
