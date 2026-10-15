const mongoose = require('mongoose');

const triageRecordSchema = new mongoose.Schema({
  localId: { type: String, required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientLocalId: { type: String, default: '' },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  village: { type: String, default: '', index: true },
  ageGroup: String,
  isPregnant: Boolean,
  symptoms: [{ type: String }],
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  result: { color: String, advice: String, reasons: [String], severity: String },
  ruleVersion: { type: Number, required: true },
  deviceId: { type: String, default: '' },
  updatedAt: { type: Date, required: true },
  syncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

triageRecordSchema.index({ localId: 1, deviceId: 1 }, { unique: true });
module.exports = mongoose.model('TriageRecord', triageRecordSchema);
