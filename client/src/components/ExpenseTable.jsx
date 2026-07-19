import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ChevronUp, ChevronDown, Receipt, Camera, FileText, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const CATEGORY_COLORS = {
  'Groceries': '#10b981', 'Dining Out': '#f97316', 'Coffee & Drinks': '#a16207',
  'Transport': '#3b82f6', 'Fuel & Gas': '#6366f1', 'Ride Sharing': '#8b5cf6',
  'Public Transit': '#0ea5e9', 'Shopping': '#f59e0b', 'Clothing & Fashion': '#ec4899',
  'Electronics & Gadgets': '#06b6d4', 'Home & Furniture': '#14b8a6',
  'Rent & Housing': '#d946ef', 'Bills & Utilities': '#ef4444', 'Subscriptions': '#f43f5e',
  'Internet & Phone': '#8b5cf6', 'Insurance': '#64748b', 'Entertainment': '#a855f7',
  'Movies & Events': '#c084fc', 'Gaming': '#7c3aed', 'Health & Medical': '#ec4899',
  'Gym & Fitness': '#f472b6', 'Personal Care': '#fb7185', 'Education': '#06b6d4',
  'Books & Courses': '#22d3ee', 'Travel & Vacation': '#f97316', 'Flights & Hotels': '#fb923c',
  'Pet Care': '#a3e635', 'Gifts & Donations': '#e879f9', 'Investments': '#4ade80',
  'EMI & Loans': '#f87171', 'Taxes': '#94a3b8', 'Childcare': '#fbbf24',
  'Office & Work': '#60a5fa', 'Food': '#10b981', 'Other': '#6b7280',
};

const ENTRY_METHOD_CONFIG = {
  Receipt: { icon: Camera, color: '#f59e0b', label: 'Receipt' },
  Bill: { icon: FileText, color: '#8b5cf6', label: 'Bill' },
  Manual: { icon: null, color: null, label: '' },
};

const STATUS_CONFIG = {
  Paid: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  Pending: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  Overdue: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const ExpenseTable = ({ expenses, onEdit, onDelete, loading }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      if (sortField === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [expenses, sortField, sortDirection]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatAmount = (a, currency = 'INR') => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(parseFloat(a));
    } catch {
      return '₹' + parseFloat(a).toFixed(2);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={12} style={{ opacity: 0.2 }} />;
    return sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const thStyle = {
    padding: '0.75rem 1rem',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#6b7280',
    fontWeight: 600,
    borderBottom: '1px solid #1a1a1a',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const sortableTh = {
    ...thStyle,
    cursor: 'pointer',
  };

  if (loading) {
    return (
      <div style={{ background: '#111111', border: '1px solid #1a1a1a', borderRadius: 16, padding: '1.5rem' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton" style={{ height: 52, marginBottom: '0.5rem', borderRadius: 8 }} />
        ))}
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div style={{
        background: '#111111', border: '1px solid #1a1a1a', borderRadius: 16,
        padding: '3rem', textAlign: 'center',
      }}>
        <Receipt size={40} style={{ color: '#6b7280', margin: '0 auto 1rem', opacity: 0.3 }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>No expenses found</h3>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Add your first expense or adjust filters</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#111111', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={sortableTh} onClick={() => handleSort('date')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  Date <SortIcon field="date" />
                </span>
              </th>
              <th style={sortableTh} onClick={() => handleSort('description')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  Description <SortIcon field="description" />
                </span>
              </th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Status</th>
              <th
                style={{ ...sortableTh, textAlign: 'right' }}
                onClick={() => handleSort('amount')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'flex-end' }}>
                  Amount <SortIcon field="amount" />
                </span>
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((exp, idx) => {
              const entryConfig = ENTRY_METHOD_CONFIG[exp.entryMethod] || ENTRY_METHOD_CONFIG.Manual;
              const statusConfig = STATUS_CONFIG[exp.status] || STATUS_CONFIG.Paid;
              const EntryIcon = entryConfig.icon;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.tr
                  key={exp._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  style={{ transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{
                    padding: '0.875rem 1rem',
                    borderBottom: idx === sortedExpenses.length - 1 ? 'none' : '1px solid rgba(26,26,26,0.5)',
                    color: '#9ca3af', fontSize: '0.85rem', whiteSpace: 'nowrap',
                  }}>
                    {formatDate(exp.date)}
                  </td>
                  <td style={{
                    padding: '0.875rem 1rem',
                    borderBottom: idx === sortedExpenses.length - 1 ? 'none' : '1px solid rgba(26,26,26,0.5)',
                    fontSize: '0.85rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* Entry Method Icon */}
                      {EntryIcon && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 22, height: 22, borderRadius: 6,
                          background: `${entryConfig.color}15`,
                        }} title={`Added via ${entryConfig.label}`}>
                          <EntryIcon size={12} style={{ color: entryConfig.color }} />
                        </span>
                      )}
                      <div>
                        <div style={{ color: '#e5e7eb' }}>{exp.description}</div>
                        {exp.vendor && (
                          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 2 }}>
                            📍 {exp.vendor}
                          </div>
                        )}
                        {exp.tags && exp.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            {exp.tags.map((tag, i) => (
                              <span key={i} style={{
                                fontSize: '0.6rem', color: '#6b7280', background: '#1a1a1a',
                                padding: '0.1rem 0.4rem', borderRadius: 9999,
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{
                    padding: '0.875rem 1rem',
                    borderBottom: idx === sortedExpenses.length - 1 ? 'none' : '1px solid rgba(26,26,26,0.5)',
                  }}>
                    <span style={{
                      display: 'inline-flex', padding: '0.2rem 0.625rem',
                      borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500,
                      background: `${CATEGORY_COLORS[exp.category] || '#6b7280'}20`,
                      color: CATEGORY_COLORS[exp.category] || '#6b7280',
                    }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{
                    padding: '0.875rem 1rem',
                    borderBottom: idx === sortedExpenses.length - 1 ? 'none' : '1px solid rgba(26,26,26,0.5)',
                  }}>
                    {exp.status && exp.status !== 'Paid' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.2rem 0.5rem', borderRadius: 9999,
                        fontSize: '0.7rem', fontWeight: 500,
                        background: statusConfig.bg, color: statusConfig.color,
                      }}>
                        <StatusIcon size={11} /> {exp.status}
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.2rem 0.5rem', borderRadius: 9999,
                        fontSize: '0.7rem', fontWeight: 500,
                        background: 'rgba(16,185,129,0.1)', color: '#10b981',
                      }}>
                        <CheckCircle size={11} /> Paid
                      </span>
                    )}
                  </td>
                  <td style={{
                    padding: '0.875rem 1rem',
                    borderBottom: idx === sortedExpenses.length - 1 ? 'none' : '1px solid rgba(26,26,26,0.5)',
                    fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontSize: '0.85rem',
                  }}>
                    {formatAmount(exp.amount, exp.currency)}
                    {(exp.paymentMethod && exp.paymentMethod !== 'Other') && (
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 400, marginTop: 2 }}>
                        via {exp.paymentMethod}
                      </div>
                    )}
                  </td>
                  <td style={{
                    padding: '0.875rem 1rem',
                    borderBottom: idx === sortedExpenses.length - 1 ? 'none' : '1px solid rgba(26,26,26,0.5)',
                    textAlign: 'right',
                  }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => onEdit(exp)}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'transparent', border: 'none', color: '#9ca3af',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; e.currentTarget.style.color = '#10b981'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(exp._id)}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'transparent', border: 'none', color: '#9ca3af',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;
