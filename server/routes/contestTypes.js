const express = require('express');
const router = express.Router();
const ContestType = require('../models/ContestType');
const AuditLog = require('../models/AuditLog');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all contest types
// @route   GET /api/contest-types
// @access  Public
router.get('/', async (req, res) => {
  try {
    const contestTypes = await ContestType.find({});
    res.json({ success: true, contestTypes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create a contest type
// @route   POST /api/contest-types
// @access  Private/Admin
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Contest type name is required' });
    }

    const exists = await ContestType.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Contest type already exists' });
    }

    const contestType = await ContestType.create({ name, description });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Create Contest Type',
      details: `Created contest type: ${contestType.name}`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, contestType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update a contest type
// @route   PUT /api/contest-types/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const contestType = await ContestType.findById(req.params.id);
    if (!contestType) {
      return res.status(404).json({ success: false, message: 'Contest type not found' });
    }

    if (name && name !== contestType.name) {
      const exists = await ContestType.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Contest type with this name already exists' });
      }

      // Check if any events are currently using this contest type name
      const eventCount = await Event.countDocuments({ eventType: contestType.name });
      if (eventCount > 0) {
        return res.status(400).json({ success: false, message: 'Cannot rename contest type as it is currently being used by contests.' });
      }

      // Update categories mapped to this contest type
      const Category = require('../models/Category');
      
      // Update element in array matching old contest type name
      await Category.updateMany(
        { contestTypes: contestType.name },
        { $set: { 'contestTypes.$': name } }
      );

      contestType.name = name;
    }

    if (description !== undefined) contestType.description = description;

    await contestType.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Update Contest Type',
      details: `Updated contest type: ${contestType.name}`,
      ipAddress: req.ip
    });

    res.json({ success: true, contestType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete a contest type
// @route   DELETE /api/contest-types/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const contestType = await ContestType.findById(req.params.id);
    if (!contestType) {
      return res.status(404).json({ success: false, message: 'Contest type not found' });
    }

    // Check if any events are using this contest type
    const eventCount = await Event.countDocuments({ eventType: contestType.name });
    if (eventCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete contest type as it is currently assigned to one or more contests.' });
    }

    await ContestType.deleteOne({ _id: req.params.id });

    // Remove this contest type from all categories
    const Category = require('../models/Category');
    await Category.updateMany(
      { contestTypes: contestType.name },
      { $pull: { contestTypes: contestType.name } }
    );

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Delete Contest Type',
      details: `Deleted contest type: ${contestType.name}`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Contest type deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
