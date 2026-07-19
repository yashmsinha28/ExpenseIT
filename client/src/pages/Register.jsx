import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, Eye, EyeOff, Check, ShieldCheck, Zap, BarChart3, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import AuroraBackground from '../components/AuroraBackground';

const CorporateLeftSidebar = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 6rem', zIndex: 10 }}>
      {/* Brand Logo */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}
      >
        <div style={{ width: 48, height: 48, background: '#10b981', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(16,185,129,0.3)' }}>
          <Building color="#fff" size={24} />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          EXPENSE <span style={{ color: '#10b981' }}>IT</span>
        </div>
      </motion.div>

      {/* Main Headline */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{ fontSize: 'clamp(3rem, 5vw, 4rem)', fontWeight: 700, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '2rem', maxWidth: '600px' }}
      >
        Enterprise-grade Expense Management.
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ color: '#9ca3af', fontSize: '1.15rem', lineHeight: 1.6, marginBottom: '4rem', maxWidth: '480px' }}
      >
        Automate your tracking, gain AI-driven insights, and take complete control of your financial workflow in real-time.
      </motion.p>

      {/* Trust Badges / Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {[
          { icon: <ShieldCheck size={24} color="#10b981" />, title: "Bank-Level Security", desc: "Your financial data is encrypted and strictly protected." },
          { icon: <Zap size={24} color="#3b82f6" />, title: "AI-Powered Automation", desc: "Instantly scan receipts and categorize transactions." },
          { icon: <BarChart3 size={24} color="#8b5cf6" />, title: "Real-Time Analytics", desc: "Professional reporting and exportable PDF summaries." }
        ].map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
            style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              {feature.icon}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.35rem 0' }}>{feature.title}</h4>
              <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const isValidName = name.length > 1;
  const isValidEmail = email.length > 5 && email.includes('@') && email.includes('.');

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        navigate('/dashboard');
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Google Login failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputGroupStyle = {
    position: 'relative',
    marginBottom: '1.25rem',
  };

  const floatingLabelStyle = (isActive) => ({
    position: 'absolute',
    left: '1rem',
    top: isActive ? '0.35rem' : '50%',
    transform: isActive ? 'translateY(0)' : 'translateY(-50%)',
    fontSize: isActive ? '0.7rem' : '0.95rem',
    color: isActive ? '#10b981' : '#6b7280',
    fontWeight: isActive ? 600 : 400,
    textTransform: isActive ? 'uppercase' : 'none',
    letterSpacing: isActive ? '0.05em' : 'normal',
    transition: 'all 0.2s ease',
    pointerEvents: 'none',
  });

  const floatingInputStyle = (isActive) => ({
    width: '100%',
    background: '#0a0a0a',
    border: `1px solid ${isActive ? '#10b981' : '#262626'}`,
    borderRadius: 8,
    padding: isActive ? '1.5rem 1rem 0.5rem' : '1rem',
    color: '#ffffff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 0 0 1px #10b981' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#050505' }}>
      
      {/* Left Side — Aurora + Corporate Sidebar */}
      <div className="login-left" style={{ flex: '0 0 55%', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <AuroraBackground />
        <CorporateLeftSidebar />
      </div>

      {/* Right Side — Clean Register Form */}
      <div className="login-right" style={{ flex: '0 0 45%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#050505' }}>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            maxWidth: 480, 
            width: '100%',
            padding: '3rem',
            background: 'rgba(15, 15, 15, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Create an account
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1rem', margin: '0 0 2rem 0' }}>
            Join Expense IT today to manage your finances.
          </p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, color: '#ef4444', fontSize: '0.9rem' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Floating Name Input */}
            <div style={inputGroupStyle}>
              <label style={floatingLabelStyle(name.length > 0)}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={floatingInputStyle(name.length > 0)}
              />
              {isValidName && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }}>
                  <Check size={18} />
                </motion.div>
              )}
            </div>

            {/* Floating Email Input */}
            <div style={inputGroupStyle}>
              <label style={floatingLabelStyle(email.length > 0)}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={floatingInputStyle(email.length > 0)}
              />
              {isValidEmail && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }}>
                  <Check size={18} />
                </motion.div>
              )}
            </div>

            {/* Floating Password Input */}
            <div style={inputGroupStyle}>
              <label style={floatingLabelStyle(password.length > 0)}>Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ ...floatingInputStyle(password.length > 0), paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.875rem',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#059669'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981'; }}
            >
              {loading && <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Google Button */}
            <button
              type="button"
              onClick={() => googleLogin()}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.875rem',
                background: '#0a0a0a',
                border: '1px solid #262626',
                borderRadius: 8,
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.borderColor = '#333'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.borderColor = '#262626'; }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign up with Google
            </button>
          </form>

          {/* Login Link */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#9ca3af' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#ffffff', fontWeight: 500, textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
