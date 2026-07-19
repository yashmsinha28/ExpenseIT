import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { IndianRupee, TrendingUp, TrendingDown, CalendarRange, FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import api from '../api/axios';

const CATEGORY_LINE_COLORS = {
  Food: '#10b981', Transport: '#3b82f6', Shopping: '#f59e0b',
  Bills: '#ef4444', Entertainment: '#8b5cf6',
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryTrends, setCategoryTrends] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Export state
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/expenses/stats?timeRange=${timeRange}`);
        const stats = res.data.data || res.data;
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        // Monthly data from monthlyTrend
        const monthly = (stats.monthlyTrend || []).map((item) => ({
          month: monthNames[parseInt(item.month.split('-')[1], 10) - 1] || item.month,
          amount: item.total,
        }));
        setMonthlyData(monthly.length > 0 ? monthly : [
          { month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 },
          { month: 'Mar', amount: 0 }, { month: 'Apr', amount: 0 },
          { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 },
        ]);

        // Category trends
        let catTrends = [];
        if (stats.categoryMonthlyTrend && stats.categoryMonthlyTrend.length > 0) {
          const catMap = {};
          stats.categoryMonthlyTrend.forEach(item => {
            const mName = monthNames[item.month - 1];
            if (!catMap[mName]) catMap[mName] = { month: mName };
            catMap[mName][item.category] = item.total;
          });
          // Preserve chronological order of months from `monthly`
          catTrends = monthly.map(m => catMap[m.month] || { month: m.month });
        } else {
          catTrends = monthly.map(m => ({ month: m.month }));
        }
        setCategoryTrends(catTrends);

        // Summary stats from the aggregate data
        const amounts = monthly.map(m => m.amount);
        const total = amounts.reduce((s, v) => s + v, 0);
        const avg = amounts.length > 0 ? total / amounts.length : 0;
        const maxIdx = amounts.indexOf(Math.max(...amounts));
        const minIdx = amounts.indexOf(Math.min(...amounts));
        setSummaryStats({
          avgMonthly: Math.round(avg),
          highestMonth: monthly[maxIdx]?.month || 'N/A',
          highestAmount: amounts[maxIdx] || 0,
          lowestMonth: monthly[minIdx]?.month || 'N/A',
          lowestAmount: amounts[minIdx] || 0,
          totalYear: Math.round(total),
          trend: 0,
        });
      } catch {
        setMonthlyData([
          { month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 },
          { month: 'Mar', amount: 0 }, { month: 'Apr', amount: 0 },
          { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 },
        ]);
        setCategoryTrends([]);
        setSummaryStats({
          avgMonthly: 0, highestMonth: 'N/A', highestAmount: 0,
          lowestMonth: 'N/A', lowestAmount: 0, totalYear: 0, trend: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeRange]);

  const tooltipStyle = {
    backgroundColor: '#111111',
    border: '1px solid #1a1a1a',
    borderRadius: 12,
    color: '#fff',
    fontSize: '0.875rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  };

  const summaryCards = summaryStats
    ? [
        { label: 'Average Monthly', value: '₹' + summaryStats.avgMonthly.toLocaleString('en-IN'), icon: IndianRupee, color: '#10b981' },
        { label: 'Highest Month', value: `${summaryStats.highestMonth} - ₹${(summaryStats.highestAmount || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: '#ef4444' },
        { label: 'Lowest Month', value: `${summaryStats.lowestMonth} - ₹${(summaryStats.lowestAmount || 0).toLocaleString('en-IN')}`, icon: TrendingDown, color: '#10b981' },
        { label: 'Year Total', value: '₹' + summaryStats.totalYear.toLocaleString('en-IN'), icon: IndianRupee, color: '#3b82f6' },
      ]
    : [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Analytics</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CalendarRange size={18} color="#9ca3af" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #2a2a2a',
              padding: '8px 12px',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && (
        <div
          className="stats-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}
        >
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                style={{
                  background: '#111111',
                  border: '1px solid #1a1a1a',
                  borderRadius: 16,
                  padding: '1.25rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1a1a1a';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${card.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Icon size={18} style={{ color: card.color }} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {card.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Monthly Spending Bar Chart */}
      <div
        style={{
          marginTop: '1.5rem',
          background: '#111111',
          border: '1px solid #1a1a1a',
          borderRadius: 16,
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.25rem' }}>Monthly Spending</h3>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0 0 1rem' }}>Year overview</p>
        {loading ? (
          <div className="skeleton" style={{ height: 350, borderRadius: 10 }} />
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={{ stroke: '#1a1a1a' }} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => '₹' + v} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }} formatter={(v) => ['₹' + v.toLocaleString('en-IN'), 'Spent']} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Trends Line Chart */}
      <div
        style={{
          marginTop: '1.5rem',
          background: '#111111',
          border: '1px solid #1a1a1a',
          borderRadius: 16,
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.25rem' }}>Category Trends</h3>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0 0 1rem' }}>Spending by category over time</p>
        {loading ? (
          <div className="skeleton" style={{ height: 350, borderRadius: 10 }} />
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={categoryTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={{ stroke: '#1a1a1a' }} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => '₹' + v} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }} />
              <Legend
                wrapperStyle={{ fontSize: '0.8rem', color: '#9ca3af', paddingTop: '1rem' }}
              />
              {Object.entries(CATEGORY_LINE_COLORS).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: '#0a0a0a', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Export Reports Section */}
      <div
        style={{
          marginTop: '1.5rem',
          background: '#111111',
          border: '1px solid #1a1a1a',
          borderRadius: 16,
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <FileText size={20} color="#10b981" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Export Reports</h3>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
          Generate professional expense reports for reimbursement or tax filing
        </p>

        {/* Date Range Picker */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.4rem' }}>From Date</label>
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem', background: '#0a0a0a',
                border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff',
                fontSize: '0.9rem', outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.4rem' }}>To Date</label>
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem', background: '#0a0a0a',
                border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff',
                fontSize: '0.9rem', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={exportingPdf}
            onClick={async () => {
              setExportingPdf(true);
              try {
                const params = new URLSearchParams();
                if (exportStartDate) params.append('startDate', exportStartDate);
                if (exportEndDate) params.append('endDate', exportEndDate);
                const response = await api.get(`/expenses/export-pdf?${params.toString()}`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                const link = document.createElement('a');
                link.href = url;
                link.download = `expense_report_${Date.now()}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                console.error('PDF export error:', err);
                alert('Failed to generate PDF report.');
              } finally {
                setExportingPdf(false);
              }
            }}
            style={{
              flex: 1, minWidth: 180, padding: '0.875rem 1.5rem',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', borderRadius: 12, color: '#fff',
              fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              opacity: exportingPdf ? 0.7 : 1,
            }}
          >
            {exportingPdf ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
            {exportingPdf ? 'Generating...' : 'Download PDF Report'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={exportingCsv}
            onClick={async () => {
              setExportingCsv(true);
              try {
                const params = new URLSearchParams();
                if (exportStartDate) params.append('startDate', exportStartDate);
                if (exportEndDate) params.append('endDate', exportEndDate);
                const response = await api.get(`/expenses/export?${params.toString()}`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
                const link = document.createElement('a');
                link.href = url;
                link.download = `expenses_${Date.now()}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                console.error('CSV export error:', err);
                alert('Failed to export CSV.');
              } finally {
                setExportingCsv(false);
              }
            }}
            style={{
              flex: 1, minWidth: 180, padding: '0.875rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: 12, color: '#fff',
              fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              opacity: exportingCsv ? 0.7 : 1,
            }}
          >
            {exportingCsv ? <Loader2 size={18} className="spin" /> : <FileSpreadsheet size={18} />}
            {exportingCsv ? 'Exporting...' : 'Export to Excel (CSV)'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
