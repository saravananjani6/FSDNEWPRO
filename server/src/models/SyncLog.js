const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      default: 'anonymous'
    },
    recordId: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      enum: ['patient', 'triage'],
      required: true
    },
    operation: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'PULL', 'RESOLVE_CONFLICT'],
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'conflict'],
      required: true
    },
    clientVersion: {
      type: Number,
      default: 1
    },
    serverVersion: {
      type: Number,
      default: 1
    },
    errorMessage: {
      type: String,
      default: null
    },
    payloadSnapshot: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true
  }
);

syncLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);
