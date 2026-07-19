const express = require('express');
const Expense = require('../models/Expense');
const SavingsGoal = require('../models/SavingsGoal');
const { protect } = require('../middleware/auth');
const notificationRoutes = require('./notifications');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/expenses/export
// @desc    Export user expenses as CSV with optional date range
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) { const e = new Date(req.query.endDate); e.setHours(23,59,59,999); filter.date.$lte = e; }
    }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Entry Method', 'Payment Method', 'Vendor', 'Tax', 'Status'];
    const rows = expenses.map(exp => {
      const date = new Date(exp.date).toLocaleDateString('en-IN');
      const desc = `"${(exp.description || '').replace(/"/g, '""')}"`;
      return [date, desc, exp.category||'', exp.amount||0, exp.currency||'INR', exp.entryMethod||'', exp.paymentMethod||'', `"${(exp.vendor||'').replace(/"/g,'""')}"`, exp.taxAmount||0, exp.status||'Paid'].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses_export.csv');
    res.send(csvContent);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, message: 'Server error exporting expenses' });
  }
});

// @route   GET /api/expenses/export-pdf
// @desc    Export user expenses as a formatted PDF report
// @access  Private
router.get('/export-pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const filter = { user: req.user.id };
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) { const e = new Date(req.query.endDate); e.setHours(23,59,59,999); filter.date.$lte = e; }
    }
    
    const expenses = await Expense.find(filter).sort({ date: -1 });
    
    // Aggregate stats
    const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalTax = expenses.reduce((s, e) => s + (e.taxAmount || 0), 0);
    const categoryMap = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
      categoryMap[cat].total += e.amount || 0;
      categoryMap[cat].count++;
    });
    const categories = Object.entries(categoryMap).sort((a, b) => b[1].total - a[1].total);

    const dateLabel = req.query.startDate && req.query.endDate
      ? `${new Date(req.query.startDate).toLocaleDateString('en-IN')} — ${new Date(req.query.endDate).toLocaleDateString('en-IN')}`
      : 'All Time';

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=expense_report_${Date.now()}.pdf`);
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(22).font('Helvetica-Bold').text('AI Expense Tracker', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica').fillColor('#666666').text('Expense Report', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).text(`Period: ${dateLabel}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, { align: 'center' });
    doc.moveDown(1);

    // ── Divider ──
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    // ── Summary Box ──
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Summary');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text(`Total Transactions: ${expenses.length}`);
    doc.text(`Total Spent: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    doc.text(`Total Tax (GST): ₹${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    doc.text(`Average per Transaction: ₹${expenses.length > 0 ? (totalAmount / expenses.length).toFixed(2) : '0.00'}`);
    doc.moveDown(1);

    // ── Category Breakdown ──
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Category Breakdown');
    doc.moveDown(0.5);
    categories.forEach(([cat, data]) => {
      const pct = totalAmount > 0 ? ((data.total / totalAmount) * 100).toFixed(1) : 0;
      doc.fontSize(10).font('Helvetica').fillColor('#333333')
        .text(`${cat}: ₹${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${data.count} txns, ${pct}%)`);
    });
    doc.moveDown(1);

    // ── Transaction Table ──
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Transaction Details');
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    const colX = { date: 50, desc: 120, category: 280, amount: 400, method: 470 };
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#555555');
    doc.text('Date', colX.date, tableTop);
    doc.text('Description', colX.desc, tableTop);
    doc.text('Category', colX.category, tableTop);
    doc.text('Amount', colX.amount, tableTop);
    doc.text('Method', colX.method, tableTop);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');

    // Table Rows
    doc.font('Helvetica').fontSize(8).fillColor('#333333');
    let rowY = doc.y + 5;

    expenses.forEach((exp, i) => {
      if (rowY > 750) {
        doc.addPage();
        rowY = 50;
      }
      const bg = i % 2 === 0 ? '#f9f9f9' : '#ffffff';
      doc.rect(48, rowY - 2, 499, 14).fill(bg);
      doc.fillColor('#333333');
      doc.text(new Date(exp.date).toLocaleDateString('en-IN'), colX.date, rowY, { width: 65 });
      doc.text((exp.description || '').substring(0, 28), colX.desc, rowY, { width: 155 });
      doc.text((exp.category || 'Other').substring(0, 20), colX.category, rowY, { width: 115 });
      doc.text(`₹${(exp.amount || 0).toLocaleString('en-IN')}`, colX.amount, rowY, { width: 65 });
      doc.text(exp.paymentMethod || '-', colX.method, rowY, { width: 75 });
      rowY += 16;
    });

    // ── Footer ──
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999999').text('This report was generated by AI Expense Tracker. All amounts are in INR.', 50, doc.y, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF Export error:', err);
    res.status(500).json({ success: false, message: 'Server error generating PDF' });
  }
});

