const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Coffee & Drinks',
  'Transport',
  'Fuel & Gas',
  'Ride Sharing',
  'Public Transit',
  'Shopping',
  'Clothing & Fashion',
  'Electronics & Gadgets',
  'Home & Furniture',
  'Rent & Housing',
  'Bills & Utilities',
  'Subscriptions',
  'Internet & Phone',
  'Insurance',
  'Entertainment',
  'Movies & Events',
  'Gaming',
  'Health & Medical',
  'Gym & Fitness',
  'Personal Care',
  'Education',
  'Books & Courses',
  'Travel & Vacation',
  'Flights & Hotels',
  'Pet Care',
  'Gifts & Donations',
  'Investments',
  'EMI & Loans',
  'Taxes',
  'Childcare',
  'Office & Work',
  'Food',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Expense must belong to a user'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    category: {
      type: String,
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
      default: 'Other',
    },
    aiCategory: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    // New fields
    entryMethod: {
      type: String,
      enum: ['Manual', 'Receipt', 'Bill'],
      default: 'Manual',
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Wallet', 'Other'],
      default: 'Other',
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative'],
    },
    tipAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tip amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Overdue'],
      default: 'Paid',
    },
    billDueDate: {
      type: Date,
      default: null,
    },
    receiptImage: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries by user and date
expenseSchema.index({ user: 1, date: -1 });

// Additional useful indexes
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, createdAt: -1 });
expenseSchema.index({ user: 1, status: 1 });

// Static method to expose categories
expenseSchema.statics.getCategories = function () {
  return EXPENSE_CATEGORIES;
};

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
