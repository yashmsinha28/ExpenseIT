import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/axios';

const CATEGORY_COLORS = {
  'Groceries': '#10b981', 'Dining Out': '#f97316', 'Coffee & Drinks': '#a16207',
  'Transport': '#3b82f6', 'Fuel & Gas': '#6366f1', 'Ride Sharing': '#8b5cf6',
  'Public Transit': '#0ea5e9', 'Shopping': '#f59e0b', 'Clothing & Fashion': '#ec4899',
  'Electronics & Gadgets': '#06b6d4', 'Home & Furniture': '#14b8a6',
  'Rent & Housing': '#d946ef', 'Bills & Utilities': '#ef4444', 'Subscriptions': '#f43f5e',
  'Internet & Phone': '#8b5cf6', 'Insurance': '#64748b', 'Entertainment': '#a855f7',
  'Movies & Events': '#c084fc', 'Gaming': '#7c3aed', 'Health & Medical': '#ec4899',
  'Gym & Fitness': '#f472b6', 'Personal Care': '#fb7185', 'Education': '#06b6d4',
  'Books & Courses': '#22d3ee', 'Travel & Vacation': '#f97316', 'Flights & Hotels': '#fb923c',
  'Pet Care': '#a3e635', 'Gifts & Donations': '#e879f9', 'Investments': '#4ade80',
  'EMI & Loans': '#f87171', 'Taxes': '#94a3b8', 'Childcare': '#fbbf24',
  'Office & Work': '#60a5fa', 'Food': '#10b981', 'Other': '#6b7280',
};

const CategoryPie = ({ timeRange = '6months' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/expenses/stats?timeRange=${timeRange}`);
        const stats = res.data.data || res.data;
        const breakdown = (stats.categoryBreakdown || []).map((item) => ({
          name: item.category,
          value: item.total,
        }));
        setData(breakdown.length > 0 ? breakdown : [
          { name: 'No Data', value: 1 },
        ]);
      } catch {
        setData([
          { name: 'No Data', value: 1 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  if (loading) {
    return (
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>By Category</h3>
        <div
          className="skeleton"
          style={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            margin: '2rem auto',
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>By Category</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.name] || '#6b7280'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#111111',
              border: '1px solid #1a1a1a',
              borderRadius: 12,
              color: '#fff',
              fontSize: '0.875rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
            formatter={(v) => ['₹' + v.toLocaleString('en-IN'), '']}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '0.5rem',
        }}
      >
        {data.map((entry) => (
          <div
            key={entry.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: CATEGORY_COLORS[entry.name] || '#6b7280',
              }}
            />
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPie;
