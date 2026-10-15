const mongoose = require('mongoose');

const ruleSetSchema = new mongoose.Schema({
  version: { type: Number, required: true, unique: true, index: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  questions: { type: Array, default: [] },
  rules: { type: Array, default: [] },
  languages: { type: Object, default: {} },
  symptomList: { type: Array, default: [] },
  publishedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('RuleSet', ruleSetSchema);
