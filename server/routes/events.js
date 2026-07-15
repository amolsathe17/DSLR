const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { includeDrafts } = req.query;
    let query = {};
    if (includeDrafts !== 'true') {
      query.status = { $ne: 'Draft' };
    }
    
    const User = require('../models/User');
    const Submission = require('../models/Submission');
    const events = await Event.find(query).sort({ createdAt: -1 }).lean();
    
    for (let event of events) {
      if (event.winners && event.winners.length > 0) {
        for (let w of event.winners) {
          if (w.submissionId && w.photographId) {
            const sub = await Submission.findById(w.submissionId);
            const photo = sub?.photographs.find(p => p.id === w.photographId);
            if (photo) {
              w.fileUrl = w.fileUrl || photo.fileUrl;
              w.judges = photo.scores?.map(s => s.judgeName) || [];
            }
            if (sub) {
              const participantUser = await User.findById(sub.userId);
              if (participantUser) {
                w.userEmail = participantUser.email;
                w.userCity = participantUser.city;
              }
            }
          }
        }
      }
    }

    res.json({ success: true, events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.winners && event.winners.length > 0) {
      const User = require('../models/User');
      const Submission = require('../models/Submission');
      for (let w of event.winners) {
        if (w.submissionId && w.photographId) {
          const sub = await Submission.findById(w.submissionId);
          const photo = sub?.photographs.find(p => p.id === w.photographId);
          if (photo) {
            w.fileUrl = w.fileUrl || photo.fileUrl;
            w.judges = photo.scores?.map(s => s.judgeName) || [];
          }
          if (sub) {
            const participantUser = await User.findById(sub.userId);
            if (participantUser) {
              w.userEmail = participantUser.email;
              w.userCity = participantUser.city;
            }
          }
        }
      }
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { title, eventType, theme, description, rules, deadline, eventDate, prizes, faqs, terms, packages } = req.body;

    const event = await Event.create({
      title,
      eventType: eventType || 'Photography',
      theme,
      description,
      rules,
      deadline,
      eventDate,
      prizes,
      faqs,
      terms,
      packages,
      status: 'Draft',
      assignedJudges: []
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Create Event',
      details: `Created event: ${event.title}`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed contests cannot be modified' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Update Event',
      details: `Updated event: ${event.title}`,
      ipAddress: req.ip
    });

    res.json({ success: true, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const EventBackup = require('../models/EventBackup');
    const Submission = require('../models/Submission');
    const Payment = require('../models/Payment');
    const { generateBackupPdf } = require('../utils/backupPdf');
    const path = require('path');
    const fs = require('fs');

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Retrieve all related submissions and payments for backup
    const submissions = await Submission.find({ eventId: event._id });
    const payments = await Payment.find({ eventId: event._id });

    // Generate snapshot PDF path
    const sanitizedTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedTitle}_backup_${Date.now()}.pdf`;
    const backupDir = path.join(__dirname, '..', 'uploads', 'backups');
    const outputPath = path.join(backupDir, filename);

    // Generate PDF backup
    await generateBackupPdf(event, submissions, payments, outputPath);

    // Save backup DB reference
    await EventBackup.create({
      title: event.title,
      eventType: event.eventType,
      eventDate: event.eventDate || event.deadline,
      backupPath: `/uploads/backups/${filename}`
    });

    // Cleanup participant photographs files (local disk and Cloudinary)
    submissions.forEach(sub => {
      if (sub.photographs && sub.photographs.length > 0) {
        sub.photographs.forEach(photo => {
          // Delete main file
          if (photo.fileUrl && photo.fileUrl.startsWith('/uploads/')) {
            const fullPath = path.join(__dirname, '..', photo.fileUrl);
            if (fs.existsSync(fullPath)) {
              try { fs.unlinkSync(fullPath); } catch (err) { console.error('Unlink photo error:', err.message); }
            }
          }
          // Delete raw file
          if (photo.rawFileUrl && photo.rawFileUrl.startsWith('/uploads/')) {
            const fullRawPath = path.join(__dirname, '..', photo.rawFileUrl);
            if (fs.existsSync(fullRawPath)) {
              try { fs.unlinkSync(fullRawPath); } catch (err) { console.error('Unlink RAW error:', err.message); }
            }
          }
          // Delete Cloudinary assets
          if (photo.cloudinaryPublicId) {
            try {
              const cloudinary = require('../config/cloudinary');
              if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
                cloudinary.uploader.destroy(photo.cloudinaryPublicId).catch(cErr => console.error('Cloudinary destroy error:', cErr.message));
              }
            } catch (err) {
              console.warn('Cloudinary cleanup skipped:', err.message);
            }
          }
        });
      }
    });

    // Perform cascade database deletions
    await Submission.deleteMany({ eventId: event._id });
    await Payment.deleteMany({ eventId: event._id });
    await Event.deleteOne({ _id: event._id });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Delete Event with PDF Backup',
      details: `Deleted event: "${event.title}" and generated archive ledger PDF backup`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Event successfully archived & deleted' });
  } catch (error) {
    console.error('Delete event backup error:', error);
    res.status(500).json({ success: false, message: 'Server error during delete: ' + error.message });
  }
});

// @desc    Get all event backups
// @route   GET /api/events/backups/list
// @access  Private/Admin
router.get('/backups/list', protect, authorize('Admin'), async (req, res) => {
  try {
    const EventBackup = require('../models/EventBackup');
    const backups = await EventBackup.find({}).sort({ deletedAt: -1 });
    res.json({ success: true, backups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving backups' });
  }
});

// @desc    Publish winner rankings
// @route   POST /api/events/:id/publish-winners
// @access  Private/Admin
router.post('/:id/publish-winners', protect, authorize('Admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.winners = req.body.winners;
    event.winnersPublished = true;
    event.status = 'Completed';
    await event.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Publish Winners',
      details: `Published winners for event: ${event.title}`,
      ipAddress: req.ip
    });

    res.json({ success: true, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/events/:id/confirm-grading
// @access  Private/Judge
router.post('/:id/confirm-grading', protect, authorize('Judge'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const judgeId = req.user._id.toString();
    if (!event.assignedJudges || !event.assignedJudges.includes(judgeId)) {
      return res.status(403).json({ success: false, message: 'You are not assigned as a judge for this event' });
    }

    // Double check that all finalized entries have been graded by this judge
    const Submission = require('../models/Submission');
    const submissions = await Submission.find({ eventId: event._id.toString(), isFinalSubmitted: true });
    
    let allGraded = true;
    let pendingCount = 0;

    submissions.forEach(sub => {
      sub.photographs.forEach(photo => {
        const hasScore = photo.scores.some(s => s.judgeId === judgeId);
        if (!hasScore) {
          allGraded = false;
          pendingCount++;
        }
      });
    });

    if (!allGraded) {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm review yet. You have ${pendingCount} assigned photographs left to score.`
      });
    }

    if (!event.confirmedJudges) {
      event.confirmedJudges = [];
    }

    if (!event.confirmedJudges.includes(judgeId)) {
      event.confirmedJudges.push(judgeId);
    }

    await event.save();

    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Confirm Event Grading',
      details: `Judge signed off on grading for event: ${event.title}`,
      ipAddress: req.ip
    });

    res.json({ success: true, event, message: 'Grading evaluation successfully confirmed and signed off!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Upload login background image
// @route   POST /api/events/upload-bg
// @access  Private (Admin only)
router.post('/upload-bg', protect, authorize('Admin'), (req, res, next) => {
  const upload = require('../middleware/upload');
  upload.single('loginBg')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a background image' });
    }

    const path = require('path');
    const fs = require('fs');
    let fileUrl = `/uploads/${req.file.filename}`;

    // Try Cloudinary if configured
    try {
      const cloudinary = require('../config/cloudinary');
      if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'dslr_contest/assets',
          resource_type: 'image'
        });
        fileUrl = result.secure_url;
        
        // Clean up local temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    } catch (cloudinaryErr) {
      console.warn('Cloudinary upload failed, falling back to local file:', cloudinaryErr.message);
    }

    res.json({
      success: true,
      fileUrl
    });
  } catch (error) {
    console.error('Upload background error:', error);
    res.status(500).json({ success: false, message: 'Server error during background upload: ' + error.message });
  }
});

module.exports = router;
