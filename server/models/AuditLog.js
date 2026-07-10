const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const auditLogSchema = new mongoose.Schema({
  userId: { type: String },
  userName: { type: String },
  userEmail: { type: String },
  action: { type: String, required: true },
  details: { type: String },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = getModel('AuditLog', auditLogSchema);
