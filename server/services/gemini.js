const { GoogleGenAI } = require('@google/genai');

const EXPENSE_CATEGORIES = [
  'Groceries', 'Dining Out', 'Coffee & Drinks', 'Transport', 'Fuel & Gas',
  'Ride Sharing', 'Public Transit', 'Shopping', 'Clothing & Fashion',
  'Electronics & Gadgets', 'Home & Furniture', 'Rent & Housing',
  'Bills & Utilities', 'Subscriptions', 'Internet & Phone', 'Insurance',
  'Entertainment', 'Movies & Events', 'Gaming', 'Health & Medical',
  'Gym & Fitness', 'Personal Care', 'Education', 'Books & Courses',
  'Travel & Vacation', 'Flights & Hotels', 'Pet Care', 'Gifts & Donations',
  'Investments', 'EMI & Loans', 'Taxes', 'Childcare', 'Office & Work',
  'Food', 'Other',
];

const MODEL = 'gemini-2.0-flash';

/**
 * Get Google GenAI client instance.
 * Returns null if GEMINI_API_KEY is not configured.
 */
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Categorize an expense into one of the predefined categories.
 * @param {string} description - The expense description
 * @param {number} amount - The expense amount
 * @returns {Promise<string>} The category string
 */
async function categorizeExpense(description, amount) {
  const ai = getClient();

  if (!ai) {
    return mockCategorize(description);
  }

  try {
    const prompt = `Categorize this expense: "${description}" for ₹${amount}`;
    
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are a financial categorization assistant. Your job is to categorize expenses into exactly one of these categories: ${EXPENSE_CATEGORIES.join(', ')}. Respond with ONLY the category name, nothing else. No explanation, no punctuation, just the category.`,
      }
    });

    const category = response.text.trim();

    // Validate the response is a valid category
    if (EXPENSE_CATEGORIES.includes(category)) {
      return category;
    }

    // Try to find a close match (case-insensitive)
    const match = EXPENSE_CATEGORIES.find(
      (c) => c.toLowerCase() === category.toLowerCase()
    );
    return match || 'Other';
  } catch (error) {
    console.error('Gemini categorization error:', error.message);
    return mockCategorize(description);
  }
}

/**
 * Chat with Gemini about the user's expense data.
 * @param {string} userMessage - The user's question
 * @param {object} expenseData - Summary of user's expense data
 * @returns {Promise<string>} Gemini's response
 */
async function chatWithData(userMessage, expenseData) {
  const ai = getClient();

  if (!ai) {
    return mockChatResponse(userMessage, expenseData);
  }

  try {
    const dataContext = formatExpenseDataForPrompt(expenseData);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: `You are a friendly and knowledgeable personal financial advisor AI assistant embedded in an expense tracking app. You have access to the user's financial data and should provide helpful, actionable insights.

When answering:
- Be conversational but concise
- Reference specific numbers from their data when relevant
- Provide practical tips and suggestions
- Use emojis sparingly for a friendly tone
- If asked about something not in the data, say so honestly
- Format responses with markdown for readability (bullet points, bold text, etc.)
- Never invent or fabricate data that isn't provided

Here is the user's current financial data:
${dataContext}`,
      }
    });

    return response.text;
  } catch (error) {
    console.error('Gemini chat error:', error.message);
    return mockChatResponse(userMessage, expenseData);
  }
}

/**
 * Generate a narrative monthly financial report.
 * @param {object} monthlyData - Monthly financial data
 * @returns {Promise<object>} Structured report with sections
 */
async function generateMonthlyReport(monthlyData) {
  const ai = getClient();

  if (!ai) {
    return mockMonthlyReport(monthlyData);
  }

  try {
    const prompt = `Generate a monthly financial report for this data:

Total Spent: ₹${monthlyData.totalSpent?.toFixed(2) || '0.00'}
Previous Month Spent: ₹${monthlyData.comparisonToPrevMonth?.toFixed(2) || '0.00'}
Month-over-Month Change: ${monthlyData.comparisonToPrevMonth ? (((monthlyData.totalSpent - monthlyData.comparisonToPrevMonth) / monthlyData.comparisonToPrevMonth) * 100).toFixed(1) : '0'}%

Category Breakdown:
${(monthlyData.categoryBreakdown || []).map((c) => `- ${c.category}: ₹${c.total.toFixed(2)}`).join('\n')}

Top Expenses:
${(monthlyData.topExpenses || []).map((e) => `- ${e.description}: ₹${e.amount.toFixed(2)} (${e.category})`).join('\n')}

Savings Progress:
${monthlyData.savingsProgress ? `Target: ₹${monthlyData.savingsProgress.target?.toFixed(2) || '0.00'}, Current: ₹${monthlyData.savingsProgress.current?.toFixed(2) || '0.00'}` : 'No savings goals set'}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are a financial report generator. Create detailed, insightful monthly financial reports. 
        
Your response MUST be valid JSON with this exact structure:
{
  "summary": "A 2-3 sentence overview of the month's spending",
  "highlights": ["Array of 3-5 positive financial highlights"],
  "concerns": ["Array of 2-4 areas of concern or overspending"],
  "tips": ["Array of 3-5 actionable financial tips based on the data"],
  "score": <number from 1-10 rating overall financial health this month>
}

Be specific, reference actual numbers, and make tips actionable. Only output JSON, nothing else.`,
        responseMimeType: "application/json"
      }
    });

    const text = response.text.trim();

    // Try to parse as JSON
    try {
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const report = JSON.parse(jsonStr);
      return {
        summary: report.summary || 'No summary available.',
        highlights: report.highlights || [],
        concerns: report.concerns || [],
        tips: report.tips || [],
        score: Math.min(10, Math.max(1, report.score || 5)),
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini report response as JSON:', parseError.message);
      return {
        summary: text,
        highlights: [],
        concerns: [],
        tips: [],
        score: 5,
      };
    }
  } catch (error) {
    console.error('Gemini report generation error:', error.message);
    return mockMonthlyReport(monthlyData);
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────

function formatExpenseDataForPrompt(data) {
  let context = '';

  if (data.totalSpent !== undefined) {
    context += `\n📊 Total Spent (All Time): ₹${data.totalSpent.toFixed(2)}`;
  }

  if (data.monthlySpent !== undefined) {
    context += `\n📅 This Month's Spending: ₹${data.monthlySpent.toFixed(2)}`;
  }

  if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
    context += '\n\n📂 Category Breakdown:';
    data.categoryBreakdown.forEach((c) => {
      context += `\n  - ${c.category}: ₹${c.total.toFixed(2)}${c.count ? ` (${c.count} transactions)` : ''}`;
    });
  }

  if (data.monthlyTrend && data.monthlyTrend.length > 0) {
    context += '\n\n📈 Monthly Spending Trend:';
    data.monthlyTrend.forEach((m) => {
      context += `\n  - ${m.month}: ₹${m.total.toFixed(2)}`;
    });
  }

  if (data.recentTransactions && data.recentTransactions.length > 0) {
    context += '\n\n🧾 Recent Transactions (last 10):';
    data.recentTransactions.forEach((t) => {
      const date = new Date(t.date).toLocaleDateString();
      context += `\n  - ${date}: ${t.description} — ₹${t.amount.toFixed(2)} [${t.category}]`;
    });
  }

  return context || 'No expense data available yet.';
}

