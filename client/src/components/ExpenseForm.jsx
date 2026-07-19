import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader, Upload, Camera, FileText, CreditCard, Wallet, Building2, Smartphone, Banknote, Clock, CheckCircle, AlertCircle, ScanLine, Image as ImageIcon } from 'lucide-react';
import api from '../api/axios';

const CATEGORIES = [
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

const PAYMENT_METHODS = [
  { value: 'Cash', icon: '💵', label: 'Cash' },
  { value: 'Credit Card', icon: '💳', label: 'Credit Card' },
  { value: 'Debit Card', icon: '💳', label: 'Debit Card' },
  { value: 'UPI', icon: '📱', label: 'UPI' },
  { value: 'Bank Transfer', icon: '🏦', label: 'Bank Transfer' },
  { value: 'Wallet', icon: '👛', label: 'Wallet' },
  { value: 'Other', icon: '💰', label: 'Other' },
];

const CATEGORY_ICONS = {
  'Groceries': '🛒', 'Dining Out': '🍽️', 'Coffee & Drinks': '☕', 'Transport': '🚗',
  'Fuel & Gas': '⛽', 'Ride Sharing': '🚕', 'Public Transit': '🚌', 'Shopping': '🛍️',
  'Clothing & Fashion': '👗', 'Electronics & Gadgets': '📱', 'Home & Furniture': '🏠',
  'Rent & Housing': '🏘️', 'Bills & Utilities': '💡', 'Subscriptions': '📺',
  'Internet & Phone': '📶', 'Insurance': '🛡️', 'Entertainment': '🎭',
  'Movies & Events': '🎬', 'Gaming': '🎮', 'Health & Medical': '🏥',
  'Gym & Fitness': '💪', 'Personal Care': '💅', 'Education': '🎓',
  'Books & Courses': '📚', 'Travel & Vacation': '✈️', 'Flights & Hotels': '🏨',
  'Pet Care': '🐾', 'Gifts & Donations': '🎁', 'Investments': '📈',
  'EMI & Loans': '🏦', 'Taxes': '📋', 'Childcare': '👶', 'Office & Work': '💼',
  'Food': '🍔', 'Other': '📌',
};

/* ── keyframes injected once ── */
const scanStyleId = 'expense-form-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(scanStyleId)) {
  const style = document.createElement('style');
  style.id = scanStyleId;
  style.textContent = `
    @keyframes ef-spin { to { transform: rotate(360deg); } }
    @keyframes ef-scan-line {
      0% { top: 0; opacity: 1; }
      50% { top: 85%; opacity: 0.8; }
      100% { top: 0; opacity: 1; }
    }
    @keyframes ef-pulse-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(16,185,129,0.2); }
      50% { box-shadow: 0 0 30px rgba(16,185,129,0.5); }
    }
    @keyframes ef-progress { from { width: 0%; } }
  `;
  document.head.appendChild(style);
}

