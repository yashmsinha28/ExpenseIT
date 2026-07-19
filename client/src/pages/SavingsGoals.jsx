import { useState, useEffect } from 'react';
import { Target, Plus, TrendingUp, CheckCircle, IndianRupee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import SavingsGoal from '../components/SavingsGoal';

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('🎯');

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  const ICONS = ['🎯', '🚗', '🏠', '✈️', '💻', '💍', '🎓', '🏥'];

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/goals');
      setGoals(res.data.data);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setColor('#10b981');
    setIcon('🎯');
    setEditingGoal(null);
  };

  const openModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setName(goal.name);
      setTargetAmount(goal.targetAmount);
      setCurrentAmount(goal.currentAmount || 0);
      setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '');
      setColor(goal.color || '#10b981');
      setIcon(goal.icon || '🎯');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        deadline: deadline || null,
        color,
        icon,
      };

      if (editingGoal) {
        await api.put(`/goals/${editingGoal._id}`, payload);
      } else {
        await api.post('/goals', payload);
      }

      await fetchGoals();
      closeModal();
    } catch (err) {
      console.error('Failed to save goal:', err);
      alert(err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await api.delete(`/goals/${id}`);
        setGoals(goals.filter(g => g._id !== id));
      } catch (err) {
        console.error('Failed to delete goal:', err);
      }
    }
  };

  const handleContribute = async (id, amount) => {
    try {
      await api.put(`/goals/${id}/contribute`, { amount: Number(amount) });
      await fetchGoals();
    } catch (err) {
      console.error('Failed to contribute:', err);
      alert(err.response?.data?.message || 'Failed to contribute');
    }
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
  const avgProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Savings Goals</h1>
          <p style={{ color: '#9ca3af', marginTop: '4px', margin: 0 }}>Track your progress towards your financial targets.</p>
        </div>
        <button 
          onClick={() => openModal()}
          style={{ 
            display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #10b981, #00d47e)', 
            color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '9999px', cursor: 'pointer',
            fontWeight: '500', transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
        >
          <Plus size={18} style={{ marginRight: '8px' }} />
          Add Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Saved', value: `₹${totalSaved.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: <IndianRupee size={20} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.2)' },
          { label: 'Total Target', value: `₹${totalTarget.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: <Target size={20} color="#3b82f6" />, bg: 'rgba(59, 130, 246, 0.2)' },
          { label: 'Completed', value: completedGoals.toString(), icon: <CheckCircle size={20} color="#f59e0b" />, bg: 'rgba(245, 158, 11, 0.2)' },
          { label: 'Avg. Progress', value: `${avgProgress.toFixed(1)}%`, icon: <TrendingUp size={20} color="#8b5cf6" />, bg: 'rgba(139, 92, 246, 0.2)' },
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: '#111111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
              <p style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #1a1a1a', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#111111', border: '1px solid #1a1a1a', borderRadius: '12px' }}>
          <Target size={48} color="#6b7280" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 8px 0' }}>No Savings Goals Yet</h3>
          <p style={{ color: '#9ca3af', margin: '0 0 24px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            Set a goal for your next vacation, a new gadget, or an emergency fund to start tracking your savings.
          </p>
          <button 
            onClick={() => openModal()}
            style={{ 
              background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
            }}
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {goals.map((goal) => (
            <SavingsGoal 
              key={goal._id} 
              goal={goal} 
              onContribute={handleContribute}
              onDelete={handleDelete}
              onEdit={() => openModal(goal)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ 
                position: 'relative', backgroundColor: '#111111', border: '1px solid #1a1a1a', 
                borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: '600' }}>
                  {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
                </h2>
                <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Goal Name</label>
                  <input 
                    type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hawaii Vacation"
                    style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Target Amount</label>
                    <input 
                      type="number" required min="1" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="0.00"
                      style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Current Saved (Optional)</label>
                    <input 
                      type="number" min="0" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0.00"
                      style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Target Date (Optional)</label>
                  <input 
                    type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', boxSizing: 'border-box', colorScheme: 'dark' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Theme Color</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {COLORS.map(c => (
                        <div 
                          key={c} onClick={() => setColor(c)}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: color === c ? '2px solid #fff' : '2px solid transparent' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Icon / Emoji</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {ICONS.map(i => (
                        <div 
                          key={i} onClick={() => setIcon(i)}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: icon === i ? '#2a2a2a' : 'transparent', border: icon === i ? `1px solid ${color}` : '1px solid transparent', fontSize: '18px' }}
                        >
                          {i}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #1a1a1a' }}>
                  <button type="button" onClick={closeModal} style={{ background: 'transparent', color: '#fff', border: '1px solid #333', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ background: color, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                    {editingGoal ? 'Save Changes' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