function mockCategorize(description) {
  const desc = description.toLowerCase();
  const categoryKeywords = {
    'Groceries': ['grocery', 'groceries', 'supermarket', 'vegetables', 'fruits', 'milk', 'bread', 'rice', 'eggs', 'meat', 'chicken', 'fish', 'bigbasket', 'blinkit', 'zepto', 'dmart', 'reliance fresh', 'more', 'spar'],
    'Dining Out': ['restaurant', 'pizza', 'burger', 'sushi', 'takeout', 'delivery', 'dine', 'dining', 'zomato', 'swiggy', 'dominos', 'mcdonalds', 'kfc', 'subway', 'biryani', 'thali', 'dhaba', 'cafe', 'buffet', 'lunch', 'dinner', 'brunch'],
    'Coffee & Drinks': ['coffee', 'starbucks', 'tea', 'chai', 'juice', 'smoothie', 'bubble tea', 'boba', 'latte', 'cappuccino', 'cold brew', 'ccd', 'chaayos'],
    'Transport': ['taxi', 'auto', 'rickshaw', 'parking', 'car wash', 'toll', 'traffic fine', 'driving'],
    'Fuel & Gas': ['fuel', 'gas', 'petrol', 'diesel', 'cng', 'gas station', 'filling station', 'hp', 'indian oil', 'bharat petroleum'],
    'Ride Sharing': ['uber', 'ola', 'lyft', 'rapido', 'ride', 'cab'],
    'Public Transit': ['bus', 'train', 'metro', 'subway', 'railway', 'irctc', 'pass', 'transit', 'local train', 'monorail'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'shop', 'store', 'buy', 'purchase', 'mall', 'online order', 'meesho', 'ajio'],
    'Clothing & Fashion': ['clothes', 'shoes', 'shirt', 'jeans', 'dress', 'jacket', 'sneakers', 'fashion', 'zara', 'h&m', 'uniqlo', 'nike', 'adidas', 'puma', 'saree', 'kurta', 'tailor'],
    'Electronics & Gadgets': ['electronics', 'gadget', 'phone', 'laptop', 'tablet', 'headphones', 'charger', 'cable', 'adapter', 'mouse', 'keyboard', 'monitor', 'earbuds', 'smartwatch', 'camera', 'apple', 'samsung', 'oneplus', 'croma'],
    'Home & Furniture': ['furniture', 'ikea', 'sofa', 'bed', 'table', 'chair', 'curtain', 'mattress', 'pillow', 'home decor', 'kitchen', 'pepperfry', 'urban ladder', 'maintenance', 'repair', 'plumber', 'electrician'],
    'Rent & Housing': ['rent', 'housing', 'apartment', 'flat', 'mortgage', 'emi', 'society', 'maintenance charge', 'security deposit', 'brokerage', 'landlord'],
    'Bills & Utilities': ['bill', 'electric', 'electricity', 'water', 'gas bill', 'utility', 'municipal', 'sewage', 'garbage', 'power'],
    'Subscriptions': ['subscription', 'netflix', 'spotify', 'youtube premium', 'disney', 'hotstar', 'prime', 'hbo', 'apple music', 'membership', 'annual plan', 'monthly plan', 'jio cinema', 'zee5', 'sonyliv'],
    'Internet & Phone': ['internet', 'wifi', 'broadband', 'phone bill', 'recharge', 'data pack', 'jio', 'airtel', 'vi', 'bsnl', 'postpaid', 'prepaid', 'mobile bill'],
    'Insurance': ['insurance', 'life insurance', 'health insurance', 'car insurance', 'bike insurance', 'term plan', 'policy premium', 'lic', 'star health', 'hdfc ergo'],
    'Entertainment': ['movie', 'concert', 'show', 'theater', 'amusement', 'park', 'fun', 'party', 'bar', 'club', 'pub', 'karaoke', 'bowling', 'arcade', 'escape room', 'event', 'ticket', 'bookmyshow'],
    'Movies & Events': ['cinema', 'pvr', 'inox', 'imax', 'film', 'screening', 'premiere', 'live show', 'stand up', 'comedy show', 'exhibition', 'festival', 'expo'],
    'Gaming': ['game', 'gaming', 'playstation', 'xbox', 'nintendo', 'steam', 'ps5', 'ps4', 'pc game', 'mobile game', 'valorant', 'fortnite', 'cod', 'console'],
    'Health & Medical': ['doctor', 'hospital', 'pharmacy', 'medicine', 'medical', 'dental', 'dentist', 'therapy', 'lab test', 'x-ray', 'scan', 'prescription', 'clinic', 'apollo', 'max hospital', 'fortis', 'consultation', 'eye', 'specialist'],
    'Gym & Fitness': ['gym', 'fitness', 'workout', 'yoga', 'pilates', 'crossfit', 'personal trainer', 'protein', 'supplement', 'cult fit', 'gold gym', 'anytime fitness'],
    'Personal Care': ['salon', 'haircut', 'spa', 'massage', 'skincare', 'cosmetics', 'makeup', 'perfume', 'grooming', 'facial', 'manicure', 'pedicure', 'waxing', 'shampoo', 'soap', 'lotion', 'nykaa', 'beauty'],
    'Education': ['school', 'tuition', 'college', 'university', 'class', 'study', 'coaching', 'byjus', 'unacademy', 'vedantu', 'fees', 'exam', 'admission'],
    'Books & Courses': ['book', 'course', 'udemy', 'coursera', 'skillshare', 'masterclass', 'ebook', 'kindle', 'audiobook', 'tutorial', 'workshop', 'certification', 'training', 'learn'],
    'Travel & Vacation': ['vacation', 'trip', 'travel', 'tour', 'resort', 'hostel', 'luggage', 'passport', 'visa', 'sightseeing', 'excursion', 'backpacking', 'oyo', 'goibibo', 'cleartrip'],
    'Flights & Hotels': ['flight', 'airline', 'hotel', 'airbnb', 'indigo', 'air india', 'spicejet', 'vistara', 'booking', 'makemytrip', 'yatra', 'trivago', 'marriott', 'taj', 'oberoi'],
    'Pet Care': ['pet', 'dog', 'cat', 'vet', 'veterinary', 'pet food', 'grooming', 'kennel', 'pet store', 'pedigree', 'whiskas'],
    'Gifts & Donations': ['gift', 'present', 'donation', 'charity', 'birthday gift', 'wedding gift', 'tip', 'offering', 'crowdfunding', 'ngo'],
    'Investments': ['investment', 'mutual fund', 'sip', 'stocks', 'shares', 'trading', 'crypto', 'bitcoin', 'gold', 'fixed deposit', 'fd', 'ppf', 'nps', 'zerodha', 'groww', 'upstox', 'demat'],
    'EMI & Loans': ['emi', 'loan', 'installment', 'home loan', 'car loan', 'personal loan', 'education loan', 'credit card bill', 'debt', 'repayment', 'interest'],
    'Taxes': ['tax', 'income tax', 'gst', 'property tax', 'road tax', 'advance tax', 'tds', 'tax payment', 'itr'],
    'Childcare': ['childcare', 'daycare', 'nanny', 'babysitter', 'baby', 'diapers', 'formula', 'school fees', 'toys', 'kids'],
    'Office & Work': ['office', 'stationery', 'printer', 'paper', 'ink', 'desk', 'coworking', 'wework', 'work supplies', 'business card', 'courier', 'postage'],
    'Food': ['food', 'snack', 'meal', 'eat', 'breakfast', 'tiffin', 'canteen', 'mess', 'street food', 'chaat'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => desc.includes(kw))) {
      return category;
    }
  }
  return 'Other';
}

