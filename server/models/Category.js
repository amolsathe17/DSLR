const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  contestTypes: { type: [String], default: ['Photography'] },
  customLabels: { type: [String], default: [] }
}, { timestamps: true });

module.exports = getModel('Category', categorySchema);
