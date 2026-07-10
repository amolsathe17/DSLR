const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all photographs assigned to the logged-in judge
// @route   GET /api/judges/assigned-photos/:eventId
// @access  Private/Judge
router.get('/assigned-photos/:eventId', protect, authorize('Judge'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const judgeId = req.user._id.toString();

    // Find submissions for this event where at least one photograph has the judge assigned
    const submissions = await Submission.find({
      eventId,
      isFinalSubmitted: true,
      'photographs.assignedJudges': judgeId
    });

    // Extract only the photographs assigned to this judge
    const assignedPhotos = [];
    submissions.forEach(sub => {
      sub.photographs.forEach(photo => {
        if (photo.assignedJudges.includes(judgeId)) {
          // Check if already graded
          const existingScore = photo.scores.find(s => s.judgeId === judgeId);
          assignedPhotos.push({
            submissionId: sub._id,
            participantName: sub.userName,
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
            fileSizeBytes: photo.fileSizeBytes,
            status: photo.status,
            graded: !!existingScore,
            score: existingScore || null
          });
        }
      });
    });

    res.json({ success: true, photographs: assignedPhotos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Submit scoring for a photograph
// @route   POST /api/judges/score
// @access  Private/Judge
router.post('/score', protect, authorize('Judge'), async (req, res) => {
  try {
    const { submissionId, photoId, creativity, composition, technicalQuality, storytelling, overallImpact, remarks } = req.body;
    const judgeId = req.user._id.toString();
    const judgeName = req.user.name;

    if (!submissionId || !photoId) {
      return res.status(400).json({ success: false, message: 'Submission ID and Photograph ID are required' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const photoIndex = submission.photographs.findIndex(p => p.id === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Photograph not found' });
    }

    const photo = submission.photographs[photoIndex];

    // Check if the judge is indeed assigned to this photograph
    if (!photo.assignedJudges.includes(judgeId)) {
      return res.status(403).json({ success: false, message: 'You are not assigned to score this photograph' });
    }

    const c = parseFloat(creativity) || 0;
    const co = parseFloat(composition) || 0;
    const t = parseFloat(technicalQuality) || 0;
    const s = parseFloat(storytelling) || 0;
    const o = parseFloat(overallImpact) || 0;

    if ([c, co, t, s, o].some(val => val < 1 || val > 10)) {
      return res.status(400).json({ success: false, message: 'All scores must be between 1 and 10' });
    }

    const totalScore = c + co + t + s + o;
    const averageScore = parseFloat((totalScore / 5).toFixed(2));

    const scoreData = {
      judgeId,
      judgeName,
      creativity: c,
      composition: co,
      technicalQuality: t,
      storytelling: s,
      overallImpact: o,
      totalScore,
      averageScore,
      remarks: remarks || '',
      gradedAt: new Date()
    };

    // Remove old score if exists and push new score
    const existingScoreIndex = photo.scores.findIndex(sc => sc.judgeId === judgeId);
    if (existingScoreIndex !== -1) {
      photo.scores[existingScoreIndex] = scoreData;
    } else {
      photo.scores.push(scoreData);
    }

    await submission.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Score Photograph',
      details: `Graded photo ID: ${photoId}. Avg Score: ${averageScore}.`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Scores submitted successfully!',
      photo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
