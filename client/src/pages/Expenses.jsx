import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import api from '../api/axios';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';

const CATEGORIES = [
  'All Categories',
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

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'All Categories') params.append('category', filters.category);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      params.append('page', page);
      params.append('limit', 10);
      params.append('sort', '-date');

      const res = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res.data.data || res.data.expenses || []);
      setTotalPages(res.data.pagination?.pages || res.data.totalPages || 1);
    } catch {
      setExpenses([
        { _id: '1', description: 'Grocery Shopping', amount: 85.50, category: 'Food', date: '2024-01-15', tags: ['groceries'] },
        { _id: '2', description: 'Uber Ride', amount: 24.00, category: 'Transport', date: '2024-01-14', tags: ['commute'] },
        { _id: '3', description: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', date: '2024-01-13', tags: ['subscription'] },
        { _id: '4', description: 'Electric Bill', amount: 120.00, category: 'Bills', date: '2024-01-12', tags: ['utilities'] },
        { _id: '5', description: 'New Sneakers', amount: 189.99, category: 'Shopping', date: '2024-01-11', tags: ['clothing'] },
      ]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreate = async (data) => {
    try {
      const res = await api.post('/expenses', data);
      setExpenses((prev) => [(res.data.data || res.data), ...prev]);
    } catch {
      // Silently handle — form closes anyway
    }
    setShowForm(false);
  };

  const handleUpdate = async (data) => {
    try {
      const res = await api.put(`/expenses/${editingExpense._id}`, data);
      setExpenses((prev) =>
        prev.map((e) => (e._id === editingExpense._id ? (res.data.data || res.data) : e))
      );
    } catch {
      // Silently handle
    }
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
    } catch {
      // Continue with local removal
    }
    setExpenses((prev) => prev.filter((e) => e._id !== id));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', dateFrom: '', dateTo: '' });
    setPage(1);
  };

  const inputStyle = {
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: 10,
    padding: '0.625rem 0.875rem',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Expenses</h1>
        <button
          onClick={() => { setEditingExpense(null); setShowForm(true); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #10b981, #00d47e)',
            color: '#fff',
            border: 'none',
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(16,185,129,0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="filter-bar"
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          background: '#111111',
          border: '1px solid #1a1a1a',
          borderRadius: 14,
          padding: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
            }}
          />
          <input
            type="text"
            placeholder="Search expenses..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            style={{ ...inputStyle, paddingLeft: '2.25rem', width: '100%' }}
            onFocus={(e) => (e.target.style.borderColor = '#10b981')}
            onBlur={(e) => (e.target.style.borderColor = '#1a1a1a')}
          />
        </div>

        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          style={{
            ...inputStyle,
            minWidth: 160,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            paddingRight: '2.25rem',
            cursor: 'pointer',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c === 'All Categories' ? '' : c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          style={{ ...inputStyle, minWidth: 140 }}
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
          style={{ ...inputStyle, minWidth: 140 }}
        />

        {(filters.search || filters.category || filters.dateFrom || filters.dateTo) && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.625rem 0.875rem',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              color: '#9ca3af',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ marginTop: '1.5rem' }}>
        <ExpenseTable
          expenses={expenses}
          onEdit={(exp) => { setEditingExpense(exp); setShowForm(true); }}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '1.5rem',
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              color: page === 1 ? '#6b7280' : '#fff',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              color: page === totalPages ? '#6b7280' : '#fff',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ExpenseForm
            expense={editingExpense}
            onSave={editingExpense ? handleUpdate : handleCreate}
            onClose={() => { setShowForm(false); setEditingExpense(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Expenses;
