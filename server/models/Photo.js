const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const photoSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  entryId: { type: String, required: true },
  title: { type: String, default: 'Untitled' },
  category: { type: String, default: 'General' },
  description: { type: String },
  originalFilename: { type: String },
  cloudinaryPublicId: { type: String },
  secureUrl: { type: String },
  width: { type: Number },
  height: { type: Number },
  format: { type: String },
  fileSize: { type: Number },
  cameraMake: { type: String },
  cameraModel: { type: String },
  lensModel: { type: String },
  originalCaptureDate: { type: Date },
  exifData: { type: mongoose.Schema.Types.Mixed },
  dslrValidationStatus: { type: String, enum: ['VERIFIED', 'MANUAL_REVIEW', 'REJECTED'], default: 'MANUAL_REVIEW' },
  validationReason: { type: String },
  uploadTimestamp: { type: Date, default: Date.now },
  deletionStatus: { type: Boolean, default: false },
  deletionTimestamp: { type: Date }
}, { timestamps: true });

module.exports = getModel('Photo', photoSchema);
