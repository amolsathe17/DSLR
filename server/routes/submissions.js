const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Submission = require('../models/Submission');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// Helper to calculate file MD5 hash
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

// @desc    Get participant's current submission
// @route   GET /api/submissions/my-submission/:eventId
// @access  Private
router.get('/my-submission/:eventId', protect, async (req, res) => {
  try {
    const submission = await Submission.findOne({ userId: req.user._id, eventId: req.params.eventId });
    if (!submission) {
      return res.json({ success: true, submission: null });
    }
    res.json({ success: true, submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Start/Update submission package and declaration
// @route   POST /api/submissions/start
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const { eventId, packageId, eligibilityAccepted } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!eligibilityAccepted) {
      return res.status(400).json({ success: false, message: 'You must accept the DSLR Eligibility Declaration' });
    }

    let submission = await Submission.findOne({ userId: req.user._id, eventId });

    if (submission) {
      if (submission.isFinalSubmitted) {
        return res.status(400).json({ success: false, message: 'Entry has already been finalized' });
      }
      submission.packageId = packageId;
      submission.eligibilityAccepted = eligibilityAccepted;
      await submission.save();
    } else {
      submission = await Submission.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        eventId,
        eventTitle: event.title,
        packageId,
        eligibilityAccepted,
        isFinalSubmitted: false,
        photographs: []
      });
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Upload photograph (high-res image or RAW file)
// @route   POST /api/submissions/upload
// @access  Private
router.post('/upload', protect, upload.fields([
  { name: 'photoFile', maxCount: 1 },
  { name: 'rawFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { eventId, title, category, cameraBrand, cameraModel, lensUsed, location, dateCaptured, description } = req.body;
    
    if (!req.files || !req.files.photoFile) {
      return res.status(400).json({ success: false, message: 'Please upload a photo' });
    }

    const photoFile = req.files.photoFile[0];
    const rawFile = req.files.rawFile ? req.files.rawFile[0] : null;

    const submission = await Submission.findOne({ userId: req.user._id, eventId });
    if (!submission) {
      // Remove files if submission not started
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({ success: false, message: 'Submission not started. Please select a package first.' });
    }

    if (submission.isFinalSubmitted) {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({ success: false, message: 'Entry has already been finalized' });
    }

    const event = await Event.findById(eventId);
    const selectedPackage = event.packages.find(p => p.id === submission.packageId);
    
    if (submission.photographs.length >= selectedPackage.maxPhotos) {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({ 
        success: false, 
        message: `Upload limit reached. Your package allows a maximum of ${selectedPackage.maxPhotos} photographs.` 
      });
    }

    // Duplicate Check using MD5 Hash
    const fileHash = await calculateFileHash(photoFile.path);
    
    // Check if this hash exists in any submission in this event
    const duplicateSubmission = await Submission.findOne({
      eventId,
      'photographs.fileHash': fileHash
    });

    if (duplicateSubmission) {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate Image detected! This photograph has already been uploaded by you or another participant.' 
      });
    }

    // Generate relative file URLs
    const fileUrl = `/uploads/${photoFile.filename}`;
    const rawFileUrl = rawFile ? `/uploads/${rawFile.filename}` : undefined;

    const newPhoto = {
      id: Math.random().toString(36).substring(2, 11) + Date.now().toString().slice(-4),
      title: title || 'Untitled',
      category: category || 'General',
      cameraBrand: cameraBrand || 'Unknown',
      cameraModel: cameraModel || 'Unknown',
      lensUsed: lensUsed || '',
      location: location || '',
      dateCaptured: dateCaptured || '',
      description: description || '',
      fileUrl,
      rawFileUrl,
      fileHash,
      fileSizeBytes: photoFile.size,
      status: 'Pending',
      scores: [],
      assignedJudges: []
    };

    submission.photographs.push(newPhoto);
    await submission.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Upload Photograph',
      details: `Uploaded photo: "${newPhoto.title}" (Hash: ${fileHash})`,
      ipAddress: req.ip
    });

    res.json({ success: true, submission, newPhoto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during upload. ' + error.message });
  }
});

// @desc    Delete a photograph from submission
// @route   DELETE /api/submissions/photo/:eventId/:photoId
// @access  Private
router.delete('/photo/:eventId/:photoId', protect, async (req, res) => {
  try {
    const { eventId, photoId } = req.params;
    const submission = await Submission.findOne({ userId: req.user._id, eventId });
    
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.isFinalSubmitted) {
      return res.status(400).json({ success: false, message: 'Entry has already been finalized' });
    }

    const photoIndex = submission.photographs.findIndex(p => p.id === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Photograph not found in submission' });
    }

    const photo = submission.photographs[photoIndex];

    // Try to remove local files
    try {
      const mainPath = path.join(__dirname, '..', photo.fileUrl);
      if (fs.existsSync(mainPath)) fs.unlinkSync(mainPath);
      if (photo.rawFileUrl) {
        const rawPath = path.join(__dirname, '..', photo.rawFileUrl);
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      }
    } catch (e) {
      console.error('File cleanup error: ', e.message);
    }

    submission.photographs.splice(photoIndex, 1);
    await submission.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Delete Photograph',
      details: `Removed photo ID: ${photoId}`,
      ipAddress: req.ip
    });

    res.json({ success: true, submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Save drafts of metadata details
// @route   POST /api/submissions/save-draft
// @access  Private
router.post('/save-draft', protect, async (req, res) => {
  try {
    const { eventId, photographs } = req.body;

    const submission = await Submission.findOne({ userId: req.user._id, eventId });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.isFinalSubmitted) {
      return res.status(400).json({ success: false, message: 'Entry has already been finalized' });
    }

    // Update text details of uploaded photographs
    photographs.forEach(p => {
      const idx = submission.photographs.findIndex(sp => sp.id === p.id);
      if (idx !== -1) {
        submission.photographs[idx].title = p.title || submission.photographs[idx].title;
        submission.photographs[idx].category = p.category || submission.photographs[idx].category;
        submission.photographs[idx].cameraBrand = p.cameraBrand || submission.photographs[idx].cameraBrand;
        submission.photographs[idx].cameraModel = p.cameraModel || submission.photographs[idx].cameraModel;
        submission.photographs[idx].lensUsed = p.lensUsed || submission.photographs[idx].lensUsed;
        submission.photographs[idx].location = p.location || submission.photographs[idx].location;
        submission.photographs[idx].dateCaptured = p.dateCaptured || submission.photographs[idx].dateCaptured;
        submission.photographs[idx].description = p.description || submission.photographs[idx].description;
      }
    });

    await submission.save();
    res.json({ success: true, submission, message: 'Draft saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Final submit entries (locks editing, checks payment status)
// @route   POST /api/submissions/final-submit
// @access  Private
router.post('/final-submit', protect, async (req, res) => {
  try {
    const { eventId } = req.body;

    const submission = await Submission.findOne({ userId: req.user._id, eventId });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.isFinalSubmitted) {
      return res.status(400).json({ success: false, message: 'Entry has already been finalized' });
    }

    if (submission.photographs.length === 0) {
      return res.status(400).json({ success: false, message: 'You must upload at least one photograph' });
    }

    // Check payment status
    const payment = await Payment.findOne({ userId: req.user._id, eventId, status: 'Success' });
    if (!payment) {
      return res.status(400).json({ success: false, message: 'No valid payment found for this event. Entry is valid only after payment.' });
    }

    submission.isFinalSubmitted = true;
    submission.paymentId = payment._id;
    submission.submissionDate = new Date();
    await submission.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Final Submit Contest Entry',
      details: `Submission finalized with ${submission.photographs.length} photographs. Payment ID: ${payment._id}`,
      ipAddress: req.ip
    });

    res.json({ success: true, submission, message: 'Submission finalized! Good luck in the competition!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get all approved photographs for public gallery
// @route   GET /api/submissions/gallery
// @access  Public
router.get('/gallery', async (req, res) => {
  try {
    const submissions = await Submission.find({ isFinalSubmitted: true });
    const approvedPhotos = [];
    
    submissions.forEach(sub => {
      sub.photographs.forEach(photo => {
        if (photo.status === 'Approved') {
          approvedPhotos.push({
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
            participantName: sub.userName
          });
        }
      });
    });

    res.json({ success: true, photographs: approvedPhotos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
