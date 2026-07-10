const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Submission = require('../models/Submission');
const Event = require('../models/Event');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// @desc    Process simulated payment
// @route   POST /api/payments/pay
// @access  Private
router.post('/pay', protect, async (req, res) => {
  try {
    const { eventId, packageId, paymentMethod } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const selectedPackage = event.packages.find(p => p.id === packageId);
    if (!selectedPackage) {
      return res.status(400).json({ success: false, message: 'Invalid package selected' });
    }

    // Verify if there is already a successful payment
    const existingPayment = await Payment.findOne({ userId: req.user._id, eventId, status: 'Success' });
    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'You have already paid for this event.' });
    }

    const transactionId = 'TXN-' + Math.random().toString(36).substring(2, 12).toUpperCase() + Date.now().toString().slice(-3);
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
    const amount = selectedPackage.price;

    // Create unique QR code content (can be scanned to verify payment)
    const qrContentStr = JSON.stringify({
      txn: transactionId,
      inv: invoiceNumber,
      user: req.user.email,
      event: event.title,
      amount: amount,
      date: new Date().toISOString().split('T')[0]
    });

    const payment = await Payment.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      eventId,
      eventTitle: event.title,
      packageId,
      packageName: selectedPackage.name,
      amount,
      transactionId,
      status: 'Success', // Mock payment gateway always succeeds in dev simulation
      paymentMethod: paymentMethod || 'UPI',
      invoiceNumber,
      qrContent: qrContentStr,
      paymentDate: new Date()
    });

    // Link payment to submission
    await Submission.updateOne(
      { userId: req.user._id, eventId },
      { $set: { paymentId: payment._id } }
    );

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Process Payment',
      details: `Payment of ₹${amount} successful. Transaction ID: ${transactionId}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Payment simulation successful!',
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get participant transaction history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get single transaction detail / invoice info
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Ensure users can only access their own invoices (Admins can view all)
    if (payment.userId !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this transaction' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