function mockChatResponse(userMessage, expenseData) {
  const totalSpent = expenseData.totalSpent || 0;
  const monthlySpent = expenseData.monthlySpent || 0;
  const categories = expenseData.categoryBreakdown || [];
  const topCategory = categories.length > 0 ? categories[0].category : 'uncategorized';
  const lowestCategory = categories.length > 0 ? categories[categories.length - 1].category : 'uncategorized';
  
  const msg = (userMessage || '').toLowerCase();
  
  if (msg.includes('lowest') || msg.includes('least') || msg.includes('minimum')) {
    if (categories.length > 0) {
      const lowest = categories[categories.length - 1];
      return `Your lowest spending category is **${lowest.category}**, where you've spent only **₹${lowest.total.toFixed(2)}**. Great job keeping expenses low there!`;
    }
    return `You don't have enough categorized expenses to determine your lowest spend yet.`;
  }
  
  if (msg.includes('highest') || msg.includes('most') || msg.includes('top') || msg.includes('maximum')) {
    if (categories.length > 0) {
      const highest = categories[0];
      return `Your highest spending category is **${highest.category}** at **₹${highest.total.toFixed(2)}**. If you want to cut back on spending, I recommend reviewing this category first!`;
    }
    return `Your highest spending category is currently uncategorized.`;
  }

  const askedCategory = categories.find(c => msg.includes(c.category.toLowerCase()) || (c.category.toLowerCase().split(' ')[0].length > 3 && msg.includes(c.category.toLowerCase().split(' ')[0])));
  if (askedCategory) {
    return `You have spent **₹${askedCategory.total.toFixed(2)}** on **${askedCategory.category}** across ${askedCategory.count} transactions. 
    
Does that align with your budget for this category?`;
  }

  if (msg.includes('budget') || msg.includes('limit') || msg.includes('save') || msg.includes('saving')) {
    return `Based on your recent spending of **₹${monthlySpent.toFixed(2)}** this month, here are my top budgeting tips:
- Set a strict limit on your highest category (**${topCategory}**)
- Apply the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.
- Review your recent transactions for any recurring subscriptions you no longer use!`;
  }
  
  if (msg.includes('total') || msg.includes('how much') || msg.includes('recent')) {
    const recent = expenseData.recentTransactions || [];
    let response = `Your total spending across all time is **₹${totalSpent.toFixed(2)}**, with **₹${monthlySpent.toFixed(2)}** spent this month.\n\n`;
    if (recent.length > 0) {
      response += `Your most recent transaction was **₹${recent[0].amount.toFixed(2)}** for "${recent[0].description}".`;
    }
    return response;
  }

  return `Based on your spending data, here's an overview:

📊 **Total spending:** **₹${totalSpent.toFixed(2)}** (₹${monthlySpent.toFixed(2)} this month).
🏆 **Top category:** **${topCategory}**

💡 **Tip:** Try asking me specific questions like:
- *"What is my lowest category spend?"*
- *"How much did I spend on ${topCategory}?"*
- *"Give me budgeting tips"*

*Note: I am running in local Mock Mode. To enable full generative AI, please add a valid Gemini API key in the .env file!*`;
}

