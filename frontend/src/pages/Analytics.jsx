import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

const Analytics = () => {
  const [trends, setTrends] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [months, setMonths] = useState(6);
  const [breakdownType, setBreakdownType] = useState('expense');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [months, breakdownType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trendsRes, breakdownRes] = await Promise.all([
        api.get(`/analytics/monthly-trend?months=${months}`),
        api.get(`/analytics/category-breakdown?type=${breakdownType}`),
      ]);
      setTrends(trendsRes.data.trends);
      setBreakdown(
        breakdownRes.data.breakdown.map((item) => ({
          name: item.category?.name || 'Uncategorized',
          value: parseFloat(item.total),
          count: parseInt(item.count),
          color: item.category?.color || '#94a3b8',
        }))
      );
    } catch (err) {
      console.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const totalBreakdown = breakdown.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="page" id="analytics-page">
      <div className="page__header">
        <div>
          <h2>Analytics</h2>
          <p className="page__subtitle">Visualize your spending patterns</p>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Monthly Trend</h3>
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="select-small"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
        {trends.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">📊</span>
            <p>No trend data available</p>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Category Breakdown</h3>
          <div className="type-toggle type-toggle--small">
            <button
              className={`type-btn ${breakdownType === 'expense' ? 'active expense' : ''}`}
              onClick={() => setBreakdownType('expense')}
            >
              Expense
            </button>
            <button
              className={`type-btn ${breakdownType === 'income' ? 'active income' : ''}`}
              onClick={() => setBreakdownType('income')}
            >
              Income
            </button>
          </div>
        </div>

        {breakdown.length > 0 ? (
          <div className="analytics-breakdown">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {breakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="breakdown-list">
              {breakdown.map((item, index) => (
                <div key={item.name} className="breakdown-item">
                  <div className="breakdown-item__left">
                    <span
                      className="breakdown-item__dot"
                      style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                    ></span>
                    <div>
                      <p className="breakdown-item__name">{item.name}</p>
                      <p className="breakdown-item__count">{item.count} transaction{item.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="breakdown-item__right">
                    <p className="breakdown-item__amount">{formatCurrency(item.value)}</p>
                    <p className="breakdown-item__percent">
                      {totalBreakdown > 0 ? ((item.value / totalBreakdown) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">📊</span>
            <p>No {breakdownType} data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
