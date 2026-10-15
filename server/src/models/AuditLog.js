const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: 'system'
    },
    userName: {
      type: String,
      default: 'Anonymous/System'
    },
    role: {
      type: String,
      default: 'worker'
    },
    action: {
      type: String,
      required: true
    },
    resource: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    details: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