function mockMonthlyReport(monthlyData) {
  const totalSpent = monthlyData.totalSpent || 0;
  const prevMonth = monthlyData.comparisonToPrevMonth || 0;
  const change = prevMonth > 0 ? ((totalSpent - prevMonth) / prevMonth) * 100 : 0;

  const topCategories = (monthlyData.categoryBreakdown || [])
    .slice(0, 3)
    .map((c) => c.category);

  return {
    summary: `You spent ₹${totalSpent.toFixed(2)} this month${prevMonth > 0 ? `, which is ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% from last month (₹${prevMonth.toFixed(2)})` : ''}. Your top spending ${topCategories.length > 0 ? `categories were ${topCategories.join(', ')}` : 'data is still building up'}.`,
    highlights: [
      "You're tracking your expenses consistently — great habit!",
      `Your spending is spread across ${(monthlyData.categoryBreakdown || []).length} categories`,
      totalSpent < prevMonth ? 'You spent less than last month — nice improvement!' : 'Keep monitoring your spending patterns for more insights',
    ],
    concerns: [
      change > 10 ? `Spending increased ${change.toFixed(1)}% vs. last month` : 'No major spending concerns detected',
      topCategories[0] ? `${topCategories[0]} is your highest category — make sure it aligns with your priorities` : 'Start categorizing expenses for better insights',
    ],
    tips: [
      'Set spending limits for your top categories',
      'Review subscriptions monthly to cut unused ones',
      'Try a no-spend challenge for one weekend per month',
      'Build an emergency fund with 3-6 months of expenses',
      'Automate savings — pay yourself first each paycheck',
    ],
    score: change > 20 ? 4 : change > 0 ? 6 : 8,
  };
}

