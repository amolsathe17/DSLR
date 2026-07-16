const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const contestTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true });

module.exports = getModel('ContestType', contestTypeSchema);
