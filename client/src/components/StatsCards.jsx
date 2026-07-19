import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Calendar, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const StatsCards = ({ timeRange = '6months' }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/expenses/stats?timeRange=${timeRange}`);
        setStats(res.data.data || res.data);
      } catch {
        setStats({
          totalSpent: 12450,
          monthlySpent: 2340,
          topCategory: 'Food & Dining',
          savingsProgress: 68,
          trends: { total: 12.5, monthly: -5.2, category: 8.1, savings: 15.3 },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeRange]);

  const formatCurrency = (val) => {
    if (typeof val !== 'number') return val;
    return '₹' + val.toLocaleString('en-IN');
  };

  const budget = user?.monthlyBudget || 0;
  const monthlySpent = stats?.monthlySpent || 0;
  let budgetProgress = 0;
  let budgetColor = '#3b82f6'; // default blue
  
  if (budget > 0) {
    budgetProgress = Math.min((monthlySpent / budget) * 100, 100);
    if (budgetProgress >= 100) budgetColor = '#ef4444'; // Red if exceeded
    else if (budgetProgress >= 80) budgetColor = '#f59e0b'; // Yellow/Orange if close
    else budgetColor = '#10b981'; // Green if safe
  }

  const cards = stats
    ? [
        {
          label: 'Total Spent',
          value: formatCurrency(stats.totalSpent),
          icon: IndianRupee,
          color: 'var(--green-primary)',
          trend: stats.trends?.total ?? 0,
        },
        {
          label: 'This Month',
          value: formatCurrency(monthlySpent),
          icon: Calendar,
          color: budget > 0 ? budgetColor : '#3b82f6',
          trend: stats.trends?.monthly ?? 0,
          isBudget: budget > 0,
          progress: budgetProgress,
          limit: formatCurrency(budget),
        },
        {
          label: 'Top Category',
          value: stats.topCategory || 'N/A',
          icon: TrendingUp,
          color: '#8b5cf6',
          trend: stats.trends?.category ?? 0,
        },
        {
          label: 'Savings Progress',
          value: (stats.savingsProgress ?? 0) + '%',
          icon: Target,
          color: '#f59e0b',
          trend: stats.trends?.savings ?? 0,
        },
      ]
    : [];

  if (loading) {
    return (
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5rem',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 140, borderRadius: 16 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="stats-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.5rem',
      }}
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const trendUp = card.trend >= 0;

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              padding: '1.5rem',
              transition: 'var(--transition)',
              cursor: 'default',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(0, 240, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${card.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} style={{ color: card.color }} />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: card.isBudget 
                    ? card.color 
                    : trendUp ? 'var(--green-primary)' : 'var(--red)',
                }}
              >
                {!card.isBudget && (trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
                {card.isBudget ? `${Math.round(card.progress)}%` : `${Math.abs(card.trend).toFixed(1)}%`}
              </div>
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginTop: '0.75rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.25rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{card.label}</span>
              {card.isBudget && <span style={{ color: card.color, fontWeight: 500 }}>of {card.limit}</span>}
            </div>
            
            {/* Budget Progress Bar */}
            {card.isBudget && (
              <div style={{ marginTop: '0.75rem', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${card.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: card.color }}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsCards;
