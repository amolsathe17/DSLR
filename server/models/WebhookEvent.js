const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String },
  processingStatus: { type: String, enum: ['Processed', 'Failed'], default: 'Processed' },
  processedTimestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = getModel('WebhookEvent', webhookEventSchema);
