const express = require('express');
const SavingsGoal = require('../models/SavingsGoal');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/goals
// @desc    Get all savings goals for the current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user.id }).sort(
      '-createdAt'
    );

    res.json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    console.error('Get goals error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching savings goals',
    });
  }
});

// @route   POST /api/goals
// @desc    Create a new savings goal
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, deadline, color, icon } =
      req.body;

    // Validate required fields
    if (!name || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a goal name and target amount',
      });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be greater than zero',
      });
    }

    const goal = await SavingsGoal.create({
      user: req.user.id,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: deadline || null,
      color: color || '#10b981',
      icon: icon || '🎯',
    });

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('Create goal error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating savings goal',
    });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update a savings goal (verify ownership)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
      });
    }

    // Verify ownership
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this goal',
      });
    }

    // Only allow updating specific fields
    const allowedUpdates = [
      'name',
      'targetAmount',
      'currentAmount',
      'deadline',
      'color',
      'icon',
    ];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    goal = await SavingsGoal.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('Update goal error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID',
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating savings goal',
    });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a savings goal (verify ownership)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
      });
    }

    // Verify ownership
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this goal',
      });
    }

    await SavingsGoal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Savings goal deleted successfully',
    });
  } catch (error) {
    console.error('Delete goal error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting savings goal',
    });
  }
});

// @route   PUT /api/goals/:id/contribute
// @desc    Add a contribution to a savings goal
// @access  Private
router.put('/:id/contribute', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a positive contribution amount',
      });
    }

    let goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
      });
    }

    // Verify ownership
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to contribute to this goal',
      });
    }

    // Add contribution (don't exceed target)
    const newAmount = goal.currentAmount + amount;

    goal = await SavingsGoal.findByIdAndUpdate(
      req.params.id,
      { $set: { currentAmount: newAmount } },
      { new: true, runValidators: true }
    );

    const isCompleted = goal.currentAmount >= goal.targetAmount;

    res.json({
      success: true,
      data: goal,
      message: isCompleted
        ? `🎉 Congratulations! You've reached your savings goal "${goal.name}"!`
        : `Added $${amount.toFixed(2)} to "${goal.name}". ${(
            goal.targetAmount - goal.currentAmount
          ).toFixed(2)} remaining.`,
    });
  } catch (error) {
    console.error('Contribute to goal error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error contributing to savings goal',
    });
  }
});

module.exports = router;