const ExpenseForm = ({ expense, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'INR',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    vendor: '',
    paymentMethod: 'Other',
    taxAmount: '',
    tipAmount: '',
    entryMethod: 'Manual',
    status: 'Paid',
    billDueDate: '',
    receiptImage: null,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        currency: expense.currency || 'INR',
        category: expense.category || 'Other',
        date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
        tags: Array.isArray(expense.tags) ? expense.tags.join(', ') : '',
        vendor: expense.vendor || '',
        paymentMethod: expense.paymentMethod || 'Other',
        taxAmount: expense.taxAmount || '',
        tipAmount: expense.tipAmount || '',
        entryMethod: expense.entryMethod || 'Manual',
        status: expense.status || 'Paid',
        billDueDate: expense.billDueDate ? expense.billDueDate.split('T')[0] : '',
        receiptImage: expense.receiptImage || null,
      });
      if (expense.entryMethod === 'Receipt') setActiveTab('receipt');
      else if (expense.entryMethod === 'Bill') setActiveTab('bill');
    }
  }, [expense]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ── AI Auto-categorize ── */
  const handleAICategorize = async () => {
    if (!formData.description.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/categorize', { description: formData.description, amount: parseFloat(formData.amount) || 0 });
      if (res.data.data.category) {
        setFormData((prev) => ({ ...prev, category: res.data.data.category, aiCategory: res.data.data.category }));
      }
    } catch {
      // fallback silently
    } finally {
      setAiLoading(false);
    }
  };

  /* ── Receipt Scan with Gemini Vision AI ── */
  const handleReceiptScan = useCallback(async (file) => {
    if (!file) return;
    setScanning(true);
    setScanProgress(0);
    setScanStatus('Preparing image...');

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setReceiptPreview(e.target.result);
    reader.readAsDataURL(file);
    setReceiptFile(file);

    try {
      setScanProgress(15);
      setScanStatus('Converting image for AI...');

      // Convert file to base64
      const base64Promise = new Promise((resolve) => {
        const r = new FileReader();
        r.onload = (e) => resolve(e.target.result);
        r.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      setScanProgress(30);
      setScanStatus('🧠 Sending to Gemini Vision AI...');

      // Call backend Gemini Vision endpoint
      const response = await api.post('/ai/scan-receipt', {
        image: base64Data,
        mimeType: file.type || 'image/jpeg',
      });

      setScanProgress(85);
      setScanStatus('Extracting receipt details...');

      if (response.data.success && response.data.data) {
        const d = response.data.data;
        
        setScanProgress(100);
        setScanStatus('✅ Receipt scanned successfully with AI!');

        setFormData((prev) => ({
          ...prev,
          description: d.description || prev.description,
          amount: d.amount || prev.amount,
          vendor: d.vendor || prev.vendor,
          date: d.date || prev.date,
          taxAmount: d.taxAmount || prev.taxAmount,
          tipAmount: d.tipAmount || prev.tipAmount,
          category: d.category || prev.category,
          paymentMethod: d.paymentMethod || prev.paymentMethod,
          currency: d.currency || prev.currency,
          entryMethod: 'Receipt',
          receiptImage: base64Data,
        }));
      } else {
        setScanStatus('⚠️ Could not read receipt. Please fill manually.');
      }
    } catch (err) {
      console.error('Gemini Vision Scan Error:', err);
      setScanStatus('⚠️ AI scan failed. Please fill details manually.');
    } finally {
      setTimeout(() => setScanning(false), 2000);
    }
  }, []);

  /* ── Parse receipt OCR text ── */
  const parseReceiptText = (text) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const result = { description: '', amount: '', vendor: '', date: '', tax: '', tip: '' };

    // Extract vendor (usually first non-empty line)
    if (lines.length > 0) {
      result.vendor = lines[0].replace(/[^a-zA-Z0-9\s&'-]/g, '').trim().substring(0, 60);
    }

    // Extract amounts - find largest number (likely total)
    const amountRegex = /(?:total|amount|grand total|net|due|balance|subtotal)[\s:]*[₹$€£]?\s*([\d,]+\.?\d*)/gi;
    const amounts = [];
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
      amounts.push(parseFloat(match[1].replace(',', '')));
    }

    // Fallback: find any currency-like amounts
    if (amounts.length === 0) {
      const currencyRegex = /[₹$€£]\s*([\d,]+\.?\d*)/g;
      while ((match = currencyRegex.exec(text)) !== null) {
        amounts.push(parseFloat(match[1].replace(',', '')));
      }
    }

    // Also try bare numbers that look like prices
    if (amounts.length === 0) {
      const bareNumRegex = /(\d{2,6}\.\d{2})/g;
      while ((match = bareNumRegex.exec(text)) !== null) {
        amounts.push(parseFloat(match[1]));
      }
    }

    if (amounts.length > 0) {
      result.amount = Math.max(...amounts).toFixed(2);
    }

    // Extract tax
    const taxRegex = /(?:tax|gst|vat|cgst|sgst|igst)[\s:]*[₹$€£]?\s*([\d,]+\.?\d*)/gi;
    const taxMatch = taxRegex.exec(text);
    if (taxMatch) {
      result.tax = parseFloat(taxMatch[1].replace(',', '')).toFixed(2);
    }

    // Extract tip
    const tipRegex = /(?:tip|gratuity|service charge)[\s:]*[₹$€£]?\s*([\d,]+\.?\d*)/gi;
    const tipMatch = tipRegex.exec(text);
    if (tipMatch) {
      result.tip = parseFloat(tipMatch[1].replace(',', '')).toFixed(2);
    }

    // Extract date
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const dateMatch = dateRegex.exec(text);
    if (dateMatch) {
      try {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d.getTime())) {
          result.date = d.toISOString().split('T')[0];
        }
      } catch { /* ignore */ }
    }

    // Build description from vendor + items
    const itemLines = lines.slice(1, 4).filter((l) => l.length > 3 && l.length < 60);
    result.description = result.vendor
      ? `Purchase at ${result.vendor}`
      : itemLines[0] || 'Receipt expense';

    return result;
  };

  /* ── Drag & Drop ── */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleReceiptScan(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleReceiptScan(file);
  };

  /* ── Submit ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (activeTab === 'bill' && formData.status === 'Pending' && !formData.billDueDate) {
      setError('Please set a due date for pending bills');
      return;
    }

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      taxAmount: parseFloat(formData.taxAmount) || 0,
      tipAmount: parseFloat(formData.tipAmount) || 0,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      entryMethod: activeTab === 'receipt' ? 'Receipt' : activeTab === 'bill' ? 'Bill' : 'Manual',
      billDueDate: formData.billDueDate || null,
    };

    onSave(submitData);
  };

  /* ── Styles ── */
  const inputStyle = {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: 10,
    padding: '0.75rem 0.875rem',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#6b7280',
    fontWeight: 600,
    marginBottom: '0.375rem',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = '#10b981';
    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = '#1a1a1a';
    e.target.style.boxShadow = 'none';
  };

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: '0.625rem 0.5rem',
    border: 'none',
    borderRadius: 10,
    background: isActive ? 'rgba(16,185,129,0.15)' : 'transparent',
    color: isActive ? '#10b981' : '#6b7280',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
  });

  /* ── Shared Fields Component ── */
  const SharedFields = () => (
    <>
      {/* Amount & Currency */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Amount</label>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <select
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            style={{ ...inputStyle, width: 90, cursor: 'pointer', appearance: 'none', paddingRight: '0.5rem', textAlign: 'center' }}
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="JPY">¥ JPY</option>
          </select>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>

      {/* Category + AI */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Category</label>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            style={{
              ...inputStyle,
              flex: 1,
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              paddingRight: '2rem',
              cursor: 'pointer',
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_ICONS[c] || '📌'} {c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAICategorize}
            disabled={!formData.description.trim() || aiLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 10,
              color: '#10b981',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: (!formData.description.trim() || aiLoading) ? 'not-allowed' : 'pointer',
              opacity: (!formData.description.trim() || aiLoading) ? 0.5 : 1,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {aiLoading ? <Loader size={13} style={{ animation: 'ef-spin 1s linear infinite' }} /> : <Sparkles size={13} />}
            Auto
          </button>
        </div>
      </div>

      {/* Date */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Tags */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Tags</label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="groceries, weekly (comma separated)"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111111',
          border: '1px solid #1a1a1a',
          borderRadius: 20,
          padding: '1.5rem',
          maxWidth: 540,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
            {expense ? '✏️ Edit Expense' : '➕ New Expense'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'transparent', border: 'none', color: '#9ca3af',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tab Selector ── */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          background: '#0a0a0a',
          borderRadius: 12,
          padding: '0.25rem',
          marginBottom: '1.25rem',
        }}>
          <button type="button" onClick={() => setActiveTab('manual')} style={tabStyle(activeTab === 'manual')}>
            <FileText size={14} /> Manual
          </button>
          <button type="button" onClick={() => setActiveTab('receipt')} style={tabStyle(activeTab === 'receipt')}>
            <Camera size={14} /> Receipt
          </button>
          <button type="button" onClick={() => setActiveTab('bill')} style={tabStyle(activeTab === 'bill')}>
            <CreditCard size={14} /> Bill
          </button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                padding: '0.625rem 0.875rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 10,
                color: '#ef4444',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {/* ════════════════════════════════════════════ */}
          {/* ──────── MANUAL TAB ──────── */}
          {/* ════════════════════════════════════════════ */}
          {activeTab === 'manual' && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="What did you spend on?"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <SharedFields />

              {/* Vendor */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Vendor / Store (Optional)</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => handleChange('vendor', e.target.value)}
                  placeholder="e.g. Amazon, Zomato, DMart"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Payment Method</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => handleChange('paymentMethod', pm.value)}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: 8,
                        border: formData.paymentMethod === pm.value ? '1px solid #10b981' : '1px solid #1a1a1a',
                        background: formData.paymentMethod === pm.value ? 'rgba(16,185,129,0.1)' : '#0a0a0a',
                        color: formData.paymentMethod === pm.value ? '#10b981' : '#9ca3af',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span>{pm.icon}</span> {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tax & Tip row */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tax (Optional)</label>
                  <input
                    type="number"
                    value={formData.taxAmount}
                    onChange={(e) => handleChange('taxAmount', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tip (Optional)</label>
                  <input
                    type="number"
                    value={formData.tipAmount}
                    onChange={(e) => handleChange('tipAmount', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════ */}
          {/* ──────── RECEIPT TAB ──────── */}
          {/* ════════════════════════════════════════════ */}
          {activeTab === 'receipt' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              {/* Upload Zone */}
              {!receiptPreview && !scanning && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? '#10b981' : '#2a2a2a'}`,
                    borderRadius: 16,
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragActive ? 'rgba(16,185,129,0.05)' : '#0a0a0a',
                    transition: 'all 0.3s ease',
                    marginBottom: '1.25rem',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'rgba(16,185,129,0.1)', margin: '0 auto 1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Upload size={24} style={{ color: '#10b981' }} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.375rem', color: '#fff' }}>
                    Upload Receipt
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                    Drag & drop an image or click to browse<br />
                    <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>JPG, PNG, HEIC • AI-powered OCR will extract details automatically</span>
                  </p>
                </div>
              )}

              {/* Scanning Animation */}
              {scanning && receiptPreview && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #10b981',
                    animation: 'ef-pulse-glow 2s ease-in-out infinite',
                  }}>
                    <img
                      src={receiptPreview}
                      alt="Receipt"
                      style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block', filter: 'brightness(0.7)' }}
                    />
                    {/* Scan Line */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 3,
                      background: 'linear-gradient(90deg, transparent, #10b981, #00d47e, #10b981, transparent)',
                      animation: 'ef-scan-line 2s ease-in-out infinite',
                      boxShadow: '0 0 15px rgba(16,185,129,0.6)',
                    }} />
                    {/* Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                    }}>
                      <ScanLine size={32} style={{ color: '#10b981' }} />
                      <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>{scanStatus}</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div style={{
                    marginTop: '0.75rem',
                    background: '#1a1a1a',
                    borderRadius: 8,
                    height: 6,
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.3 }}
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #00d47e)',
                        borderRadius: 8,
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#6b7280', textAlign: 'center', marginTop: '0.5rem' }}>
                    {scanStatus}
                  </p>
                </div>
              )}

              {/* Preview after scanning */}
              {!scanning && receiptPreview && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                    <img src={receiptPreview} alt="Receipt" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(16,185,129,0.9)', borderRadius: 8,
                      padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#fff',
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                    }}>
                      <CheckCircle size={12} /> Scanned
                    </div>
                    <button
                      type="button"
                      onClick={() => { setReceiptPreview(null); setReceiptFile(null); }}
                      style={{
                        position: 'absolute', top: 8, left: 8,
                        background: 'rgba(239,68,68,0.9)', borderRadius: 8,
                        padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                      }}
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Form fields (auto-filled or manual) */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Auto-filled from receipt or type manually"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Vendor (auto-filled) */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Vendor / Store</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => handleChange('vendor', e.target.value)}
                  placeholder="Auto-detected from receipt"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <SharedFields />

              {/* Payment Method */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>{pm.icon} {pm.label}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════ */}
          {/* ──────── BILL TAB ──────── */}
          {/* ════════════════════════════════════════════ */}
          {activeTab === 'bill' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              {/* Status Toggle */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Bill Status</label>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {[
                    { value: 'Paid', icon: <CheckCircle size={14} />, color: '#10b981' },
                    { value: 'Pending', icon: <Clock size={14} />, color: '#f59e0b' },
                    { value: 'Overdue', icon: <AlertCircle size={14} />, color: '#ef4444' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleChange('status', s.value)}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        borderRadius: 10,
                        border: formData.status === s.value ? `1px solid ${s.color}` : '1px solid #1a1a1a',
                        background: formData.status === s.value ? `${s.color}15` : '#0a0a0a',
                        color: formData.status === s.value ? s.color : '#6b7280',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      {s.icon} {s.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Bill Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="e.g. Electricity Bill, Netflix, Rent"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Vendor */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Biller / Provider</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => handleChange('vendor', e.target.value)}
                  placeholder="e.g. Airtel, BESCOM, Netflix"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <SharedFields />

              {/* Due Date */}
              {(formData.status === 'Pending' || formData.status === 'Overdue') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ marginBottom: '1rem' }}
                >
                  <label style={labelStyle}>Due Date</label>
                  <input
                    type="date"
                    value={formData.billDueDate}
                    onChange={(e) => handleChange('billDueDate', e.target.value)}
                    style={{ ...inputStyle, borderColor: formData.status === 'Overdue' ? '#ef444440' : '#1a1a1a' }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </motion.div>
              )}

              {/* Payment Method */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>{pm.icon} {pm.label}</option>
                  ))}
                </select>
              </div>

              {/* Recurring */}
              <div style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: '#0a0a0a',
                borderRadius: 10,
                border: '1px solid #1a1a1a',
              }}>
                <input
                  type="checkbox"
                  checked={formData.isRecurring || false}
                  onChange={(e) => handleChange('isRecurring', e.target.checked)}
                  style={{ accentColor: '#10b981', width: 16, height: 16 }}
                />
                <label style={{ fontSize: '0.85rem', color: '#9ca3af', cursor: 'pointer' }}>
                  🔄 This is a recurring bill (monthly)
                </label>
              </div>
            </motion.div>
          )}

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 9999,
                color: '#9ca3af',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scanning}
              style={{
                padding: '0.625rem 1.5rem',
                background: scanning ? '#1a1a1a' : 'linear-gradient(135deg, #10b981, #00d47e)',
                border: 'none',
                borderRadius: 9999,
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: scanning ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
              onMouseEnter={(e) => {
                if (!scanning) e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {activeTab === 'receipt' && <Camera size={14} />}
              {activeTab === 'bill' && <FileText size={14} />}
              {expense ? 'Update' : activeTab === 'bill' ? 'Save Bill' : activeTab === 'receipt' ? 'Save Receipt' : 'Add Expense'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ExpenseForm;
