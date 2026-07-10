const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Submission = require('../models/Submission');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Helper to check and parse date strings safely
const getStartOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// @desc    Get dashboard statistics and chart data
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
router.get('/dashboard-stats', protect, authorize('Admin'), async (req, res) => {
  try {
    const todayStart = getStartOfDay(new Date());

    // 1. Total Counts
    const totalParticipants = await User.countDocuments({ role: 'Participant' });
    const totalEntries = await Submission.countDocuments({ isFinalSubmitted: true });
    
    // Count total uploaded photos across all submissions
    const submissions = await Submission.find({});
    let totalPhotos = 0;
    submissions.forEach(s => {
      totalPhotos += s.photographs.length;
    });

    // Registrations today
    const todayRegistrations = await User.countDocuments({
      role: 'Participant',
      createdAt: { $gte: todayStart }
    });

    // Revenue and payments stats
    const successfulPayments = await Payment.find({ status: 'Success' });
    const totalRevenue = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

    const todayPaymentsCount = await Payment.countDocuments({
      status: 'Success',
      paymentDate: { $gte: todayStart }
    });

    const todayRevenue = (await Payment.find({
      status: 'Success',
      paymentDate: { $gte: todayStart }
    })).reduce((acc, curr) => acc + curr.amount, 0);

    const pendingPaymentsCount = await Payment.countDocuments({ status: 'Pending' });

    // 2. Category-wise statistics
    const categoryStatsMap = {};
    submissions.forEach(s => {
      s.photographs.forEach(p => {
        categoryStatsMap[p.category] = (categoryStatsMap[p.category] || 0) + 1;
      });
    });
    const categoryStats = Object.keys(categoryStatsMap).map(name => ({
      name,
      value: categoryStatsMap[name]
    }));

    // 3. Daily Registrations & Revenue charts data (last 7 days)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dayStart = getStartOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const regCount = await User.countDocuments({
        role: 'Participant',
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });

      const dayPayments = await Payment.find({
        status: 'Success',
        paymentDate: { $gte: dayStart, $lt: dayEnd }
      });
      const revSum = dayPayments.reduce((acc, curr) => acc + curr.amount, 0);

      dailyStats.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: regCount,
        revenue: revSum
      });
    }

    res.json({
      success: true,
      stats: {
        totalParticipants,
        totalEntries,
        totalPhotos,
        todayRegistrations,
        todayPaymentsCount,
        pendingPaymentsCount,
        totalRevenue,
        todayRevenue
      },
      charts: {
        dailyStats,
        categoryStats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get all participants with search, filter, and pagination
// @route   GET /api/admin/participants
// @access  Private/Admin
router.get('/participants', protect, authorize('Admin'), async (req, res) => {
  try {
    const { search, city, isSuspended, limit = 100, page = 1 } = req.query;
    
    const filter = { role: 'Participant' };
    if (city) filter.city = city;
    if (isSuspended) filter.isSuspended = isSuspended === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const participants = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    // Fetch submission packages and payment statuses for each participant
    const detailedParticipants = await Promise.all(participants.map(async (p) => {
      const submission = await Submission.findOne({ userId: p._id.toString() });
      const payment = await Payment.findOne({ userId: p._id.toString(), status: 'Success' });
      return {
        _id: p._id,
        name: p.name,
        email: p.email,
        mobile: p.mobile,
        city: p.city,
        isVerified: p.isVerified,
        isSuspended: p.isSuspended,
        createdAt: p.createdAt,
        lastLogin: p.lastLogin,
        packageId: submission ? submission.packageId : 'None',
        isFinalSubmitted: submission ? submission.isFinalSubmitted : false,
        paymentStatus: payment ? 'Paid' : (submission?.paymentId ? 'Pending' : 'Unpaid'),
        photosCount: submission ? submission.photographs.length : 0
      };
    }));

    res.json({
      success: true,
      participants: detailedParticipants,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Suspend or unsuspend a participant
// @route   PUT /api/admin/participants/:id/suspend
// @access  Private/Admin
router.put('/participants/:id/suspend', protect, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    user.isSuspended = req.body.isSuspended;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: user.isSuspended ? 'Suspend User' : 'Unsuspend User',
      details: `${user.isSuspended ? 'Suspended' : 'Unsuspended'} user: ${user.email}`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: `Participant account ${user.isSuspended ? 'suspended' : 'activated'}`, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete participant user
// @route   DELETE /api/admin/participants/:id
// @access  Private/Admin
router.delete('/participants/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    await User.deleteOne({ _id: req.params.id });
    await Submission.deleteMany({ userId: req.params.id });
    await Payment.deleteMany({ userId: req.params.id });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Delete User',
      details: `Deleted user and all associated entries/payments: ${user.email}`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Participant and all associated submissions/payments deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get all uploaded photographs (for approval / assignment)
// @route   GET /api/admin/photographs
// @access  Private/Admin
router.get('/photographs', protect, authorize('Admin'), async (req, res) => {
  try {
    const { search, category, status } = req.query;
    
    // Find all submissions containing photographs
    const query = {};
    const submissions = await Submission.find(query);

    let allPhotos = [];
    submissions.forEach(sub => {
      sub.photographs.forEach(photo => {
        allPhotos.push({
          submissionId: sub._id,
          userId: sub.userId,
          participantName: sub.userName,
          participantEmail: sub.userEmail,
          isFinalSubmitted: sub.isFinalSubmitted,
          photoId: photo.id,
          title: photo.title,
          category: photo.category,
          cameraBrand: photo.cameraBrand,
          cameraModel: photo.cameraModel,
          lensUsed: photo.lensUsed,
          location: photo.location,
          dateCaptured: photo.dateCaptured,
          description: photo.description,
          fileUrl: photo.fileUrl,
          rawFileUrl: photo.rawFileUrl,
          fileHash: photo.fileHash,
          fileSizeBytes: photo.fileSizeBytes,
          status: photo.status,
          rejectReason: photo.rejectReason,
          assignedJudges: photo.assignedJudges,
          scores: photo.scores,
          averageScore: photo.scores.length > 0
            ? parseFloat((photo.scores.reduce((acc, s) => acc + s.averageScore, 0) / photo.scores.length).toFixed(2))
            : 0
        });
      });
    });

    // Apply filters
    if (category) {
      allPhotos = allPhotos.filter(p => p.category === category);
    }
    if (status) {
      allPhotos = allPhotos.filter(p => p.status === status);
    }
    if (search) {
      const term = search.toLowerCase();
      allPhotos = allPhotos.filter(p => 
        p.title.toLowerCase().includes(term) ||
        p.participantName.toLowerCase().includes(term) ||
        p.cameraModel.toLowerCase().includes(term)
      );
    }

    res.json({ success: true, photographs: allPhotos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Approve or reject a photograph
// @route   PUT /api/admin/photographs/:submissionId/:photoId/status
// @access  Private/Admin
router.put('/photographs/:submissionId/:photoId/status', protect, authorize('Admin'), async (req, res) => {
  try {
    const { submissionId, photoId } = req.params;
    const { status, rejectReason } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const photoIndex = submission.photographs.findIndex(p => p.id === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Photograph not found' });
    }

    submission.photographs[photoIndex].status = status;
    submission.photographs[photoIndex].rejectReason = status === 'Rejected' ? rejectReason : '';
    await submission.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: status === 'Approved' ? 'Approve Photograph' : 'Reject Photograph',
      details: `${status} photo ID: ${photoId} in submission: ${submissionId}. ${rejectReason ? 'Reason: ' + rejectReason : ''}`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: `Photograph ${status.toLowerCase()} successfully`, submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create a Judge user account
// @route   POST /api/admin/judges
// @access  Private/Admin
router.post('/judges', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, email, mobile, password, city } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const judge = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      city,
      role: 'Judge',
      isVerified: true // Judge accounts pre-verified
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Create Judge Account',
      details: `Created judge user account: ${judge.email}`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, judge: { id: judge._id, name: judge.name, email: judge.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get all Judges
// @route   GET /api/admin/judges
// @access  Private/Admin
router.get('/judges', protect, authorize('Admin'), async (req, res) => {
  try {
    const judges = await User.find({ role: 'Judge' }).sort({ createdAt: -1 });
    res.json({ success: true, judges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Assign photograph to judges
// @route   POST /api/admin/photographs/assign-judges
// @access  Private/Admin
router.post('/photographs/assign-judges', protect, authorize('Admin'), async (req, res) => {
  try {
    const { assignments } = req.body; // Array of { submissionId, photoId, judgeIds: [] }

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ success: false, message: 'Assignments list must be an array' });
    }

    for (const assign of assignments) {
      const { submissionId, photoId, judgeIds } = assign;
      const submission = await Submission.findById(submissionId);
      if (submission) {
        const idx = submission.photographs.findIndex(p => p.id === photoId);
        if (idx !== -1) {
          submission.photographs[idx].assignedJudges = judgeIds;
          await submission.save();
        }
      }
    }

    res.json({ success: true, message: 'Photographs assigned to judges successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get financial transactions list
// @route   GET /api/admin/transactions
// @access  Private/Admin
router.get('/transactions', protect, authorize('Admin'), async (req, res) => {
  try {
    const transactions = await Payment.find({}).sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
