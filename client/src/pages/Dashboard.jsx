import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatsCards from '../components/StatsCards';
import SpendingChart from '../components/SpendingChart';
import CategoryPie from '../components/CategoryPie';

const CATEGORY_COLORS = {
  Food: '#10b981', Transport: '#3b82f6', Shopping: '#f59e0b', Bills: '#ef4444',
  Entertainment: '#8b5cf6', Health: '#ec4899', Education: '#06b6d4', Travel: '#f97316', Other: '#6b7280',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const Dashboard = () => {
  const { user } = useAuth();
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/expenses?limit=5&sort=-date');
        setRecentExpenses(res.data.data || res.data.expenses || []);
      } catch {
        setRecentExpenses([
          { _id: '1', description: 'Grocery Shopping', amount: 85.50, category: 'Food', date: '2024-07-15' },
          { _id: '2', description: 'Uber Ride', amount: 24.00, category: 'Transport', date: '2024-07-14' },
          { _id: '3', description: 'Netflix', amount: 15.99, category: 'Entertainment', date: '2024-07-13' },
          { _id: '4', description: 'Electric Bill', amount: 120.00, category: 'Bills', date: '2024-07-12' },
          { _id: '5', description: 'New Sneakers', amount: 189.99, category: 'Shopping', date: '2024-07-11' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Welcome & Filters */}
      <motion.div 
        variants={item}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Here's your financial overview · {today}
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-family)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} style={{ marginTop: '1.5rem' }}>
        <StatsCards timeRange={timeRange} />
      </motion.div>

      {/* Charts Row */}
      <motion.div
        variants={item}
        className="charts-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        <div
          className="glass-card"
          style={{ padding: '1.5rem' }}
        >
          <SpendingChart timeRange={timeRange} />
        </div>
        <div
          className="glass-card"
          style={{ padding: '1.5rem' }}
        >
          <CategoryPie timeRange={timeRange} />
        </div>
      </motion.div>

      {/* Recent Expenses */}
      <motion.div
        variants={item}
        style={{
          marginTop: '1.5rem',
          background: '#111111',
          border: '1px solid #1a1a1a',
          borderRadius: 16,
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Recent Expenses</h3>
          <Link
            to="/expenses"
            style={{
              color: '#10b981',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 48, borderRadius: 10 }}
              />
            ))}
          </div>
        ) : recentExpenses.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2.5rem',
              color: '#6b7280',
            }}
          >
            <Receipt size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.9rem' }}>No expenses yet. Add your first expense!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentExpenses.map((exp, idx) => (
              <motion.div
                key={exp._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 0.5rem',
                  borderRadius: 10,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{exp.description}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                    {formatDate(exp.date)}
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 9999,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: `${CATEGORY_COLORS[exp.category] || '#6b7280'}20`,
                    color: CATEGORY_COLORS[exp.category] || '#6b7280',
                    marginRight: '1.5rem',
                  }}
                >
                  {exp.category}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.95rem',
                    minWidth: 80,
                    textAlign: 'right',
                  }}
                >
                  ₹{parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick AI Card */}
      <motion.div variants={item} style={{ marginTop: '1.5rem' }}>
        <Link
          to="/ai-insights"
          style={{
            display: 'block',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 16,
            padding: '1.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(16,185,129,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(16,185,129,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>
                AI Insight
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                Ask AI about your spending patterns
              </div>
            </div>
            <ArrowRight
              size={18}
              style={{ marginLeft: 'auto', color: '#10b981' }}
            />
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
