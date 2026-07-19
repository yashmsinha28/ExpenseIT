import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, IndianRupee, CalendarClock, AlertTriangle, CheckCircle,
  XCircle, Clock, Zap, TrendingUp, CreditCard, Loader2,
} from 'lucide-react';
import api from '../api/axios';

const FREQUENCY_LABELS = {
  weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', 'semi-annual': 'Semi-Annual', yearly: 'Yearly',
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10b981', icon: CheckCircle },
  overdue: { label: 'Due', color: '#f59e0b', icon: AlertTriangle },
  possibly_cancelled: { label: 'Inactive', color: '#6b7280', icon: XCircle },
};

const CATEGORY_COLORS = {
  'Subscriptions': '#8b5cf6', 'Internet & Phone': '#3b82f6', 'Bills & Utilities': '#ef4444',
  'Gym & Fitness': '#10b981', 'Entertainment': '#f59e0b', 'Ride Sharing': '#06b6d4',
  'Dining Out': '#ec4899', 'Groceries': '#84cc16', 'Fuel & Gas': '#f97316',
};

const Subscriptions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses/subscriptions');
      setData(res.data.data);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setData({ subscriptions: [], totalMonthly: 0, totalYearly: 0, upcoming: [] });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const daysUntil = (dateStr) => {
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.round(diff);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} color="var(--green-primary)" style={{ animation: 'ef-spin 1s linear infinite' }} />
      </div>
    );
  }

  const { subscriptions = [], totalMonthly = 0, totalYearly = 0, upcoming = [] } = data || {};

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Subscriptions</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>
            AI-detected recurring expenses & upcoming bills
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={fetchSubscriptions}
          style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981', padding: '0.5rem 1rem', borderRadius: 10,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.9rem', fontWeight: 500,
          }}
        >
          <RefreshCw size={16} /> Refresh
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Monthly Cost', value: `₹${totalMonthly.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#10b981', desc: `${subscriptions.length} active subscriptions` },
          { label: 'Yearly Cost', value: `₹${totalYearly.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#3b82f6', desc: 'Projected annual spend' },
          { label: 'Upcoming Bills', value: upcoming.length, icon: CalendarClock, color: '#f59e0b', desc: 'Due in next 30 days' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                background: '#111111', border: '1px solid #1a1a1a', borderRadius: 16,
                padding: '1.25rem', transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: `${card.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem',
              }}>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{card.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>{card.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>{card.desc}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Upcoming Bills Section */}
      {upcoming.length > 0 && (
        <div style={{
          background: '#111111', border: '1px solid #1a1a1a', borderRadius: 16,
          padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CalendarClock size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Upcoming Bills (Next 30 Days)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcoming.map((sub, idx) => {
              const days = daysUntil(sub.nextDue);
              const urgency = days <= 3 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#10b981';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a',
                    borderRadius: 12, padding: '1rem 1.25rem',
                    borderLeft: `3px solid ${urgency}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${CATEGORY_COLORS[sub.category] || '#6b7280'}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Clock size={16} color={CATEGORY_COLORS[sub.category] || '#6b7280'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sub.name}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                        {FREQUENCY_LABELS[sub.frequency] || sub.frequency} • {sub.category}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                      ₹{sub.avgAmount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ color: urgency, fontSize: '0.8rem', fontWeight: 500 }}>
                      {days === 0 ? 'Due Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Subscriptions */}
      <div style={{
        background: '#111111', border: '1px solid #1a1a1a', borderRadius: 16, padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Zap size={18} color="#8b5cf6" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>All Detected Subscriptions</h3>
        </div>

        {subscriptions.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem', color: '#6b7280',
          }}>
            <RefreshCw size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '1rem' }}>No recurring expenses detected yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Add more transactions or sync your bank to discover subscriptions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {subscriptions.map((sub, idx) => {
              const statusCfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.active;
              const StatusIcon = statusCfg.icon;
              const catColor = CATEGORY_COLORS[sub.category] || '#6b7280';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                    gap: '1.5rem', alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                    padding: '1rem 1.25rem', border: '1px solid #1a1a1a',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  {/* Name + Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${catColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CreditCard size={16} color={catColor} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sub.name}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                        {sub.category} • {sub.occurrences} payments
                      </div>
                    </div>
                  </div>

                  {/* Frequency */}
                  <div style={{
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                    padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.75rem',
                    color: '#a78bfa', fontWeight: 500, textAlign: 'center', whiteSpace: 'nowrap',
                  }}>
                    {FREQUENCY_LABELS[sub.frequency] || sub.frequency}
                  </div>

                  {/* Status */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    color: statusCfg.color, fontSize: '0.8rem', fontWeight: 500,
                  }}>
                    <StatusIcon size={14} />
                    {statusCfg.label}
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                      ₹{sub.avgAmount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      ₹{sub.monthlyCost.toLocaleString('en-IN')}/mo
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Subscriptions;
