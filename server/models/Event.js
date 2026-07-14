const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  theme: { type: String, required: true },
  description: { type: String },
  rules: [{ type: String }],
  deadline: { type: Date, required: true },
  eventDate: { type: Date },
  venue: { type: String },
  prizes: [{
    rank: { type: String },
    reward: { type: String },
    description: { type: String }
  }],
  faqs: [{
    question: { type: String },
    answer: { type: String }
  }],
  terms: [{ type: String }],
  packages: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    maxPhotos: { type: Number, required: true }
  }],
  status: { type: String, enum: ['Draft', 'Active', 'Closed', 'Completed'], default: 'Draft' },
  assignedJudges: [{ type: String }],
  confirmedJudges: [{ type: String }],
  winnersPublished: { type: Boolean, default: false },
  winners: [{
    submissionId: { type: String },
    photographId: { type: String },
    userId: { type: String },
    userName: { type: String },
    photoTitle: { type: String },
    fileUrl: { type: String },
    rank: { type: String },
    score: { type: Number }
  }]
}, { timestamps: true });

module.exports = getModel('Event', eventSchema);
