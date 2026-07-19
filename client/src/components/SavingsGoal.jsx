import { useState } from 'react';
import { Edit2, Trash2, Calendar, Target, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SavingsGoal({ goal, onContribute, onDelete, onEdit }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [amount, setAmount] = useState('');
  
  const percentage = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
  const isCompleted = goal.currentAmount >= goal.targetAmount;
  
  // Circle math
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleContributeSubmit = (e) => {
    e.preventDefault();
    if (amount && !isNaN(amount) && Number(amount) > 0) {
      onContribute(goal._id, amount);
      setAmount('');
      setShowContribute(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#111111',
        border: `1px solid ${isHovered ? goal.color + '40' : '#1a1a1a'}`,
        borderRadius: '16px',
        padding: '20px',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: isHovered ? `0 10px 30px -10px ${goal.color}20` : 'none',
        overflow: 'hidden'
      }}
    >
      {isCompleted && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: goal.color }} />
      )}

      {/* Top row: Icon/Name & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${goal.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '12px' }}>
            {goal.icon}
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>{goal.name}</h3>
            {isCompleted ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', color: goal.color, fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                <Check size={12} style={{ marginRight: '4px' }} /> Goal Reached
              </span>
            ) : (
              <span style={{ color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                <Target size={12} style={{ marginRight: '4px' }} /> In Progress
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', opacity: isHovered || window.innerWidth < 768 ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button onClick={() => onEdit(goal)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(goal._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Middle: Progress Circle & Amounts */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', marginRight: '20px' }}>
          <svg style={{ transform: 'rotate(-90deg)' }} width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} stroke="#1a1a1a" strokeWidth="6" fill="transparent" />
            <circle 
              cx="40" cy="40" r={radius} 
              stroke={goal.color} 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{Math.round(percentage)}%</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
            ₹{goal.currentAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
            of ₹{goal.targetAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {/* Bottom: Date & Contribute button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a1a1a', paddingTop: '16px' }}>
        {goal.deadline ? (
          <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280', fontSize: '12px' }}>
            <Calendar size={14} style={{ marginRight: '6px' }} />
            {formatDate(goal.deadline)}
          </div>
        ) : (
          <div style={{ color: '#6b7280', fontSize: '12px' }}>No deadline</div>
        )}

        {!isCompleted && !showContribute && (
          <button 
            onClick={() => setShowContribute(true)}
            style={{ 
              background: `${goal.color}15`, color: goal.color, border: 'none', 
              padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', 
              cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <Plus size={14} style={{ marginRight: '4px' }} /> Add Funds
          </button>
        )}
      </div>

      {/* Contribute Inline Form */}
      <AnimatePresence>
        {showContribute && !isCompleted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginTop: '12px' }}
          >
            <form onSubmit={handleContributeSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount..." autoFocus
                style={{ flex: 1, backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
              <button type="submit" style={{ background: goal.color, color: '#fff', border: 'none', padding: '0 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                Add
              </button>
              <button type="button" onClick={() => setShowContribute(false)} style={{ background: '#1a1a1a', color: '#9ca3af', border: '1px solid #2a2a2a', padding: '0 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
