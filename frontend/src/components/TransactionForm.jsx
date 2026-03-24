import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TransactionForm = ({ transaction, onSuccess, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.date,
        categoryId: transaction.categoryId || '',
      });
    }
  }, [transaction]);

  useEffect(() => {
    fetchCategories();
  }, [form.type]);

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/categories?type=${form.type}`);
      setCategories(res.data.categories);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'type') {
      setForm((prev) => ({ ...prev, categoryId: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      };

      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, payload);
        toast.success('Transaction updated!');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction added!');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">
          {transaction ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="form__group">
            <label>Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`type-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-btn ${form.type === 'income' ? 'active income' : ''}`}
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
              >
                Income
              </button>
            </div>
          </div>

          <div className="form__group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div className="form__group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. Grocery shopping"
              required
            />
          </div>

          <div className="form__group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form__group">
            <label htmlFor="categoryId">Category</label>
            <select
              id="categoryId"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form__actions">
            <button type="button" className="btn btn--secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
