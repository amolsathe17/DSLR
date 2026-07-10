const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const photographSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  cameraBrand: { type: String },
  cameraModel: { type: String },
  lensUsed: { type: String },
  location: { type: String },
  dateCaptured: { type: String },
  description: { type: String },
  fileUrl: { type: String, required: true },
  rawFileUrl: { type: String },
  fileHash: { type: String, required: true },
  fileSizeBytes: { type: Number },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  rejectReason: { type: String },
  assignedJudges: [{ type: String }], // Array of judge User IDs
  scores: [{
    judgeId: { type: String },
    judgeName: { type: String },
    creativity: { type: Number },     // 1-10
    composition: { type: Number },    // 1-10
    technicalQuality: { type: Number },// 1-10
    storytelling: { type: Number },    // 1-10
    overallImpact: { type: Number },   // 1-10
    totalScore: { type: Number },      // sum (max 50)
    averageScore: { type: Number },    // avg (max 10)
    remarks: { type: String },
    gradedAt: { type: Date, default: Date.now }
  }]
});

const submissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  userEmail: { type: String },
  eventId: { type: String, required: true },
  eventTitle: { type: String },
  packageId: { type: String, required: true },
  paymentId: { type: String },
  eligibilityAccepted: { type: Boolean, default: false },
  isFinalSubmitted: { type: Boolean, default: false },
  submissionDate: { type: Date },
  photographs: [photographSchema]
}, { timestamps: true });

module.exports = getModel('Submission', submissionSchema);
