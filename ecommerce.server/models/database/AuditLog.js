const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    userEmail: { type: String, default: 'anonymous' },
    userName: { type: String, default: 'Guest' },
    userRole: { type: String, default: 'guest' },
    action: { type: String, required: true },
    method: { type: String, default: 'POST' },
    endpoint: { type: String, required: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    macOrDevice: { type: String, default: '' },
    statusCode: { type: Number, default: 200 },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userEmail: 1 });
AuditLogSchema.index({ action: 1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

module.exports = { AuditLog, AuditLogSchema };
