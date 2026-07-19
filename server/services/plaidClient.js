// ─── MOCK DATA GENERATOR ─────────────────────────────────────
// Since real Indian Banking APIs require business entity registration,
// this module provides realistic mock data and endpoints for the UI.

const MOCK_BANKS = [
  { institution_id: 'ins_mock_hdfc', name: 'HDFC Bank', logo: null, color: '#004B95' },
  { institution_id: 'ins_mock_sbi', name: 'State Bank of India', logo: null, color: '#1F2F6F' },
  { institution_id: 'ins_mock_icici', name: 'ICICI Bank', logo: null, color: '#B02A30' },
  { institution_id: 'ins_mock_axis', name: 'Axis Bank', logo: null, color: '#97144D' },
  { institution_id: 'ins_mock_kotak', name: 'Kotak Mahindra', logo: null, color: '#ED1C24' },
];

// Generate realistic Indian transaction data in INR
function generateMockTransactions(count = 25) {
  const transactions = [];
  const vendors = [
    { name: 'Swiggy', category: 'Dining Out', minAmount: 150, maxAmount: 800 },
    { name: 'Zomato', category: 'Dining Out', minAmount: 200, maxAmount: 1200 },
    { name: 'BigBasket', category: 'Groceries', minAmount: 300, maxAmount: 2500 },
    { name: 'Amazon India', category: 'Shopping', minAmount: 500, maxAmount: 15000 },
    { name: 'Flipkart', category: 'Shopping', minAmount: 400, maxAmount: 12000 },
    { name: 'Myntra', category: 'Clothing & Fashion', minAmount: 800, maxAmount: 5000 },
    { name: 'Ola', category: 'Ride Sharing', minAmount: 100, maxAmount: 600 },
    { name: 'Uber India', category: 'Ride Sharing', minAmount: 120, maxAmount: 700 },
    { name: 'Airtel', category: 'Internet & Phone', minAmount: 399, maxAmount: 999 },
    { name: 'Jio Recharge', category: 'Internet & Phone', minAmount: 239, maxAmount: 999 },
    { name: 'Netflix India', category: 'Subscriptions', minAmount: 199, maxAmount: 649 },
    { name: 'Spotify India', category: 'Subscriptions', minAmount: 119, maxAmount: 179 },
    { name: 'Indian Oil Petrol Pump', category: 'Fuel & Gas', minAmount: 500, maxAmount: 3000 },
    { name: 'HP Petrol Pump', category: 'Fuel & Gas', minAmount: 500, maxAmount: 2500 },
    { name: 'Apollo Pharmacy', category: 'Health & Medical', minAmount: 100, maxAmount: 2000 },
    { name: 'DMart', category: 'Groceries', minAmount: 500, maxAmount: 5000 },
    { name: 'Reliance Fresh', category: 'Groceries', minAmount: 200, maxAmount: 3000 },
    { name: 'Starbucks India', category: 'Coffee & Drinks', minAmount: 250, maxAmount: 800 },
    { name: 'PVR Cinemas', category: 'Movies & Events', minAmount: 200, maxAmount: 1200 },
    { name: 'BookMyShow', category: 'Movies & Events', minAmount: 150, maxAmount: 2000 },
    { name: 'Electricity Bill - MSEDCL', category: 'Bills & Utilities', minAmount: 800, maxAmount: 3000 },
    { name: 'Water Bill', category: 'Bills & Utilities', minAmount: 200, maxAmount: 600 },
    { name: 'Cult.fit Membership', category: 'Gym & Fitness', minAmount: 799, maxAmount: 1499 },
    { name: 'Blinkit', category: 'Groceries', minAmount: 100, maxAmount: 1500 },
    { name: 'Zepto', category: 'Groceries', minAmount: 80, maxAmount: 800 },
    { name: 'IRCTC', category: 'Travel & Vacation', minAmount: 300, maxAmount: 5000 },
    { name: 'MakeMyTrip', category: 'Flights & Hotels', minAmount: 2000, maxAmount: 25000 },
    { name: 'Dominos Pizza', category: 'Dining Out', minAmount: 200, maxAmount: 1000 },
    { name: 'McDonald\'s India', category: 'Dining Out', minAmount: 150, maxAmount: 500 },
    { name: 'Croma Electronics', category: 'Electronics & Gadgets', minAmount: 1000, maxAmount: 30000 },
  ];

  const paymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'UPI', 'UPI', 'Bank Transfer'];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const amount = Math.round((Math.random() * (vendor.maxAmount - vendor.minAmount) + vendor.minAmount) * 100) / 100;
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    transactions.push({
      transaction_id: `mock_txn_${Date.now()}_${i}`,
      name: vendor.name,
      amount: amount,
      date: date.toISOString().split('T')[0],
      category: vendor.category,
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      pending: Math.random() < 0.1,
    });
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = {
  IS_MOCK: true, // Force mock mode for the backend
  MOCK_BANKS,
  generateMockTransactions,
};
