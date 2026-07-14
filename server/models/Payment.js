const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  userEmail: { type: String },
  eventId: { type: String, required: true },
  eventTitle: { type: String },
  packageId: { type: String, required: true },
  packageName: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Pending', 'Success', 'Failed'], default: 'Pending' },
  paymentMethod: { type: String },
  invoiceNumber: { type: String },
  qrContent: { type: String },
  paymentDate: { type: Date },
  entryId: { type: String },
  paymentProvider: { type: String, default: 'Razorpay' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  currency: { type: String, default: 'INR' },
  signatureVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = getModel('Payment', paymentSchema);
