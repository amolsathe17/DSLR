const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { contestType } = req.query;
    let filter = {};
    if (contestType) {
      filter = { contestTypes: contestType };
    }
    const categories = await Category.find(filter);
    res.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, description, contestTypes } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ 
      name, 
      description,
      contestTypes: Array.isArray(contestTypes) ? contestTypes : ['Photography']
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Create Category',
      details: `Created category: ${category.name}`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, description, contestTypes } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name !== category.name) {
      const exists = await Category.findOne({ name });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Category with this name already exists' });
      }

      // Cascade update to submissions
      const Submission = require('../models/Submission');
      const oldName = category.name;
      category.name = name;

      await Submission.updateMany(
        { 'photographs.category': oldName },
        { $set: { 'photographs.$[elem].category': name } },
        { arrayFilters: [{ 'elem.category': oldName }] }
      );
    }

    if (description !== undefined) category.description = description;
    if (contestTypes !== undefined) {
      category.contestTypes = Array.isArray(contestTypes) ? contestTypes : [contestTypes];
    }

    await category.save();

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Update Category',
      details: `Updated category: ${category.name}`,
      ipAddress: req.ip
    });

    res.json({ success: true, category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const Submission = require('../models/Submission');
    const Event = require('../models/Event');

    // Find all submissions containing photographs of this category
    const submissions = await Submission.find({ 'photographs.category': category.name });
    const eventIds = submissions.map(s => s.eventId);
    
    // Check if any of these events are Completed
    const completedEvents = await Event.countDocuments({
      _id: { $in: eventIds },
      status: 'Completed'
    });

    if (completedEvents > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category as it has entry submissions in a Completed contest.' });
    }

    await Category.deleteOne({ _id: req.params.id });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'Delete Category',
      details: `Deleted category: ${category.name}`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
