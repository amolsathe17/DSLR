const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const eventBackupSchema = new mongoose.Schema({
  title: { type: String, required: true },
  eventType: { type: String, required: true },
  eventDate: { type: Date },
  backupPath: { type: String, required: true }, // e.g. /uploads/backups/Monsoon-Magic-2026-Backup.pdf
  deletedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = getModel('EventBackup', eventBackupSchema);
