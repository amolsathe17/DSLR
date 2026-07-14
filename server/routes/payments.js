const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Submission = require('../models/Submission');
const Event = require('../models/Event');
const WebhookEvent = require('../models/WebhookEvent');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const plansConfig = require('../config/plans');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// @desc    Initiate Razorpay checkout order
// @route   POST /api/payments/pay
// @access  Private
router.post('/pay', protect, async (req, res) => {
  try {
    const { eventId, packageId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const plan = plansConfig.getPlan(packageId);
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid package selected' });
    }

    // Verify if there is already a paid entry
    let submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });
    if (submission && submission.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'You have already paid for this event.' });
    }

    // Generate unique entry identifier
    const entryNumber = submission && submission.entryNumber
      ? submission.entryNumber
      : 'ENT-' + Math.floor(100000 + Math.random() * 900000);

    // Create or reuse unpaid entry
    if (!submission) {
      submission = new Submission({
        userId: req.user._id.toString(),
        userName: req.user.name,
        userEmail: req.user.email,
        eventId: event._id.toString(),
        eventTitle: event.title,
        packageId: plan.packageId,
        eligibilityAccepted: true,
        entryNumber,
        amount: plan.amount,
        photoLimit: plan.limit,
        paymentStatus: 'Unpaid',
        entryStatus: 'Draft',
        photographs: []
      });
      await submission.save();
    } else {
      submission.packageId = plan.packageId;
      submission.amount = plan.amount;
      submission.photoLimit = plan.limit;
      await submission.save();
    }

    // Razorpay Order options
    const amountInPaise = plan.amount * 100;
    const receiptId = `rcpt_${entryNumber}`;

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        payment_capture: 1
      });
    } catch (err) {
      console.error('Razorpay Order Error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Could not contact Razorpay checkout server. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.',
        error: err.message
      });
    }

    const transactionId = razorpayOrder.id;
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);

    // Create pending payment record
    const payment = await Payment.create({
      userId: req.user._id.toString(),
      userName: req.user.name,
      userEmail: req.user.email,
      eventId: event._id.toString(),
      eventTitle: event.title,
      packageId: plan.packageId,
      packageName: plan.name,
      amount: plan.amount,
      transactionId,
      status: 'Pending',
      currency: 'INR',
      paymentProvider: 'Razorpay',
      razorpayOrderId: razorpayOrder.id,
      entryId: submission._id.toString(),
      invoiceNumber,
      paymentDate: null
    });

    res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: payment._id,
      submission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment confirmation parameters' });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret');
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Update payment record
    payment.status = 'Success';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.signatureVerified = true;
    payment.paymentDate = new Date();
    payment.transactionId = razorpay_payment_id;
    await payment.save();

    // Update submission
    const submission = await Submission.findById(payment.entryId);
    if (submission) {
      submission.paymentStatus = 'Paid';
      submission.paymentId = payment._id.toString();
      await submission.save();
    }

    await AuditLog.create({
      userId: req.user._id.toString(),
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Verify Payment',
      details: `Verified Razorpay payment for Order ID: ${razorpay_order_id}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Payment verified and verified successfully',
      submission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Initiate dummy simulated payment
// @route   POST /api/payments/dummy-bypass
// @access  Private
router.post('/dummy-bypass', protect, async (req, res) => {
  try {
    const { eventId, packageId } = req.body;
    if (!eventId || !packageId) {
      return res.status(400).json({ success: false, message: 'Event ID and Package ID are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const plan = plansConfig.getPlan(packageId);
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid package selection' });
    }

    // Verify if there is already a paid entry
    let submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });
    if (submission && submission.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'You have already paid for this event.' });
    }

    const entryNumber = submission && submission.entryNumber
      ? submission.entryNumber
      : 'ENT-' + Math.floor(100000 + Math.random() * 900000);

    // Create or reuse unpaid entry
    if (!submission) {
      submission = new Submission({
        userId: req.user._id.toString(),
        userName: req.user.name,
        userEmail: req.user.email,
        eventId: event._id.toString(),
        eventTitle: event.title,
        packageId: plan.packageId,
        eligibilityAccepted: true,
        entryNumber,
        amount: plan.amount,
        photoLimit: plan.limit,
        paymentStatus: 'Paid',
        entryStatus: 'Draft',
        photographs: []
      });
      await submission.save();
    } else {
      submission.packageId = plan.packageId;
      submission.amount = plan.amount;
      submission.photoLimit = plan.limit;
      submission.paymentStatus = 'Paid';
      await submission.save();
    }

    // Create a local Payment record
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
    const dummyPaymentId = 'DUMMY-' + Math.random().toString(36).substring(2, 15).toUpperCase();
    const payment = new Payment({
      userId: req.user._id.toString(),
      userName: req.user.name,
      userEmail: req.user.email,
      eventId: event._id.toString(),
      eventTitle: event.title,
      entryId: submission._id.toString(),
      packageId: plan.packageId,
      packageName: plan.name,
      amount: plan.amount,
      currency: 'INR',
      paymentMethod: 'Dummy Bypass',
      razorpayOrderId: 'dummy_order_' + Date.now(),
      razorpayPaymentId: dummyPaymentId,
      signatureVerified: true,
      status: 'Success',
      paymentDate: new Date(),
      transactionId: dummyPaymentId,
      invoiceNumber
    });

    await payment.save();
    submission.paymentId = payment._id.toString();
    await submission.save();

    await AuditLog.create({
      userId: req.user._id.toString(),
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Dummy Payment Bypass',
      details: `Processed dummy payment bypass for entry ${entryNumber} (Amount: ₹${plan.amount})`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Simulated payment processed successfully',
      submission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Razorpay webhook listener
// @route   POST /api/payments/webhook
// @access  Public (Signature Checked)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing signature header' });
    }

    const rawBodyStr = req.rawBody || JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_secret');
    hmac.update(rawBodyStr);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body;
    const eventId = event.id;

    // Deduplicate event processing
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      return res.json({ success: true, message: 'Event already processed' });
    }

    await WebhookEvent.create({
      eventId,
      eventType: event.event,
      processingStatus: 'Processed'
    });

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const orderId = event.payload.payment.entity.order_id;
      const paymentId = event.payload.payment.entity.id;

      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment && payment.status !== 'Success') {
        payment.status = 'Success';
        payment.razorpayPaymentId = paymentId;
        payment.signatureVerified = true;
        payment.paymentDate = new Date();
        payment.transactionId = paymentId;
        await payment.save();

        const submission = await Submission.findById(payment.entryId);
        if (submission) {
          submission.paymentStatus = 'Paid';
          submission.paymentId = payment._id.toString();
          await submission.save();
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
});

// @desc    Get participant transaction history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id.toString() }).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get single transaction detail
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.userId !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
