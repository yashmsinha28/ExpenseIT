import { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight, AlertTriangle, Lightbulb, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

/* Inject keyframes once */
const styleId = 'monthly-report-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes mr-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default function MonthlyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  /* Hover states */
  const [prevHover, setPrevHover] = useState(false);
  const [nextHover, setNextHover] = useState(false);
  const [retryHover, setRetryHover] = useState(false);
  const [generateHover, setGenerateHover] = useState(false);
  const [regenHover, setRegenHover] = useState(false);

  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const fetchReport = async (date = currentDate, forceGenerate = false) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    try {
      setLoading(true);
      setError(null);
      const url = `/ai/report/${year}/${month}${forceGenerate ? '?generate=true' : ''}`;
      const res = await api.get(url);
      // The report object is nested: res.data.data contains a .report field
      const data = res.data.data;
      setReport(data.report ? data.report : data);
    } catch (err) {
      console.error('Error fetching report:', err);
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load report');
      } else {
        setReport(null);
      }
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReport(currentDate);
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      if (newDate > new Date()) return prev;
      return newDate;
    });
  };

  const handleGenerate = () => {
    setGenerating(true);
    fetchReport(currentDate, true);
  };

  const monthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const isCurrentMonth =
    new Date().getMonth() === currentDate.getMonth() &&
    new Date().getFullYear() === currentDate.getFullYear();

  /* ── Reusable section list renderer ── */
  const renderSection = (icon, title, items, accentColor, bgTint) => {
    if (!items || items.length === 0) return null;
    return (
      <section style={{ marginBottom: 0 }}>
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: '#ffffff',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {icon}
          {title}
        </h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              background: bgTint,
              border: `1px solid ${accentColor}33`,
              padding: 12,
              borderRadius: 8,
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accentColor,
                marginTop: 7,
                marginRight: 12,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '0.875rem', color: `${accentColor}cc`, lineHeight: 1.6 }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #1a1a1a',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#151515',
      }}>
        <h2 style={{
          margin: 0,
          fontWeight: 600,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.95rem',
        }}>
          <FileText size={18} style={{ color: '#10b981' }} />
          Monthly Report
        </h2>

        {/* Month nav */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#1a1a1a',
          borderRadius: 8,
          padding: 4,
        }}>
          <button
            onClick={handlePrevMonth}
            onMouseEnter={() => setPrevHover(true)}
            onMouseLeave={() => setPrevHover(false)}
            style={{
              padding: 4,
              color: prevHover ? '#ffffff' : '#9ca3af',
              background: prevHover ? '#222222' : 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: '#e5e7eb',
            minWidth: 110,
            textAlign: 'center',
          }}>
            {monthYearStr}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            onMouseEnter={() => setNextHover(true)}
            onMouseLeave={() => setNextHover(false)}
            style={{
              padding: 4,
              color: isCurrentMonth ? '#4b5563' : (nextHover ? '#ffffff' : '#9ca3af'),
              background: (!isCurrentMonth && nextHover) ? '#222222' : 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

        {/* Loading / Generating */}
        {(loading || generating) ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 16,
          }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '4px solid #1a1a1a',
                borderTopColor: '#10b981',
                animation: 'mr-spin 1s linear infinite',
                boxSizing: 'border-box',
              }} />
              <Sparkles size={20} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#10b981',
              }} />
            </div>
            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 500, marginBottom: 4, fontSize: '0.95rem' }}>
                {generating ? 'AI is analyzing your data...' : 'Loading report...'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: 280, margin: '0 auto' }}>
                {generating ? 'Generating your personalized financial narrative and savings tips.' : ''}
              </p>
            </div>
          </div>

        /* Error State */
        ) : error ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 24,
          }}>
            <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: 16, opacity: 0.8 }} />
            <h3 style={{ color: '#ffffff', fontWeight: 500, marginBottom: 8 }}>Error Loading Report</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{error}</p>
            <button
              onClick={() => fetchReport(currentDate)}
              onMouseEnter={() => setRetryHover(true)}
              onMouseLeave={() => setRetryHover(false)}
              style={{
                marginTop: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: retryHover ? '#222222' : '#1a1a1a',
                color: '#ffffff',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'background 0.2s',
              }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>

        /* Empty State */
        ) : !report ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 24,
          }}>
            <FileText size={48} style={{ color: '#4b5563', marginBottom: 16 }} />
            <h3 style={{ color: '#ffffff', fontWeight: 500, marginBottom: 8 }}>No Report Yet</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: 24, maxWidth: 320 }}>
              Generate an AI-powered financial summary for {monthYearStr} to uncover insights about your spending habits.
            </p>
            <button
              onClick={handleGenerate}
              onMouseEnter={() => setGenerateHover(true)}
              onMouseLeave={() => setGenerateHover(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: generateHover ? '#059669' : '#10b981',
                color: '#ffffff',
                borderRadius: 8,
                border: 'none',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 0 15px rgba(16,185,129,0.2)',
                fontSize: '0.875rem',
              }}
            >
              <Sparkles size={16} />
              Generate AI Report
            </button>
          </div>

        /* Report Content */
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
          >
            {/* Summary */}
            <section>
              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: 12,
              }}>
                Overview
              </h3>
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                padding: 16,
                borderRadius: 12,
                color: '#d1d5db',
                fontSize: '0.875rem',
                lineHeight: 1.7,
              }}>
                {report.summary}
              </div>
            </section>

            {/* Highlights */}
            {renderSection(
              <CheckCircle size={18} style={{ color: '#10b981' }} />,
              'Highlights',
              report.highlights,
              '#10b981',
              'rgba(6,78,59,0.1)'
            )}

            {/* Concerns */}
            {renderSection(
              <AlertTriangle size={18} style={{ color: '#f59e0b' }} />,
              'Areas of Concern',
              report.concerns,
              '#f59e0b',
              'rgba(120,53,15,0.1)'
            )}

            {/* Tips */}
            {renderSection(
              <Lightbulb size={18} style={{ color: '#60a5fa' }} />,
              'Actionable Tips',
              report.tips,
              '#60a5fa',
              'rgba(30,58,138,0.1)'
            )}

            {/* Footer */}
            <div style={{
              paddingTop: 16,
              borderTop: '1px solid #1a1a1a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                Generated {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'recently'}
              </span>
              <button
                onClick={handleGenerate}
                onMouseEnter={() => setRegenHover(true)}
                onMouseLeave={() => setRegenHover(false)}
                style={{
                  fontSize: '0.75rem',
                  color: regenHover ? '#34d399' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