// @route   DELETE /api/expenses/all
// @desc    Reset data by deleting all user's expenses
// @access  Private
router.delete('/all', async (req, res) => {
  try {
    const result = await Expense.deleteMany({ user: req.user.id });
    res.json({ success: true, message: `Successfully deleted ${result.deletedCount} expenses.` });
  } catch (err) {
    console.error('Reset expenses error:', err);
    res.status(500).json({ success: false, message: 'Server error resetting expenses' });
  }
});

// @route   GET /api/expenses/subscriptions
// @desc    Detect recurring/subscription expenses and predict upcoming bills
// @access  Private
router.get('/subscriptions', async (req, res) => {
  try {
    const userId = req.user._id;
    const expenses = await Expense.find({ user: userId }).sort({ date: -1 }).lean();

    if (expenses.length === 0) {
      return res.json({ success: true, data: { subscriptions: [], totalMonthly: 0, totalYearly: 0, upcoming: [] } });
    }

    // Group by description (vendor name) to find repeats
    const vendorMap = {};
    expenses.forEach(exp => {
      const key = (exp.description || '').toLowerCase().trim();
      if (!key) return;
      if (!vendorMap[key]) vendorMap[key] = [];
      vendorMap[key].push(exp);
    });

    const subscriptions = [];
    const now = new Date();

    Object.entries(vendorMap).forEach(([key, txns]) => {
      if (txns.length < 2) return; // Need at least 2 occurrences to be "recurring"

      // Sort by date
      txns.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate average interval in days
      let totalIntervalDays = 0;
      for (let i = 1; i < txns.length; i++) {
        const diff = (new Date(txns[i].date) - new Date(txns[i - 1].date)) / (1000 * 60 * 60 * 24);
        totalIntervalDays += diff;
      }
      const avgInterval = totalIntervalDays / (txns.length - 1);

      // Determine frequency
      let frequency = 'unknown';
      if (avgInterval <= 8) frequency = 'weekly';
      else if (avgInterval <= 20) frequency = 'biweekly';
      else if (avgInterval <= 45) frequency = 'monthly';
      else if (avgInterval <= 100) frequency = 'quarterly';
      else if (avgInterval <= 200) frequency = 'semi-annual';
      else if (avgInterval <= 400) frequency = 'yearly';
      else return; // Too irregular to be a subscription

      // Calculate average amount
      const avgAmount = txns.reduce((s, t) => s + t.amount, 0) / txns.length;
      const lastTxn = txns[txns.length - 1];
      const lastDate = new Date(lastTxn.date);

      // Predict next due date
      const nextDue = new Date(lastDate);
      nextDue.setDate(nextDue.getDate() + Math.round(avgInterval));

      // Calculate monthly cost
      let monthlyCost = avgAmount;
      if (frequency === 'weekly') monthlyCost = avgAmount * 4.33;
      else if (frequency === 'biweekly') monthlyCost = avgAmount * 2.17;
      else if (frequency === 'quarterly') monthlyCost = avgAmount / 3;
      else if (frequency === 'semi-annual') monthlyCost = avgAmount / 6;
      else if (frequency === 'yearly') monthlyCost = avgAmount / 12;

      // Determine status
      const daysSinceLastPayment = (now - lastDate) / (1000 * 60 * 60 * 24);
      let status = 'active';
      if (daysSinceLastPayment > avgInterval * 2) status = 'possibly_cancelled';
      else if (nextDue < now) status = 'overdue';

      subscriptions.push({
        name: lastTxn.description || key,
        category: lastTxn.category || 'Other',
        frequency,
        avgAmount: Math.round(avgAmount * 100) / 100,
        monthlyCost: Math.round(monthlyCost * 100) / 100,
        occurrences: txns.length,
        lastPaid: lastDate.toISOString(),
        nextDue: nextDue.toISOString(),
        status,
        paymentMethod: lastTxn.paymentMethod || 'Other',
      });
    });

    // Sort by monthly cost descending
    subscriptions.sort((a, b) => b.monthlyCost - a.monthlyCost);

    const totalMonthly = subscriptions.reduce((s, sub) => s + sub.monthlyCost, 0);
    const totalYearly = totalMonthly * 12;

    // Upcoming bills (next 30 days)
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcoming = subscriptions
      .filter(s => {
        const next = new Date(s.nextDue);
        return next >= now && next <= thirtyDaysFromNow && s.status !== 'possibly_cancelled';
      })
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));

    res.json({
      success: true,
      data: {
        subscriptions,
        totalMonthly: Math.round(totalMonthly * 100) / 100,
        totalYearly: Math.round(totalYearly * 100) / 100,
        upcoming,
      },
    });
  } catch (err) {
    console.error('Subscriptions detection error:', err);
    res.status(500).json({ success: false, message: 'Server error detecting subscriptions' });
  }
});

