const express = require('express');
const Expense = require('../models/Expense');
const SavingsGoal = require('../models/SavingsGoal');
const { protect } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const {
  chatWithData,
  categorizeExpense,
  generateMonthlyReport,
  scanReceipt,
} = require('../services/gemini');

const router = express.Router();

// All AI routes are protected and rate-limited
router.use(protect);
router.use(aiRateLimiter);

// @route   POST /api/ai/chat
// @desc    Chat with AI about expense data
// @access  Private + Rate Limited
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message',
      });
    }

    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Fetch user's expense summary from DB in parallel
    const [
      totalSpentResult,
      monthlySpentResult,
      categoryBreakdown,
      monthlyTrend,
      recentTransactions,
    ] = await Promise.all([
      // Total spent all time
      Expense.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Current month spending
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Category breakdown
      Expense.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        {
          $project: {
            _id: 0,
            category: '$_id',
            total: { $round: ['$total', 2] },
            count: 1,
          },
        },
      ]),

      // Monthly trend (last 6 months)
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            month: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: {
                    if: { $lt: ['$_id.month', 10] },
                    then: { $concat: ['0', { $toString: '$_id.month' }] },
                    else: { $toString: '$_id.month' },
                  },
                },
              ],
            },
            total: { $round: ['$total', 2] },
          },
        },
      ]),

      // Recent 10 transactions
      Expense.find({ user: userId })
        .sort('-date')
        .limit(10)
        .select('description amount category date')
        .lean(),
    ]);

    const expenseData = {
      totalSpent: totalSpentResult.length > 0 ? totalSpentResult[0].total : 0,
      monthlySpent:
        monthlySpentResult.length > 0 ? monthlySpentResult[0].total : 0,
      categoryBreakdown,
      monthlyTrend,
      recentTransactions,
    };

    const response = await chatWithData(message, expenseData);

    res.json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing your AI chat request',
    });
  }
});

// @route   POST /api/ai/categorize
// @desc    AI categorize an expense
// @access  Private + Rate Limited
router.post('/categorize', async (req, res) => {
  try {
    const { description, amount } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a description to categorize',
      });
    }

    const category = await categorizeExpense(description, amount || 0);

    res.json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    console.error('AI categorize error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error categorizing expense',
    });
  }
});

// @route   GET /api/ai/report/:year/:month
// @desc    Generate AI monthly financial report
// @access  Private + Rate Limited
router.get('/report/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    // Validate year and month
    if (
      isNaN(year) ||
      isNaN(month) ||
      month < 1 ||
      month > 12 ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid year and month (e.g., /2025/6)',
      });
    }

    const userId = req.user._id;

    // Target month boundaries
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Previous month boundaries
    const startOfPrevMonth = new Date(year, month - 2, 1);
    const endOfPrevMonth = new Date(year, month - 1, 0, 23, 59, 59, 999);

    // Fetch all data in parallel
    const [
      monthExpenses,
      prevMonthTotalResult,
      categoryBreakdown,
      topExpenses,
      savingsGoals,
    ] = await Promise.all([
      // All expenses for the target month
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Previous month total for comparison
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Category breakdown for target month
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        {
          $project: {
            _id: 0,
            category: '$_id',
            total: { $round: ['$total', 2] },
            count: 1,
          },
        },
      ]),

      // Top 5 expenses for target month
      Expense.find({
        user: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      })
        .sort('-amount')
        .limit(5)
        .select('description amount category date')
        .lean(),

      // User's savings goals
      SavingsGoal.find({ user: userId }).lean(),
    ]);

    const totalSpent =
      monthExpenses.length > 0 ? monthExpenses[0].total : 0;
    const comparisonToPrevMonth =
      prevMonthTotalResult.length > 0 ? prevMonthTotalResult[0].total : 0;

    // Build savings progress summary
    const savingsProgress =
      savingsGoals.length > 0
        ? {
            totalGoals: savingsGoals.length,
            target: savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0),
            current: savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0),
            completed: savingsGoals.filter(
              (g) => g.currentAmount >= g.targetAmount
            ).length,
          }
        : null;

    const monthlyData = {
      totalSpent,
      comparisonToPrevMonth,
      categoryBreakdown,
      topExpenses,
      savingsProgress,
      transactionCount: monthExpenses.length > 0 ? monthExpenses[0].count : 0,
    };

    const report = await generateMonthlyReport(monthlyData);

    res.json({
      success: true,
      data: {
        year,
        month,
        report,
        raw: monthlyData,
      },
    });
  } catch (error) {
    console.error('AI report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating monthly report',
    });
  }
});

// @route   POST /api/ai/scan-receipt
// @desc    Scan a receipt image using Gemini Vision AI
// @access  Private + Rate Limited
router.post('/scan-receipt', async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a base64 encoded image',
      });
    }

    const result = await scanReceipt(image, mimeType || 'image/jpeg');

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Receipt scan error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error scanning receipt',
    });
  }
});

module.exports = router;
