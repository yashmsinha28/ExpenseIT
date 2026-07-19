import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, X, AlertTriangle, CheckCircle, Info, User, Settings, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import api from '../api/axios';

const pageNames = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/analytics': 'Analytics',
  '/savings': 'Savings Goals',
  '/ai-insights': 'AI Insights',
  '/settings': 'Settings',
};

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Search State
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef(null);

  // Profile Menu State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const pageTitle = pageNames[location.pathname] || 'Dashboard';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  // Setup SSE for real-time notifications
  useEffect(() => {
    fetchNotifications();

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to SSE stream
    const eventSource = new EventSource(`http://localhost:5000/api/notifications/stream?token=${token}`);

    eventSource.addEventListener('new_notification', (e) => {
      try {
        const newNotif = JSON.parse(e.data);
        setNotifications((prev) => [newNotif, ...prev]);
      } catch (err) {
        console.error('Error parsing SSE data', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close(); // Close on error, you might want to implement reconnect logic here in a real app
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id = null) => {
    try {
      if (id) {
        await api.put(`/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      } else {
        await api.put('/notifications/read');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  // Live Search functionality
  useEffect(() => {
    if (!searchValue.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/expenses?search=${encodeURIComponent(searchValue)}&limit=5`);
        setSearchResults(res.data.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  const handleSearchResultClick = (expense) => {
    setSearchValue('');
    setSearchFocused(false);
    // In a real app, you might open a modal or navigate to a specific view.
    // Here we just navigate to the expenses page and could potentially pass a query param.
    navigate(`/expenses?search=${encodeURIComponent(expense.description)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            height: 64,
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(4, 8, 20, 0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#ffffff',
              margin: 0,
            }}
          >
            {pageTitle}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            
            {/* ──── Live Search Bar ──── */}
            <div 
              ref={searchRef}
              style={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 10,
                  color: searchFocused ? 'var(--green-primary)' : '#6b7280',
                  transition: 'color 0.2s ease',
                  pointerEvents: 'none'
                }}
              >
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                style={{
                  width: searchFocused ? 320 : 200,
                  height: 38,
                  padding: '0 2rem 0 2.25rem',
                  borderRadius: 19,
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${searchFocused ? 'var(--green-primary)' : 'rgba(255,255,255,0.08)'}`,
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: searchFocused ? '0 0 16px rgba(0, 240, 255, 0.2)' : 'none',
                }}
              />
              {searchValue && (
                <button
                  onClick={() => setSearchValue('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: 2,
                    borderRadius: '50%'
                  }}
                >
                  <X size={14} />
                </button>
              )}

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchFocused && searchValue.trim() !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      background: '#111111',
                      border: '1px solid #1a1a1a',
                      borderRadius: 12,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      zIndex: 100,
                      overflow: 'hidden'
                    }}
                  >
                    {isSearching ? (
                      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <Loader2 size={18} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #1a1a1a' }}>
                          EXPENSES
                        </div>
                        {searchResults.map(exp => (
                          <div 
                            key={exp._id}
                            onClick={() => handleSearchResultClick(exp)}
                            style={{ 
                              padding: '0.75rem 1rem',
                              borderBottom: '1px solid #1a1a1a',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>{exp.description}</div>
                              <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{exp.category} • {new Date(exp.date).toLocaleDateString()}</div>
                            </div>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                              ₹{parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => handleSearchResultClick({ description: searchValue })}
                          style={{
                            width: '100%', padding: '0.75rem', background: '#111', border: 'none',
                            color: '#10b981', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#151515'}
                          onMouseLeave={e => e.currentTarget.style.background = '#111'}
                        >
                          View all results <ArrowRight size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                        No results found for "{searchValue}"
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ──── Real-Time Notifications ──── */}
            <div style={{ position: 'relative' }} ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: showNotifications ? '#1a1a1a' : 'transparent',
                  border: '1px solid transparent',
                  color: showNotifications ? '#fff' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if(!showNotifications) {
                    e.currentTarget.style.background = '#1a1a1a';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if(!showNotifications) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#ef4444',
                      border: '2px solid #0a0a0a',
                      boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)',
                    }}
                  />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: 350,
                      background: '#111111',
                      border: '1px solid #1a1a1a',
                      borderRadius: 12,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      zIndex: 100,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ padding: '1rem', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => markAsRead()}
                          style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif._id}
                            onClick={() => !notif.isRead && markAsRead(notif._id)}
                            style={{ 
                              padding: '1rem', 
                              borderBottom: '1px solid #1a1a1a',
                              background: notif.isRead ? 'transparent' : 'rgba(16, 185, 129, 0.05)',
                              display: 'flex',
                              gap: '0.75rem',
                              cursor: notif.isRead ? 'default' : 'pointer',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if(!notif.isRead) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              if(!notif.isRead) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                            }}
                          >
                            <div style={{ marginTop: 2 }}>
                              {notif.type === 'alert' && <AlertTriangle size={18} color="#ef4444" />}
                              {notif.type === 'success' && <CheckCircle size={18} color="#10b981" />}
                              {notif.type === 'info' && <Info size={18} color="#3b82f6" />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: notif.isRead ? 500 : 600, color: '#fff', marginBottom: 4 }}>
                                {notif.title}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.4, marginBottom: 6 }}>
                                {notif.message}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                {formatTimeAgo(notif.createdAt)}
                              </div>
                            </div>
                            {!notif.isRead && (
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', alignSelf: 'center' }} />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Separator */}
            <div style={{ width: 1, height: 24, background: '#1a1a1a', margin: '0 0.25rem' }} />

            {/* ──── Profile Menu ──── */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: showProfileMenu ? '0 0 0 2px #111, 0 0 0 4px #10b981' : '0 2px 10px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
              >
                {getInitials(user?.name)}
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      right: 0,
                      width: 240,
                      background: '#111111',
                      border: '1px solid #1a1a1a',
                      borderRadius: 12,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      zIndex: 100,
                      overflow: 'hidden'
                    }}
                  >
                    {/* User Info Header */}
                    <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #1a1a1a', background: 'rgba(16, 185, 129, 0.05)' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                        {user?.name || 'User'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Fake Google Logo Icon / Gmail icon indication */}
                        <div style={{ 
                          width: 14, height: 14, borderRadius: 2, 
                          background: 'linear-gradient(45deg, #ea4335, #4285f4, #34a853, #fbbc05)',
                          display: 'inline-block' 
                        }} />
                        {user?.email || 'user@gmail.com'}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '0.5rem' }}>
                      <button 
                        onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                        style={{
                          width: '100%', padding: '0.75rem', background: 'transparent', border: 'none',
                          color: '#fff', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                          borderRadius: 8, transition: 'background 0.2s ease', textAlign: 'left'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <User size={16} color="#9ca3af" /> My Profile
                      </button>
                      <button 
                        onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                        style={{
                          width: '100%', padding: '0.75rem', background: 'transparent', border: 'none',
                          color: '#fff', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                          borderRadius: 8, transition: 'background 0.2s ease', textAlign: 'left'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Settings size={16} color="#9ca3af" /> Account Settings
                      </button>
                      
                      <div style={{ height: 1, background: '#1a1a1a', margin: '0.5rem 0' }} />
                      
                      <button 
                        onClick={handleLogout}
                        style={{
                          width: '100%', padding: '0.75rem', background: 'transparent', border: 'none',
                          color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                          borderRadius: 8, transition: 'background 0.2s ease', textAlign: 'left'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            background: '#0a0a0a',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Layout;
