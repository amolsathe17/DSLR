const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Submission = require('../models/Submission');
const Payment = require('../models/Payment');
const Photo = require('../models/Photo');
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

// @desc    Get all events history with details
// @route   GET /api/admin/events-history
// @access  Private/Admin
router.get('/events-history', protect, authorize('Admin'), async (req, res) => {
  try {
    const events = await Event.find({}).sort({ createdAt: -1 });

    const history = [];

    for (const event of events) {
      // Find submissions for this event
      const submissions = await Submission.find({ eventId: event._id.toString() });

      // Unique participants count
      const participantIds = new Set(submissions.map(s => s.userId));
      const participantsCount = participantIds.size;

      // Extract participant details (names and emails)
      const participantDetails = [];
      const seenUserIds = new Set();
      submissions.forEach(sub => {
        if (!seenUserIds.has(sub.userId)) {
          seenUserIds.add(sub.userId);
          participantDetails.push({
            userId: sub.userId,
            name: sub.userName || 'Unknown',
            email: sub.userEmail || 'N/A',
            isFinalSubmitted: sub.isFinalSubmitted
          });
        }
      });

      // Photos details
      let totalPhotos = 0;
      let approvedPhotos = 0;
      let rejectedPhotos = 0;
      let pendingPhotos = 0;

      submissions.forEach(s => {
        s.photographs.forEach(p => {
          totalPhotos++;
          if (p.status === 'Approved') approvedPhotos++;
          else if (p.status === 'Rejected') rejectedPhotos++;
          else pendingPhotos++;
        });
      });

      // Payments stats for this event
      const payments = await Payment.find({ eventId: event._id.toString(), status: 'Success' });
      const totalPaymentsCount = payments.length;
      const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

      const paymentDetails = payments.map(p => ({
        userName: p.userName || 'Unknown',
        userEmail: p.userEmail || 'N/A',
        amount: p.amount,
        packageName: p.packageName,
        transactionId: p.transactionId,
        paymentDate: p.paymentDate || p.createdAt
      }));

      // Judges names
      const judgeUsers = await User.find({ _id: { $in: event.assignedJudges || [] } });
      const judgeDetails = judgeUsers.map(j => ({
        id: j._id,
        name: j.name,
        email: j.email,
        city: j.city,
        hasConfirmed: event.confirmedJudges?.includes(j._id.toString())
      }));

      history.push({
        id: event._id,
        title: event.title,
        theme: event.theme,
        status: event.status,
        deadline: event.deadline,
        createdAt: event.createdAt,
        winnersPublished: event.winnersPublished,
        winners: event.winners || [],
        participantsCount,
        participantDetails,
        totalPhotos,
        approvedPhotos,
        rejectedPhotos,
        pendingPhotos,
        totalPaymentsCount,
        totalRevenue,
        paymentDetails,
        judgeDetails
      });
    }

    res.json({ success: true, history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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
      const payment = await Payment.findOne({ userId: p._id.toString() }).sort({ createdAt: -1 });
      
      let computedPaymentStatus = 'Unpaid';
      if (submission && submission.paymentStatus) {
        computedPaymentStatus = submission.paymentStatus;
      } else if (payment) {
        if (payment.status === 'Success') computedPaymentStatus = 'Paid';
        else if (payment.status === 'Refunded') computedPaymentStatus = 'Refunded';
        else if (payment.status === 'Failed') computedPaymentStatus = 'Failed';
      } else if (submission?.paymentId) {
        computedPaymentStatus = 'Pending';
      }

      return {
        _id: p._id,
        name: p.name,
        email: p.email,
        mobile: p.mobile,
        city: p.city,
        isVerified: p.isVerified,
        isSuspended: p.isSuspended,
        suspensionReason: p.suspensionReason,
        createdAt: p.createdAt,
        lastLogin: p.lastLogin,
        packageId: submission ? submission.packageId : 'None',
        isFinalSubmitted: submission ? submission.isFinalSubmitted : false,
        paymentStatus: computedPaymentStatus,
        photosCount: submission ? submission.photographs.length : 0,
        // Entry metadata
        entryNumber: submission ? submission.entryNumber : 'N/A',
        amount: submission ? submission.amount : 0,
        photoLimit: submission ? submission.photoLimit : 0,
        remainingSlots: submission ? (submission.photoLimit - submission.photographs.length) : 0,
        entryStatus: submission ? (submission.isFinalSubmitted ? 'Finalized' : 'Draft') : 'None',
        razorpayOrderId: payment ? payment.razorpayOrderId : 'N/A',
        razorpayPaymentId: payment ? payment.razorpayPaymentId : 'N/A',
        paymentDate: payment ? payment.paymentDate : null,
        photographs: submission ? submission.photographs : []
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

    if (req.body.isSuspended && (!req.body.suspensionReason || req.body.suspensionReason.trim() === '')) {
      return res.status(400).json({ success: false, message: 'Suspension explanation/remarks is required.' });
    }

    user.isSuspended = req.body.isSuspended;
    if (user.isSuspended) {
      user.suspensionReason = req.body.suspensionReason;
    } else {
      user.suspensionReason = undefined;
    }
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

    // Find if user has any submissions in completed events
    const Submission = require('../models/Submission');
    const submissions = await Submission.find({ userId: req.params.id });
    const eventIds = submissions.map(s => s.eventId);
    const completedEvents = await Event.countDocuments({
      _id: { $in: eventIds },
      status: 'Completed'
    });

    if (completedEvents > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete participant as they have active submissions in a Completed contest.' });
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

// @desc    Delete judge user
// @route   DELETE /api/admin/judges/:id
// @access  Private/Admin
router.delete('/judges/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Judge not found' });
    }

    if (user.role !== 'Judge') {
      return res.status(400).json({ success: false, message: 'User is not a judge' });
    }

    // Find if judge is assigned to any completed events
    const completedEventsWithJudge = await Event.countDocuments({
      assignedJudges: req.params.id,
      status: 'Completed'
    });

    if (completedEventsWithJudge > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete judge as they have evaluations in a Completed contest.' });
    }

    await User.deleteOne({ _id: req.params.id });

    // Pull from all event assignedJudges and confirmedJudges
    await Event.updateMany({}, {
      $pull: {
        assignedJudges: req.params.id,
        confirmedJudges: req.params.id
      }
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Delete Judge',
      details: `Deleted judge user and removed them from all assigned events: ${user.email}`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Judge account deleted successfully and unassigned from all events' });
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
    const { search, category, status, dslrStatus } = req.query;
    
    // Find all submissions containing photographs
    const query = {};
    const submissions = await Submission.find(query);

    let allPhotos = [];
    submissions.forEach(sub => {
      sub.photographs.forEach(photo => {
        allPhotos.push({
          submissionId: sub._id,
          eventId: sub.eventId,
          userId: sub.userId,
          participantName: sub.userName,
          participantEmail: sub.userEmail,
          isFinalSubmitted: sub.isFinalSubmitted,
          paymentStatus: sub.paymentStatus || 'Unpaid',
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
          assignedJudges: photo.assignedJudges || [],
          scores: photo.scores || [],
          // Newly added fields
          cloudinaryPublicId: photo.cloudinaryPublicId,
          width: photo.width,
          height: photo.height,
          format: photo.format,
          dslrValidationStatus: photo.dslrValidationStatus || 'MANUAL_REVIEW',
          validationReason: photo.validationReason || '',
          originalFilename: photo.originalFilename || '',
          uploadTimestamp: photo.uploadTimestamp || photo.createdAt,
          deletionStatus: photo.deletionStatus || false,
          averageScore: (photo.scores && photo.scores.length > 0)
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
    if (dslrStatus) {
      allPhotos = allPhotos.filter(p => p.dslrValidationStatus === dslrStatus);
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
    
    // Sync status change to stand-alone Photo collection
    const photo = submission.photographs[photoIndex];
    if (photo.cloudinaryPublicId) {
      const photoDoc = await Photo.findOne({ 
        entryId: submission._id.toString(),
        cloudinaryPublicId: photo.cloudinaryPublicId
      });
      if (photoDoc) {
        photoDoc.dslrValidationStatus = status === 'Approved' ? 'VERIFIED' : 'REJECTED';
        photoDoc.validationReason = status === 'Approved' ? 'Admin approved.' : `Admin rejected. Reason: ${rejectReason}`;
        await photoDoc.save();
      }
    }
    
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

// @desc    Refund a participant's payment
// @route   POST /api/admin/participants/:id/refund
// @access  Private/Admin
router.post('/participants/:id/refund', protect, authorize('Admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    // Find active success payments for the user
    const payment = await Payment.findOne({ userId: userId.toString(), status: 'Success' });
    if (!payment) {
      return res.status(400).json({ success: false, message: 'No successful payment found for this participant' });
    }

    // Update payment status to Refunded
    payment.status = 'Refunded';
    await payment.save();

    // Update all matching user submissions' paymentStatus to Refunded
    await Submission.updateMany(
      { userId: userId.toString() },
      { $set: { paymentStatus: 'Refunded' } }
    );

    // Create Audit Log
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Refund Payment',
      details: `Refunded payment transaction ${payment.transactionId} for participant ${user.email} of amount ₹${payment.amount}`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Payment successfully marked as Refunded and credited back.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
