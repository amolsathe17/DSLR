const mongoose = require('mongoose');

const BroadcastSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  recipientType: {
    type: String,
    enum: ['Participant', 'Judge', 'Both'],
    required: true
  },
  eventId: {
    type: String,
    default: null
  },
  eventTitle: {
    type: String,
    default: null
  },
  sentBy: {
    type: String,
    default: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Broadcast', BroadcastSchema);
