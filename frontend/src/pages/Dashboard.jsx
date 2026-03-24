import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4'];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({ description: '', amount: '' });
  const [editingId, setEditingId] = useState(null);

  // Filter state
  const [searchTitle, setSearchTitle] = useState('');
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(10000);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/transactions?limit=100');
      setExpenses(res.data.transactions);
    } catch (err) {
      console.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, {
          description: form.description,
          amount: parseFloat(form.amount),
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
        });
        setEditingId(null);
      } else {
        await api.post('/transactions', {
          description: form.description,
          amount: parseFloat(form.amount),
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
        });
      }
      setForm({ description: '', amount: '' });
      fetchExpenses();
    } catch (err) {
      console.error('Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setForm({ description: expense.description, amount: expense.amount });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error('Failed to delete');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all expenses?')) return;
    try {
      for (const exp of expenses) {
        await api.delete(`/transactions/${exp.id}`);
      }
      fetchExpenses();
    } catch (err) {
      console.error('Failed to delete all');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Amount', 'Date'];
    const rows = expenses.map((e, i) => [i + 1, e.description, e.amount, e.date]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
  };

  // Computed stats
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const count = expenses.length;
    const avg = count > 0 ? total / count : 0;
    const highest = count > 0 ? Math.max(...expenses.map(e => parseFloat(e.amount))) : 0;
    return { total, count, avg, highest };
  }, [expenses]);

  // Filtered & sorted expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (searchTitle) {
      result = result.filter(e =>
        e.description.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    result = result.filter(e => {
      const amt = parseFloat(e.amount);
      return amt >= minAmount && amt <= maxAmount;
    });

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest') {
      result.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    }

    return result;
  }, [expenses, searchTitle, minAmount, maxAmount, sortBy]);

  // Chart data - group by description for distribution
  const chartData = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const key = e.description;
      map[key] = (map[key] || 0) + parseFloat(e.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [expenses]);

  // Top 5 expenses
  const top5 = useMemo(() => {
    return [...expenses]
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 5);
  }, [expenses]);

  const clearFilters = () => {
    setSearchTitle('');
    setMinAmount(0);
    setMaxAmount(10000);
    setSortBy('newest');
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

  if (loading) {
    return <div className="dash-loading"><div className="dash-spinner"></div></div>;
  }

  return (
    <div className="dash" id="dashboard-page">
      {/* Header */}
      <header className="dash__header">
        <div className="dash__header-left">
          <h1 className="dash__title">Professional Expense Dashboard</h1>
          <p className="dash__subtitle">Track, analyze, and manage your personal spending with clarity.</p>
        </div>
        <div className="dash__header-right">
          <span className="dash__user-badge">Logged in as {user?.name}</span>
          <button className="dash__export-btn" onClick={exportCSV} id="btn-export">Export CSV</button>
          <button className="dash__logout-btn" onClick={handleLogout} id="btn-logout">Logout</button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="dash__stats">
        <div className="dash__stat-card">
          <span className="dash__stat-label">Total Expenses</span>
          <span className="dash__stat-value">{formatCurrency(stats.total)}</span>
        </div>
        <div className="dash__stat-card">
          <span className="dash__stat-label">Entries</span>
          <span className="dash__stat-value">{stats.count}</span>
        </div>
        <div className="dash__stat-card">
          <span className="dash__stat-label">Average Expense</span>
          <span className="dash__stat-value">{formatCurrency(stats.avg)}</span>
        </div>
        <div className="dash__stat-card">
          <span className="dash__stat-label">Highest Expense</span>
          <span className="dash__stat-value">{formatCurrency(stats.highest)}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dash__main">
        {/* Left Sidebar - Form + Filters */}
        <div className="dash__sidebar">
          {/* Add/Edit Form */}
          <div className="dash__card">
            <h3 className="dash__card-title">Add / Edit Expense</h3>
            <form onSubmit={handleSubmit} className="dash__form">
              <div className="dash__field">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="dash__field">
                <label>Amount (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 550"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <button type="submit" className="dash__save-btn">
                {editingId ? 'Update Expense' : 'Save Expense'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="dash__cancel-btn"
                  onClick={() => { setEditingId(null); setForm({ description: '', amount: '' }); }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* Filters */}
          <div className="dash__card">
            <h3 className="dash__card-title">Filters</h3>
            <div className="dash__field">
              <label>Search Title</label>
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
              />
            </div>
            <div className="dash__amount-range">
              <label className="dash__amount-range-label">Amount Range</label>
              <div className="dash__amount-range-row">
                <div className="dash__amount-input-wrap">
                  <span className="dash__amount-prefix">₹</span>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(Number(e.target.value))}
                    placeholder="Min"
                  />
                </div>
                <span className="dash__amount-to">to</span>
                <div className="dash__amount-input-wrap">
                  <span className="dash__amount-prefix">₹</span>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
            <div className="dash__field">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest First</option>
                <option value="lowest">Lowest First</option>
              </select>
            </div>
            <button className="dash__clear-btn" onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>

        {/* Center - Charts */}
        <div className="dash__charts">
          <div className="dash__card">
            <h3 className="dash__card-title">Top Expense Distribution</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="dash__empty">Add expenses to see visual distribution</p>
            )}
          </div>

          <div className="dash__card">
            <h3 className="dash__card-title">Top 5 Expenses</h3>
            {top5.length > 0 ? (
              <div className="dash__top-list">
                {top5.map((e, i) => (
                  <div key={e.id} className="dash__top-item">
                    <span className="dash__top-rank">{i + 1}.</span>
                    <span className="dash__top-name">{e.description}</span>
                    <span className="dash__top-amt">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dash__empty">No expenses yet</p>
            )}
          </div>
        </div>
      </div>

      {/* All Expenses Table */}
      <div className="dash__card dash__table-card">
        <div className="dash__table-header">
          <h3 className="dash__card-title">All Expenses</h3>
          {expenses.length > 0 && (
            <button className="dash__delete-all-btn" onClick={handleDeleteAll}>Delete All</button>
          )}
        </div>
        <div className="dash__table-wrap">
          <table className="dash__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="dash__table-empty">No matching expenses.</td>
                </tr>
              ) : (
                filteredExpenses.map((e, i) => (
                  <tr key={e.id}>
                    <td>{i + 1}</td>
                    <td>{e.description}</td>
                    <td>{formatCurrency(e.amount)}</td>
                    <td>
                      <div className="dash__table-actions">
                        <button className="dash__edit-btn" onClick={() => handleEdit(e)}>Edit</button>
                        <button className="dash__del-btn" onClick={() => handleDelete(e.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
