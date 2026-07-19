import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle, Shield, Loader2, Landmark, 
  Smartphone, MessageSquare, Search, Building2, Zap, ArrowRight,
  Wifi, CreditCard
} from 'lucide-react';
import api from '../api/axios';

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', color: '#004B95', logo: '🏦' },
  { id: 'sbi', name: 'State Bank of India', color: '#1F2F6F', logo: '🏛️' },
  { id: 'icici', name: 'ICICI Bank', color: '#B02A30', logo: '🏦' },
  { id: 'axis', name: 'Axis Bank', color: '#97144D', logo: '🏦' },
  { id: 'kotak', name: 'Kotak Mahindra', color: '#ED1C24', logo: '🏦' },
  { id: 'bob', name: 'Bank of Baroda', color: '#F47920', logo: '🏛️' },
];

const BankConnect = ({ onConnected, onClose }) => {
  const [step, setStep] = useState('select'); // select | verify | discover | sync | success
  const [selectedBank, setSelectedBank] = useState(null);
  const [progress, setProgress] = useState(0);
  const [foundAccount, setFoundAccount] = useState(null);
  const [error, setError] = useState(null);

  // Flow Controller
  useEffect(() => {
    let timeout;
    if (step === 'verify') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setStep('discover');
            return 100;
          }
          return p + Math.random() * 15;
        });
      }, 300);
      return () => clearInterval(interval);
    } 
    
    if (step === 'discover') {
      timeout = setTimeout(() => {
        setFoundAccount({
          mask: '*** ' + Math.floor(1000 + Math.random() * 9000),
          type: 'SAVINGS'
        });
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    setStep('verify');
  };

  const handleLinkAccount = async () => {
    setStep('sync');
    try {
      // 1. Connect Bank
      await api.post('/plaid/set_access_token', {
        institution_id: `ins_mock_${selectedBank.id}`,
        name: selectedBank.name,
      });

      // 2. Sync Transactions
      await api.post('/plaid/sync_transactions');

      // 3. Success
      setStep('success');
      setTimeout(() => {
        if (onConnected) onConnected();
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to securely link bank account.');
      setStep('select');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            width: '100%', maxWidth: 420,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--green-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                {step === 'select' ? 'Select Bank' : 
                 step === 'verify' ? 'Verifying Device' : 
                 step === 'discover' ? 'Finding Accounts' : 
                 step === 'success' ? 'Linked Successfully' : 'Secure Linking'}
              </h3>
            </div>
            {step !== 'sync' && step !== 'success' && (
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  cursor: 'pointer', padding: '0.25rem', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div style={{ padding: '1.5rem', minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '1rem', borderRadius: 12, color: '#ef4444', marginBottom: '1.5rem',
                fontSize: '0.9rem', textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {/* STEP 1: Select Bank */}
            {step === 'select' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                  Select your bank to link accounts securely via your registered mobile number.
                </p>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'
                }}>
                  {POPULAR_BANKS.map(bank => (
                    <motion.button
                      key={bank.id}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectBank(bank)}
                      style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: '1.25rem 1rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                        cursor: 'pointer', transition: 'border-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = bank.color}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', background: `${bank.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                        border: `1px solid ${bank.color}50`
                      }}>
                        {bank.logo}
                      </div>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{bank.name}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Verify Device (SMS) */}
            {step === 'verify' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      border: `3px solid transparent`,
                      borderTopColor: selectedBank.color,
                      borderRightColor: selectedBank.color,
                      position: 'absolute', top: -10, left: -10, opacity: 0.5
                    }}
                  />
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%', background: `${selectedBank.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${selectedBank.color}`
                  }}>
                    <MessageSquare size={24} color={selectedBank.color} />
                  </div>
                </div>

                <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                  Verifying your device
                </h4>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
                  Sending secure SMS to verify your mobile number with {selectedBank.name}...
                </p>

                <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 8, height: 6, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    style={{ height: '100%', background: selectedBank.color, borderRadius: 8 }}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Discover Accounts */}
            {step === 'discover' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                {!foundAccount ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        width: 80, height: 80, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                      }}
                    >
                      <Search size={32} color="#3b82f6" />
                    </motion.div>
                    <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Finding accounts</h4>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Searching securely on the network...</p>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', background: `${selectedBank.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                        fontSize: '1.5rem'
                      }}>
                        {selectedBank.logo}
                      </div>
                      <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Account Found</h4>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{selectedBank.name}</p>
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${selectedBank.color}50`,
                      borderRadius: 16, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 12 }}>
                        <Landmark size={24} color="#fff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ color: '#fff', fontSize: '1rem', margin: '0 0 0.25rem' }}>
                          {foundAccount.type} A/C
                        </h5>
                        <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0, fontFamily: 'monospace' }}>
                          {foundAccount.mask}
                        </p>
                      </div>
                      <CheckCircle size={24} color="var(--green-primary)" />
                    </div>

                    <button
                      onClick={handleLinkAccount}
                      style={{
                        background: selectedBank.color, color: '#fff', border: 'none',
                        padding: '1rem', borderRadius: 12, fontSize: '1rem', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        marginTop: 'auto'
                      }}
                    >
                      Link Account <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: Syncing */}
            {step === 'sync' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ position: 'relative', width: 64, height: 64, marginBottom: '1.5rem' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      border: '3px solid transparent', borderTopColor: 'var(--green-primary)', borderRightColor: 'var(--green-primary)'
                    }}
                  />
                  <div style={{ position: 'absolute', inset: 4, background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wifi size={24} color="var(--green-primary)" />
                  </div>
                </div>
                <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Securely linking...</h4>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center' }}>
                  Importing and categorizing your recent transactions using AI.
                </p>
              </motion.div>
            )}

            {/* STEP 5: Success */}
            {step === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  style={{
                    width: 80, height: 80, borderRadius: '50%', background: 'var(--green-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                    boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle size={40} color="#000" />
                </motion.div>
                <h4 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Account Linked!</h4>
                <p style={{ color: '#9ca3af', fontSize: '0.95rem', textAlign: 'center', marginBottom: '2rem' }}>
                  {selectedBank.name} has been securely connected. Your transactions are now synced.
                </p>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 12,
                    fontSize: '1rem', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BankConnect;
