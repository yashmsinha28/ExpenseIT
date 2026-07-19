import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';

const SpendingChart = ({ timeRange = '6months' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/expenses/stats?timeRange=${timeRange}`);
        const stats = res.data.data || res.data;
        
        const formatXAxisLabel = (dateStr) => {
          if (!dateStr) return '';
          const parts = dateStr.split('-');
          if (parts.length === 3) { 
             const date = new Date(dateStr);
             return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else if (parts.length === 2) {
             const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
             return monthNames[parseInt(parts[1], 10) - 1];
          }
          return dateStr;
        };

        const trend = (stats.monthlyTrend || []).map((item) => ({
          month: formatXAxisLabel(item.month),
          amount: item.total,
        }));
        setData(trend.length > 0 ? trend : [
          { month: 'Jan', amount: 0 },
          { month: 'Feb', amount: 0 },
          { month: 'Mar', amount: 0 },
          { month: 'Apr', amount: 0 },
          { month: 'May', amount: 0 },
          { month: 'Jun', amount: 0 },
        ]);
      } catch {
        setData([
          { month: 'Jan', amount: 0 },
          { month: 'Feb', amount: 0 },
          { month: 'Mar', amount: 0 },
          { month: 'Apr', amount: 0 },
          { month: 'May', amount: 0 },
          { month: 'Jun', amount: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const labelMap = {
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    '6months': 'Last 6 Months',
    '1year': 'This Year',
    'all': 'All Time',
  };
  const subtitle = labelMap[timeRange] || 'Last 6 months';

  if (loading) {
    return (
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Spending Trend</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{subtitle}</p>
        <div className="skeleton" style={{ height: 300, marginTop: '1rem', borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Spending Trend</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{subtitle}</p>
      <div style={{ marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#1a1a1a' }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => '₹' + v}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              formatter={(v) => ['₹' + v.toLocaleString('en-IN'), 'Spent']}
              cursor={{ stroke: '#00F0FF', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#00F0FF"
              strokeWidth={2}
              fill="url(#greenGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#00F0FF',
                stroke: '#040814',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendingChart;
