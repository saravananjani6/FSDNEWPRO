const mongoose = require('mongoose');

const triageRecordSchema = new mongoose.Schema({
  localId: { type: String, required: true, index: true },
  recordId: { type: String, index: true },
  patientId: { type: String, default: '', index: true },
  patientName: { type: String, default: 'Anonymous self-assessment' },
  patientAge: { type: Number, default: 0 },
  patientGender: { type: String, default: '' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientLocalId: { type: String, default: '' },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  village: { type: String, default: '', index: true },
  ageGroup: String,
  isPregnant: Boolean,
  symptoms: { type: mongoose.Schema.Types.Mixed, default: {} },
  vitals: { type: mongoose.Schema.Types.Mixed, default: {} },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  result: { color: String, advice: String, reasons: [String], severity: String },
  triageLevel: { type: String, enum: ['EMERGENCY', 'URGENT', 'NON-URGENT'] },
  redFlags: { type: [mongoose.Schema.Types.Mixed], default: [] },
  recommendationEn: { type: String, default: '' },
  recommendationTa: { type: String, default: '' },
  confidenceScore: { type: Number, min: 0, max: 100 },
  confidenceLabel: { type: String, default: '' },
  notes: { type: String, default: '' },
  healthcareWorkerId: { type: String, default: '' },
  healthcareWorkerName: { type: String, default: 'Patient Self-Assessment' },
  version: { type: Number, default: 1 },
  syncStatus: { type: String, default: 'synced' },
  ruleVersion: { type: Number, default: 1 },
  deviceId: { type: String, default: '' },
  updatedAt: { type: Date, required: true },
  syncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

triageRecordSchema.index({ localId: 1, deviceId: 1 }, { unique: true });
module.exports = mongoose.model('TriageRecord', triageRecordSchema);
