import { useState, useEffect } from 'react';
import api from '../api/axios';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import toast from 'react-hot-toast';
import { HiPlus } from 'react-icons/hi';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [filters, pagination.page]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page);
      params.set('limit', '15');
      if (filters.type) params.set('type', filters.type);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(`/transactions?${params.toString()}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleEdit = (txn) => {
    setEditingTxn(txn);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTxn(null);
    fetchTransactions();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ type: '', categoryId: '', startDate: '', endDate: '' });
  };

  return (
    <div className="page" id="transactions-page">
      <div className="page__header">
        <div>
          <h2>Transactions</h2>
          <p className="page__subtitle">{pagination.total} total transactions</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => { setEditingTxn(null); setShowForm(true); }}
          id="btn-add-transaction"
        >
          <HiPlus /> Add Transaction
        </button>
      </div>

      <div className="filters-bar">
        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          placeholder="Start Date"
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          placeholder="End Date"
        />
        <button className="btn btn--secondary" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : (
        <>
          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn--secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </button>
              <span className="pagination__info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn--secondary"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <TransactionForm
          transaction={editingTxn}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingTxn(null); }}
        />
      )}
    </div>
  );
};

export default Transactions;
