const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  city: { type: String, required: true },
  role: { type: String, enum: ['Participant', 'Judge', 'Admin'], default: 'Participant' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  isSuspended: { type: Boolean, default: false },
  lastLogin: { type: Date }
}, { timestamps: true });

module.exports = getModel('User', userSchema);
