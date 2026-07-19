import { useState, useEffect } from 'react';
import {
  User, Mail, Lock, Shield, Globe, Save, AlertTriangle, Trash2,
  CheckCircle, Building2, Link2, RefreshCw, Unlink, Loader2, Smartphone, Download, Database, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import BankConnect from '../components/BankConnect';

export default function Settings() {
  const { user, loadUser, logout } = useAuth();

  // Profile state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Bank connection state
  const [showBankConnect, setShowBankConnect] = useState(false);
  const [connectedBanks, setConnectedBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [syncingBankId, setSyncingBankId] = useState(null);
  const [disconnectingBankId, setDisconnectingBankId] = useState(null);

  // Data Management Modal State
  const [showDataModal, setShowDataModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update state when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCurrency(user.currency || 'INR');
      setMonthlyBudget(user.monthlyBudget || 0);
    }
  }, [user]);

  // Fetch connected banks
  const fetchConnectedBanks = async () => {
    try {
      setLoadingBanks(true);
      const res = await api.get('/plaid/connected_banks');
      setConnectedBanks(res.data.banks || []);
    } catch {
      setConnectedBanks([]);
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => {
    fetchConnectedBanks();
  }, []);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await api.put('/auth/me', { name, currency, monthlyBudget: Number(monthlyBudget) });
      await loadUser();
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showToast('New passwords do not match', 'error');
    }

    try {
      setIsSavingPassword(true);
      await api.put('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to delete all your expenses? This will NOT delete your account.')) {
      try {
        setIsResetting(true);
        const res = await api.delete('/expenses/all');
        showToast(res.data.message || 'All expenses cleared');
        setShowDataModal(false);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to reset data', 'error');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await api.get('/expenses/export', { responseType: 'blob' });
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expenses_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Data exported successfully');
      setShowDataModal(false);
    } catch (err) {
      showToast('Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: Are you absolutely sure? This will permanently delete your account and ALL your data. This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await api.delete('/auth/me');
        logout();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete account', 'error');
        setIsDeleting(false);
      }
    }
  };

  const handleSyncBank = async (bankId) => {
    try {
      setSyncingBankId(bankId);
      const res = await api.post('/plaid/sync_transactions');
      showToast(`${res.data.count || 0} new transactions synced!`);
      await fetchConnectedBanks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Sync failed', 'error');
    } finally {
      setSyncingBankId(null);
    }
  };

  const handleDisconnectBank = async (bankId) => {
    if (!window.confirm('Are you sure you want to disconnect this bank account?')) return;
    try {
      setDisconnectingBankId(bankId);
      await api.delete(`/plaid/disconnect/${bankId}`);
      showToast('Bank disconnected successfully');
      await fetchConnectedBanks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to disconnect', 'error');
    } finally {
      setDisconnectingBankId(null);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const cardStyle = {
    backgroundColor: '#111111', border: '1px solid #1a1a1a',
    borderRadius: '16px', overflow: 'hidden',
  };
  const headerStyle = {
    padding: '24px', borderBottom: '1px solid #1a1a1a',
    display: 'flex', alignItems: 'center',
  };
  const labelStyle = {
    display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px',
  };
  const inputStyle = {
    width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '10px 14px 10px 40px', color: '#fff',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '8px', marginTop: 0 }}>Settings</h1>
      <p style={{ color: '#9ca3af', marginBottom: '32px', marginTop: 0 }}>Manage your account preferences and personal information.</p>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '24px', right: '24px', zIndex: 100,
              backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff', padding: '12px 20px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={18} style={{ marginRight: '8px' }} /> : <AlertTriangle size={18} style={{ marginRight: '8px' }} />}
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ──── Connected Banks Section ──── */}
        <section style={cardStyle}>
          <div style={headerStyle}>
            <Building2 size={20} color="#10b981" style={{ marginRight: '12px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0, flex: 1 }}>Connected Bank Accounts</h2>
            <button
              onClick={() => setShowBankConnect(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, #10b981, #00d47e)',
                color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: '500', fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.3)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <Link2 size={14} /> Link Bank
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {loadingBanks ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 size={24} color="#6b7280" className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : connectedBanks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(16,185,129,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Building2 size={24} color="#6b7280" />
                </div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                  No banks connected yet
                </h3>
                <p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '0.85rem', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                  Link your bank account to automatically sync transactions and track spending in real-time.
                </p>
                <button
                  onClick={() => setShowBankConnect(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.625rem 1.25rem', borderRadius: 10,
                    background: 'linear-gradient(135deg, #10b981, #00d47e)',
                    border: 'none', color: '#fff', fontWeight: 600,
                    cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  <Smartphone size={16} /> Connect Your First Bank
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {connectedBanks.map(bank => (
                  <div
                    key={bank._id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem', borderRadius: 12,
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Building2 size={20} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                          {bank.institutionName}
                        </span>
                        {bank.isMock && (
                          <span style={{
                            fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 4,
                            background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600,
                          }}>SANDBOX</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                        Last synced: {formatTimeAgo(bank.lastSynced)} • {bank.accountType || 'Checking'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                      <button
                        onClick={() => handleSyncBank(bank._id)}
                        disabled={syncingBankId === bank._id}
                        title="Sync now"
                        style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: 'transparent', border: '1px solid #2a2a2a',
                          color: '#9ca3af', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          opacity: syncingBankId === bank._id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#9ca3af'; }}
                      >
                        <RefreshCw size={14} style={{
                          animation: syncingBankId === bank._id ? 'spin 1s linear infinite' : 'none',
                        }} />
                      </button>
                      <button
                        onClick={() => handleDisconnectBank(bank._id)}
                        disabled={disconnectingBankId === bank._id}
                        title="Disconnect"
                        style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: 'transparent', border: '1px solid #2a2a2a',
                          color: '#9ca3af', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          opacity: disconnectingBankId === bank._id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#9ca3af'; }}
                      >
                        <Unlink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ──── Profile Section ──── */}
        <section style={cardStyle}>
          <div style={headerStyle}>
            <User size={20} color="#10b981" style={{ marginRight: '12px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>Profile Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}><User size={16} /></div>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}><Mail size={16} /></div>
                  <input type="email" value={user?.email || ''} readOnly style={{ ...inputStyle, backgroundColor: '#151515', color: '#6b7280', cursor: 'not-allowed' }} />
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', marginBottom: 0 }}>Email cannot be changed directly.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 640 ? '1fr 1fr' : '1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Display Currency</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}><Globe size={16} /></div>
                    <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Monthly Budget limit (0 for none)</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>₹</div>
                    <input type="number" min="0" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} style={{ ...inputStyle, paddingLeft: '32px' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={isSavingProfile} style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #10b981, #00d47e)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: isSavingProfile ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: isSavingProfile ? 0.7 : 1 }}>
                <Save size={16} style={{ marginRight: '8px' }} />
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>

        {/* ──── Password Section ──── */}
        <section style={cardStyle}>
          <div style={headerStyle}>
            <Lock size={20} color="#3b82f6" style={{ marginRight: '12px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>Security & Password</h2>
          </div>

          <form onSubmit={handleUpdatePassword} style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}><Shield size={16} /></div>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 640 ? '1fr 1fr' : '1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}><Lock size={16} /></div>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}><Lock size={16} /></div>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword} style={{ display: 'flex', alignItems: 'center', background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: (isSavingPassword || !currentPassword) ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: (isSavingPassword || !currentPassword) ? 0.7 : 1 }}>
                <Save size={16} style={{ marginRight: '8px' }} />
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>

        {/* ──── Data Management Section ──── */}
        <section style={{ ...cardStyle, border: '1px solid #1a1a1a' }}>
          <div style={headerStyle}>
            <Database size={20} color="#f59e0b" style={{ marginRight: '12px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>Data & Account Management</h2>
          </div>

          <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ color: '#fff', fontSize: '15px', margin: '0 0 4px 0' }}>Manage Your Data</h3>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, maxWidth: '400px' }}>
                Reset your expenses for a fresh start, export your data to CSV, or permanently delete your account.
              </p>
            </div>

            <button 
              onClick={() => setShowDataModal(true)} 
              style={{ 
                display: 'flex', alignItems: 'center', background: 'transparent', color: '#f59e0b', 
                border: '1px solid #f59e0b50', padding: '10px 20px', borderRadius: '8px', 
                cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' 
              }} 
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f59e0b15'} 
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Database size={16} style={{ marginRight: '8px' }} />
              Manage Data
            </button>
          </div>
        </section>

      </div>

      {/* Data Management Modal */}
      <AnimatePresence>
        {showDataModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                background: '#111', width: '100%', maxWidth: '500px',
                borderRadius: '16px', border: '1px solid #1a1a1a',
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} color="#f59e0b" /> Manage Your Data
                </h3>
                <button onClick={() => setShowDataModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Reset Data Option */}
                <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', color: '#fff', fontSize: '0.95rem' }}>Fresh Start (Reset Expenses)</h4>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>Deletes all your recorded expenses but keeps your account active. Perfect for starting over.</p>
                    </div>
                    <button 
                      onClick={handleResetData} disabled={isResetting}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', flexShrink: 0, opacity: isResetting ? 0.7 : 1 }}
                    >
                      {isResetting ? 'Resetting...' : 'Reset Data'}
                    </button>
                  </div>
                </div>

                {/* Export Data Option */}
                <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', color: '#fff', fontSize: '0.95rem' }}>Export Data to CSV</h4>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>Download a copy of all your expenses to a spreadsheet file on your computer.</p>
                    </div>
                    <button 
                      onClick={handleExportData} disabled={isExporting}
                      style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', opacity: isExporting ? 0.7 : 1 }}
                    >
                      <Download size={14} /> {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                  </div>
                </div>

                {/* Delete Account Option */}
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', color: '#ef4444', fontSize: '0.95rem' }}>Delete Account</h4>
                      <p style={{ margin: 0, color: '#ef4444', opacity: 0.8, fontSize: '0.85rem' }}>Permanently wipe your account, login credentials, and all data. Cannot be undone.</p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount} disabled={isDeleting}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', flexShrink: 0, opacity: isDeleting ? 0.7 : 1 }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bank Connect Modal */}
      <AnimatePresence>
        {showBankConnect && (
          <BankConnect
            onConnected={() => {
              fetchConnectedBanks();
            }}
            onClose={() => setShowBankConnect(false)}
          />
        )}
      </AnimatePresence>

      {/* Spin animation for sync icons */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
