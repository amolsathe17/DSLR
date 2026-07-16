const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const exifr = require('exifr');
const cloudinary = require('../config/cloudinary');
const Submission = require('../models/Submission');
const Photo = require('../models/Photo');
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

// Helper for backend DSLR EXIF checks
const validateDSLR = (exif) => {
  if (!exif || (!exif.Make && !exif.Model)) {
    return {
      status: 'MANUAL_REVIEW',
      reason: 'No camera EXIF device signatures detected.'
    };
  }

  const make = (exif.Make || '').toLowerCase().trim();
  const model = (exif.Model || '').toLowerCase().trim();

  // Mobile device list
  const mobileBrands = [
    'apple', 'samsung', 'google', 'xiaomi', 'oneplus', 'huawei', 'oppo', 'vivo',
    'realme', 'motorola', 'nokia', 'lg', 'htc', 'lenovo', 'asus', 'meizu', 'sony mobile'
  ];

  const isMobile = mobileBrands.some(brand => make.includes(brand) || model.includes(brand));
  if (isMobile) {
    return {
      status: 'REJECTED',
      reason: `Mobile photography is prohibited. Detected mobile camera: ${exif.Make} ${exif.Model}`
    };
  }

  // DSLR / Mirrorless brands
  const dslrBrands = [
    'canon', 'nikon', 'sony', 'fujifilm', 'olympus', 'panasonic', 'leica', 'pentax',
    'hasselblad', 'sigma', 'ricoh', 'phase one', 'kodak', 'mamiya'
  ];

  const isDslr = dslrBrands.some(brand => make.includes(brand));
  if (isDslr) {
    return {
      status: 'VERIFIED',
      reason: `DSLR/Mirrorless camera verification passed: ${exif.Make} ${exif.Model}`
    };
  }

  return {
    status: 'MANUAL_REVIEW',
    reason: `EXIF camera brand (${exif.Make} ${exif.Model}) is inconclusive. Set to manual admin review.`
  };
};

