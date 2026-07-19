const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const {
  MOCK_BANKS,
  generateMockTransactions,
} = require('../services/plaidClient');
const { categorizeExpense } = require('../services/gemini');

// ─── POST /set_access_token ──────────────────────────────────────────────
// In mock mode, this just receives the chosen bank from the frontend and saves it.
router.post('/set_access_token', protect, async (req, res) => {
  try {
    const { institution_id, name } = req.body;

    if (!institution_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Institution ID and name are required',
      });
    }

    // Check if this institution is already connected for this user
    const user = await User.findById(req.user._id);
    const alreadyConnected = user.connectedBanks.some(
      (bank) => bank.institutionId === institution_id
    );

    if (alreadyConnected) {
      return res.status(400).json({
        success: false,
        message: `${name} is already connected`,
      });
    }

    // Save the connected bank to the user's profile
    user.connectedBanks.push({
      institutionId: institution_id,
      institutionName: name,
      accessToken: `mock-access-token-${Date.now()}`,
      itemId: `mock-item-${Date.now()}`,
      lastSynced: null,
      accountType: 'savings',
      isMock: true,
      connectedAt: new Date(),
    });

    await user.save();

    const addedBank = user.connectedBanks[user.connectedBanks.length - 1];

    return res.json({
      success: true,
      message: `${name} connected successfully`,
      bank: {
        _id: addedBank._id,
        institutionId: addedBank.institutionId,
        institutionName: addedBank.institutionName,
        accountType: addedBank.accountType,
        isMock: true,
        connectedAt: addedBank.connectedAt,
      },
    });
  } catch (error) {
    console.error('Error setting access token:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect bank account',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
});

// ─── POST /sync_transactions ─────────────────────────────────────────────
// Generates mock transactions and saves them as Expense documents.
router.post('/sync_transactions', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.connectedBanks || user.connectedBanks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No bank accounts connected. Please connect a bank first.',
      });
    }

    let allTransactions = [];

    for (const bank of user.connectedBanks) {
      // Generate realistic Indian transactions
      const transactions = generateMockTransactions(30);

      // Tag each transaction with its source bank
      transactions.forEach((txn) => {
        txn._bankId = bank._id;
        txn._bankName = bank.institutionName;
      });

      allTransactions = allTransactions.concat(transactions);
      
      // Update sync time
      bank.lastSynced = new Date();
    }
    
    await user.save();

    if (allTransactions.length === 0) {
      return res.json({
        success: true,
        message: 'No new transactions found',
        count: 0,
      });
    }

    // Convert transactions to Expense documents and bulk insert
    const expenseDocs = [];
    const validPaymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Wallet', 'Other'];

    for (const txn of allTransactions) {
      if (txn.pending) {
        continue;
      }

      // Check if transaction already exists
      const existingExpense = await Expense.findOne({ 
        user: req.user._id, 
        description: { $regex: new RegExp(txn.transaction_id, 'i') } 
      });
      
      if (existingExpense) continue;

      let aiCategory = null;
      let finalCategory = txn.category || 'Other';

      try {
        aiCategory = await categorizeExpense(txn.name, txn.amount);
        if (aiCategory) {
          finalCategory = aiCategory;
        }
      } catch (err) {
        console.error('Categorization error during sync:', err.message);
      }

      let paymentMethod = 'Bank Transfer';
      const pmMatch = validPaymentMethods.find(pm => pm.toLowerCase() === txn.payment_method.toLowerCase());
      if (pmMatch) paymentMethod = pmMatch;

      expenseDocs.push({
        user: req.user._id,
        amount: txn.amount,
        category: finalCategory,
        aiCategory: aiCategory,
        description: txn.name,
        date: new Date(txn.date),
        paymentMethod: paymentMethod,
        isRecurring: false,
        tags: ['Bank Sync', txn._bankName],
      });
    }

    if (expenseDocs.length > 0) {
      await Expense.insertMany(expenseDocs);
    }

    return res.json({
      success: true,
      message: `Successfully synced ${expenseDocs.length} new transactions`,
      count: expenseDocs.length,
    });
  } catch (error) {
    console.error('Error syncing transactions:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync transactions',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
});

// ─── GET /connected_banks ──────────────────────────────────────────────
router.get('/connected_banks', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const banks = user.connectedBanks.map((bank) => ({
      _id: bank._id,
      institutionId: bank.institutionId,
      institutionName: bank.institutionName,
      accountType: bank.accountType,
      isMock: bank.isMock,
      lastSynced: bank.lastSynced,
      connectedAt: bank.connectedAt,
    }));

    return res.json({
      success: true,
      banks,
    });
  } catch (error) {
    console.error('Error fetching banks:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching banks' });
  }
});

// ─── DELETE /disconnect/:id ──────────────────────────────────────────────
router.delete('/disconnect/:id', protect, async (req, res) => {
  try {
    const bankId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const initialLength = user.connectedBanks.length;
    user.connectedBanks = user.connectedBanks.filter(
      (b) => b._id.toString() !== bankId
    );

    if (user.connectedBanks.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }

    await user.save();
    return res.json({ success: true, message: 'Bank disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting bank:', error.message);
    res.status(500).json({ success: false, message: 'Server error disconnecting bank' });
  }
});

module.exports = router;
