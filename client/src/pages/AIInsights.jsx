import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AIChat from '../components/AIChat';
import MonthlyReport from '../components/MonthlyReport';

export default function AIInsights() {
  const [isWide, setIsWide] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24, flexShrink: 0 }}
      >
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.025em',
          margin: 0,
        }}>
          AI Insights
        </h1>
        <p style={{
          color: '#9ca3af',
          marginTop: 6,
          fontSize: '0.875rem',
          margin: '6px 0 0 0',
        }}>
          Talk to your data and uncover personalized financial tips.
        </p>
      </motion.div>

      {/* Two-Panel Layout */}
      <div style={{
        display: 'flex',
        flexDirection: isWide ? 'row' : 'column',
        gap: 24,
        flex: 1,
        minHeight: 0,
      }}>
        {/* Chat Panel – 60% on desktop */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            flex: isWide ? '0 0 60%' : '1 1 auto',
            minHeight: 500,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AIChat />
        </motion.div>

        {/* Report Panel – 40% on desktop */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            flex: isWide ? '0 0 calc(40% - 24px)' : '1 1 auto',
            minHeight: 500,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <MonthlyReport />
        </motion.div>
      </div>
    </div>
  );
}