// @desc    Get participant's current submission
// @route   GET /api/submissions/my-submission/:eventId
// @access  Private
router.get('/my-submission/:eventId', protect, async (req, res) => {
  try {
    const submission = await Submission.findOne({ userId: req.user._id.toString(), eventId: req.params.eventId });
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

    // Find dynamic package from event configurations
    const matchedPkg = event.packages.find(p => p.id === packageId || p.name === packageId || p._id?.toString() === packageId);
    if (!matchedPkg) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const plan = {
      amount: matchedPkg.price,
      limit: matchedPkg.maxPhotos,
      packageId: matchedPkg.id || matchedPkg._id?.toString(),
      name: matchedPkg.name
    };

    let submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });

    const entryNumber = submission && submission.entryNumber
      ? submission.entryNumber
      : 'ENT-' + Math.floor(100000 + Math.random() * 900000);

    if (submission) {
      if (submission.isFinalSubmitted) {
        return res.status(400).json({ success: false, message: 'Entry has already been finalized' });
      }
      submission.packageId = plan.packageId;
      submission.amount = plan.amount;
      submission.photoLimit = plan.limit;
      submission.eligibilityAccepted = eligibilityAccepted;
      await submission.save();
    } else {
      submission = await Submission.create({
        userId: req.user._id.toString(),
        userName: req.user.name,
        userEmail: req.user.email,
        eventId,
        eventTitle: event.title,
        packageId: plan.packageId,
        eligibilityAccepted,
        entryNumber,
        amount: plan.amount,
        photoLimit: plan.limit,
        paymentStatus: 'Unpaid',
        entryStatus: 'Draft',
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
    const { eventId, title, category, location, description } = req.body;

    if (!req.files || !req.files.photoFile) {
      return res.status(400).json({ success: false, message: 'Please upload a photo' });
    }

    const photoFile = req.files.photoFile[0];
    const rawFile = req.files.rawFile ? req.files.rawFile[0] : null;

    if (photoFile.size > 800 * 1024) {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({ success: false, message: 'Photograph file size must be below 800 KB.' });
    }

    const submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });
    if (!submission) {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({ success: false, message: 'Submission not started. Please select a package first.' });
    }

    if (submission.isFinalSubmitted) {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({ success: false, message: 'Entry has already been finalized' });
    }

    if (submission.photographs.length >= submission.photoLimit) {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({
        success: false,
        message: `Upload limit reached. Your plan allows a maximum of ${submission.photoLimit} photographs.`
      });
    }

    // Duplicate Check using MD5 Hash
    const fileHash = await calculateFileHash(photoFile.path);
    const duplicateSubmission = await Submission.findOne({
      eventId,
      'photographs.fileHash': fileHash
    });

    if (duplicateSubmission) {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({
        success: false,
        message: 'Duplicate Image detected! This photograph has already been uploaded.'
      });
    }

    // Backend EXIF Validation Check via exifr
    let exif = null;
    let width = null;
    let height = null;
    let format = path.extname(photoFile.originalname).substring(1).toUpperCase();
    let cameraMake = 'Unknown';
    let cameraModel = 'Unknown';
    let lensModel = '';
    let originalCaptureDate = null;

    try {
      exif = await exifr.parse(photoFile.path, {
        tiff: true,
        xmp: true,
        exif: true
      });

      if (exif) {
        cameraMake = exif.Make || 'Unknown';
        cameraModel = exif.Model || 'Unknown';
        lensModel = exif.LensModel || exif.LensUsed || '';
        originalCaptureDate = exif.DateTimeOriginal ? new Date(exif.DateTimeOriginal) : null;
        width = exif.ExifImageWidth || exif.ImageWidth || null;
        height = exif.ExifImageHeight || exif.ImageHeight || null;
      }
    } catch (exifErr) {
      console.warn('EXIF validation skipped:', exifErr.message);
    }

    // Override or fallback with user-supplied details from request body if provided
    if (req.body.cameraBrand) {
      cameraMake = req.body.cameraBrand;
    }
    if (req.body.cameraModel) {
      cameraModel = req.body.cameraModel;
    }
    if (req.body.lensUsed) {
      lensModel = req.body.lensUsed;
    }
    if (req.body.dateCaptured) {
      originalCaptureDate = new Date(req.body.dateCaptured);
    }

    const dslrCheck = validateDSLR(exif);

    if (dslrCheck.status === 'REJECTED') {
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(400).json({
        success: false,
        message: dslrCheck.reason
      });
    }

    // Cloudinary Upload
    let cloudinaryResult;
    try {
      const folderPath = `photography-event/2026/${submission.entryNumber}/${req.user._id.toString()}`;
      const publicId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      cloudinaryResult = await cloudinary.uploader.upload(photoFile.path, {
        folder: folderPath,
        public_id: publicId,
        resource_type: 'image'
      });
    } catch (cldErr) {
      console.error('Cloudinary Error:', cldErr.message);
      fs.unlinkSync(photoFile.path);
      if (rawFile) fs.unlinkSync(rawFile.path);
      return res.status(500).json({
        success: false,
        message: 'Could not upload photograph online to Cloudinary.',
        error: cldErr.message
      });
    }

    // Clean up local temp photo
    fs.unlinkSync(photoFile.path);

    let rawFileUrl = '';
    if (rawFile) {
      try {
        const folderPath = `photography-event/2026/${submission.entryNumber}/${req.user._id.toString()}`;
        const rawPublicId = `raw_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const rawCloudinaryResult = await cloudinary.uploader.upload(rawFile.path, {
          folder: folderPath,
          public_id: rawPublicId,
          resource_type: 'raw'
        });
        rawFileUrl = rawCloudinaryResult.secure_url;
      } catch (rawErr) {
        console.warn('RAW file upload warning:', rawErr.message);
      }
      fs.unlinkSync(rawFile.path);
    }

    const photoId = Math.random().toString(36).substring(2, 11) + Date.now().toString().slice(-4);

    // Save in Photo collection
    await Photo.create({
      userId: req.user._id.toString(),
      entryId: submission._id.toString(),
      title: title || 'Untitled',
      category: category || 'General',
      description: description || '',
      originalFilename: photoFile.originalname,
      cloudinaryPublicId: cloudinaryResult.public_id,
      secureUrl: cloudinaryResult.secure_url,
      width: width || cloudinaryResult.width,
      height: height || cloudinaryResult.height,
      format: format || cloudinaryResult.format,
      fileSize: photoFile.size,
      cameraMake,
      cameraModel,
      lensModel,
      originalCaptureDate,
      exifData: exif,
      dslrValidationStatus: dslrCheck.status,
      validationReason: dslrCheck.reason,
      uploadTimestamp: new Date(),
      deletionStatus: false
    });

    const newPhoto = {
      id: photoId,
      title: title || 'Untitled',
      category: category || 'General',
      cameraBrand: cameraMake,
      cameraModel,
      lensUsed: lensModel,
      location: location || '',
      dateCaptured: originalCaptureDate ? originalCaptureDate.toISOString() : '',
      description: description || '',
      fileUrl: cloudinaryResult.secure_url,
      rawFileUrl,
      fileHash,
      fileSizeBytes: photoFile.size,
      status: 'Pending',
      scores: [],
      assignedJudges: [],
      cloudinaryPublicId: cloudinaryResult.public_id,
      width: width || cloudinaryResult.width,
      height: height || cloudinaryResult.height,
      format: format || cloudinaryResult.format,
      dslrValidationStatus: dslrCheck.status,
      validationReason: dslrCheck.reason,
      originalFilename: photoFile.originalname,
      uploadTimestamp: new Date(),
      deletionStatus: false
    };

    submission.photographs.push(newPhoto);
    submission.activePhotosCount = submission.photographs.length;
    await submission.save();

    await AuditLog.create({
      userId: req.user._id.toString(),
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Upload Photograph',
      details: `Uploaded photo: "${newPhoto.title}" (EXIF: ${dslrCheck.status})`,
      ipAddress: req.ip
    });

    res.json({ success: true, submission, newPhoto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during upload: ' + error.message });
  }
});

// @desc    Delete a photograph from submission
// @route   DELETE /api/submissions/photo/:eventId/:photoId
// @access  Private
router.delete('/photo/:eventId/:photoId', protect, async (req, res) => {
  try {
    const { eventId, photoId } = req.params;
    
    const event = await Event.findById(eventId);
    if (event && event.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'This contest has been completed. Submissions cannot be modified or deleted.' });
    }

    const submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });

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

    // Soft-delete in Photo collection & delete from Cloudinary
    const photoDoc = await Photo.findOne({
      userId: req.user._id.toString(),
      entryId: submission._id.toString(),
      cloudinaryPublicId: photo.cloudinaryPublicId
    });

    if (photoDoc) {
      try {
        await cloudinary.uploader.destroy(photoDoc.cloudinaryPublicId);
      } catch (cldErr) {
        console.error('Cloudinary destroy error:', cldErr.message);
      }
      photoDoc.deletionStatus = true;
      photoDoc.deletionTimestamp = new Date();
      await photoDoc.save();
    }

    submission.photographs.splice(photoIndex, 1);
    submission.activePhotosCount = submission.photographs.length;
    await submission.save();

    await AuditLog.create({
      userId: req.user._id.toString(),
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Delete Photograph',
      details: `Removed photo ID: ${photoId} from entry number: ${submission.entryNumber}`,
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

    const submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });
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

    const submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });
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
    if (submission.paymentStatus !== 'Paid') {
      return res.status(400).json({ success: false, message: 'No valid payment found. Entry is valid only after payment.' });
    }

    submission.isFinalSubmitted = true;
    submission.entryStatus = 'Finalized';
    submission.submissionDate = new Date();
    await submission.save();

    await AuditLog.create({
      userId: req.user._id.toString(),
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Final Submit Contest Entry',
      details: `Submission finalized with ${submission.photographs.length} photographs. Entry Number: ${submission.entryNumber}`,
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
    const completedEvents = await Event.find({ status: 'Completed' });
    const completedEventIds = completedEvents.map(e => e._id.toString());

    const submissions = await Submission.find({
      isFinalSubmitted: true,
      $or: [
        { paymentStatus: 'Paid' },
        { eventId: { $in: completedEventIds } }
      ]
    });
    const approvedPhotos = [];

    submissions.forEach(sub => {
      sub.photographs.forEach(photo => {
        if (photo.status !== 'Rejected') {
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

// @route   POST /api/submissions/payment-failed
// @desc    Clean up uploaded photos for a failed/cancelled payment session
// @access  Private
router.post('/payment-failed', protect, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Only clean up if the entry is unpaid!
    if (submission.paymentStatus !== 'Paid') {
      if (submission.photographs && submission.photographs.length > 0) {
        for (const photo of submission.photographs) {
          if (photo.cloudinaryPublicId) {
            try {
              await cloudinary.uploader.destroy(photo.cloudinaryPublicId);
            } catch (err) {
              console.error(`Failed to destroy Cloudinary asset: ${photo.cloudinaryPublicId}`, err);
            }
          }
        }
        submission.photographs = [];
        submission.activePhotosCount = 0;
        await submission.save();
      }
    }

    res.json({
      success: true,
      message: 'Unpaid uploaded photos automatically cleaned up successfully',
      submission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update photograph metadata details
// @route   PUT /api/submissions/photographs/:photoId
// @access  Private
router.put('/photographs/:photoId', protect, async (req, res) => {
  try {
    const { eventId, title, category, cameraBrand, cameraModel, lensUsed, location, dateCaptured, description } = req.body;
    const { photoId } = req.params;

    const submission = await Submission.findOne({ userId: req.user._id.toString(), eventId });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.isFinalSubmitted) {
      return res.status(400).json({ success: false, message: 'Entry has already been finalized' });
    }

    const idx = submission.photographs.findIndex(p => p.id === photoId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Photograph not found in submission' });
    }

    // Update the values in the subdocument
    submission.photographs[idx].title = title || submission.photographs[idx].title;
    submission.photographs[idx].category = category || submission.photographs[idx].category;
    submission.photographs[idx].cameraBrand = cameraBrand !== undefined ? cameraBrand : submission.photographs[idx].cameraBrand;
    submission.photographs[idx].cameraModel = cameraModel !== undefined ? cameraModel : submission.photographs[idx].cameraModel;
    submission.photographs[idx].lensUsed = lensUsed !== undefined ? lensUsed : submission.photographs[idx].lensUsed;
    submission.photographs[idx].location = location !== undefined ? location : submission.photographs[idx].location;
    submission.photographs[idx].dateCaptured = dateCaptured !== undefined ? dateCaptured : submission.photographs[idx].dateCaptured;
    submission.photographs[idx].description = description !== undefined ? description : submission.photographs[idx].description;

    await submission.save();

    // Also update the Photo collection (if it exists)
    const Photo = require('../models/Photo');
    const photoDoc = await Photo.findOne({ 
      entryId: submission._id.toString(), 
      userId: req.user._id.toString(), 
      $or: [
        { id: photoId }, 
        { cloudinaryPublicId: submission.photographs[idx].cloudinaryPublicId }
      ] 
    });
    if (photoDoc) {
      photoDoc.title = title || photoDoc.title;
      photoDoc.category = category || photoDoc.category;
      photoDoc.description = description !== undefined ? description : photoDoc.description;
      photoDoc.cameraMake = cameraBrand !== undefined ? cameraBrand : photoDoc.cameraMake;
      photoDoc.cameraModel = cameraModel !== undefined ? cameraModel : photoDoc.cameraModel;
      photoDoc.lensModel = lensUsed !== undefined ? lensUsed : photoDoc.lensModel;
      if (dateCaptured) {
        photoDoc.originalCaptureDate = new Date(dateCaptured);
      }
      await photoDoc.save();
    }

    await AuditLog.create({
      userId: req.user._id.toString(),
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Update Photograph Metadata',
      details: `Updated photo ID: ${photoId} details in entry number: ${submission.entryNumber}`,
      ipAddress: req.ip
    });

    res.json({ success: true, submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