/**
 * Scan a receipt image using Gemini Vision and extract expense details.
 * @param {string} base64Image - Base64 encoded image data (with or without data URI prefix)
 * @param {string} mimeType - The MIME type of the image (e.g., 'image/jpeg')
 * @returns {Promise<object>} Extracted receipt data
 */
async function scanReceipt(base64Image, mimeType = 'image/jpeg') {
  const ai = getClient();

  if (!ai) {
    return {
      success: false,
      error: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env',
    };
  }

  try {
    // Strip data URI prefix if present
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageData,
              },
            },
            {
              text: `Analyze this receipt/bill image and extract the following information. Return ONLY valid JSON with these fields:
{
  "vendor": "Store/merchant name",
  "description": "Brief description of the purchase",
  "amount": <total amount as a number>,
  "taxAmount": <tax/GST amount as a number, 0 if not found>,
  "tipAmount": <tip amount as a number, 0 if not found>,
  "date": "YYYY-MM-DD format, or empty string if not found",
  "category": "Best matching category from this list: ${EXPENSE_CATEGORIES.join(', ')}",
  "paymentMethod": "One of: Cash, Credit Card, Debit Card, UPI, Bank Transfer, Wallet, Other",
  "items": ["List of individual items if visible, max 5"],
  "currency": "INR or USD or the detected currency code"
}

Important rules:
- Return ONLY the JSON object, no markdown, no explanation
- All amounts must be numbers, not strings
- If information is not found, use empty string for text or 0 for numbers
- For Indian receipts, look for CGST, SGST, IGST for tax
- For date, try to parse any date format into YYYY-MM-DD`
            },
          ],
        },
      ],
    });

    const text = response.text.trim();
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      data: {
        vendor: parsed.vendor || '',
        description: parsed.description || parsed.vendor || '',
        amount: parseFloat(parsed.amount) || 0,
        taxAmount: parseFloat(parsed.taxAmount) || 0,
        tipAmount: parseFloat(parsed.tipAmount) || 0,
        date: parsed.date || '',
        category: EXPENSE_CATEGORIES.includes(parsed.category) ? parsed.category : 'Other',
        paymentMethod: parsed.paymentMethod || 'Other',
        items: Array.isArray(parsed.items) ? parsed.items.slice(0, 5) : [],
        currency: parsed.currency || 'INR',
      },
    };
  } catch (error) {
    console.error('Gemini Vision receipt scan error:', error.message);
    return {
      success: false,
      error: 'Failed to scan receipt. Please try again or enter details manually.',
    };
  }
}

module.exports = {
  categorizeExpense,
  chatWithData,
  generateMonthlyReport,
  scanReceipt,
};