// @route   GET /api/expenses
// @desc    Get user's expenses with filters, search, sort, pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      search,
      sort = '-date',
      limit = 20,
      page = 1,
    } = req.query;

    // Build filter query
    const filter = { user: req.user.id };

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end of day for endDate to be inclusive
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Search by description (case-insensitive partial match)
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build sort string (e.g., '-date', 'amount', '-amount')
    const sortStr = sort || '-date';

    // Execute query with pagination
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort(sortStr).skip(skip).limit(limitNum).lean(),
      Expense.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching expenses',
    });
  }
});

// @route   GET /api/expenses/stats
// @desc    Get aggregate spending statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const timeRange = req.query.timeRange || '6months';

    let startDate;
    let groupByFormat = '%Y-%m'; // Default group by month

    switch (timeRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupByFormat = '%Y-%m-%d'; // Group by day
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupByFormat = '%Y-%m-%d'; // Group by day
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      case '6months':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
    }

    // Current month boundaries for the "This Month" card
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // For daily spending explicitly
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Run all aggregations in parallel
    const [
      totalSpentResult,
      monthlySpentResult,
      categoryBreakdown,
      monthlyTrend,
      dailySpending,
      categoryMonthlyTrend,
      savingsProgressResult,
    ] = await Promise.all([
      // Total spent (all time)
      Expense.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Monthly spent (current month)
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Category breakdown (filtered by timeRange)
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startDate } } },
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

      // Trend chart (filtered by timeRange)
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupByFormat, date: '$date' },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id': 1 } },
        {
          $project: {
            _id: 0,
            month: '$_id',
            total: { $round: ['$total', 2] },
          },
        },
      ]),

      // Daily spending (last 30 days)
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            total: { $round: ['$total', 2] },
          },
        },
      ]),

      // Category Monthly trend (last 6 months)
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
              category: '$category',
            },
            total: { $sum: '$amount' },
          },
        },
      ]),

      // Savings Progress
      SavingsGoal.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalTarget: { $sum: '$targetAmount' },
            totalCurrent: { $sum: '$currentAmount' },
          },
        },
      ]),
    ]);

    // Format categoryMonthlyTrend
    const formattedCategoryTrend = categoryMonthlyTrend.map(item => ({
      year: item._id.year,
      month: item._id.month,
      category: item._id.category,
      total: item.total
    }));

    // Determine top category
    const topCategory =
      categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'N/A';

    // Calculate savings progress percentage
    const savingsResult = savingsProgressResult[0];
    const savingsProgress =
      savingsResult && savingsResult.totalTarget > 0
        ? Math.round((savingsResult.totalCurrent / savingsResult.totalTarget) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        totalSpent:
          totalSpentResult.length > 0
            ? Math.round(totalSpentResult[0].total * 100) / 100
            : 0,
        monthlySpent:
          monthlySpentResult.length > 0
            ? Math.round(monthlySpentResult[0].total * 100) / 100
            : 0,
        categoryBreakdown,
        monthlyTrend,
        dailySpending,
        categoryMonthlyTrend: formattedCategoryTrend,
        topCategory,
        savingsProgress,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
    });
  }
});

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { amount, currency, category, description, date, isRecurring, tags, aiCategory, entryMethod, vendor, paymentMethod, taxAmount, tipAmount, status, billDueDate, receiptImage } = req.body;

    // Validate required fields
    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amount and description',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }

    const expense = await Expense.create({
      user: req.user.id,
      amount,
      currency: currency || 'INR',
      category: category || 'Other',
      aiCategory: aiCategory || null,
      description,
      date: date || Date.now(),
      isRecurring: isRecurring || false,
      tags: tags || [],
      entryMethod: entryMethod || 'Manual',
      vendor: vendor || '',
      paymentMethod: paymentMethod || 'Other',
      taxAmount: taxAmount || 0,
      tipAmount: tipAmount || 0,
      status: status || 'Paid',
      billDueDate: billDueDate || null,
      receiptImage: receiptImage || null,
    });

    // Trigger notification for large expenses
    if (amount > 5000) {
      await notificationRoutes.triggerNotification(
        req.user.id,
        'Large Expense Alert',
        `You just recorded a large expense of ₹${amount} for ${category}.`,
        'alert'
      );
    }

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Create expense error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating expense',
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense (verify ownership)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Verify ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense',
      });
    }

    // Only allow updating specific fields
    const allowedUpdates = [
      'amount',
      'currency',
      'category',
      'aiCategory',
      'description',
      'date',
      'isRecurring',
      'tags',
      'entryMethod',
      'vendor',
      'paymentMethod',
      'taxAmount',
      'tipAmount',
      'status',
      'billDueDate',
      'receiptImage',
    ];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Update expense error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID',
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
      message: 'Server error updating expense',
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense (verify ownership)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Verify ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense',
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting expense',
    });
  }
});

module.exports = router;
