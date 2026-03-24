import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'expense', color: '#6366f1' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/categories', form);
        toast.success('Category created');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', type: 'expense', color: '#6366f1' });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type, color: cat.color });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="page" id="categories-page">
      <div className="page__header">
        <div>
          <h2>Categories</h2>
          <p className="page__subtitle">Organize your transactions</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => { setEditing(null); setForm({ name: '', type: 'expense', color: '#6366f1' }); setShowForm(true); }}
          id="btn-add-category"
        >
          <HiPlus /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : (
        <div className="categories-layout">
          <div className="card">
            <h3 className="card__title">
              <span className="card__title-icon expense">↓</span> Expense Categories
            </h3>
            {expenseCategories.length === 0 ? (
              <div className="empty-state"><p>No expense categories yet</p></div>
            ) : (
              <div className="category-list">
                {expenseCategories.map((cat) => (
                  <div key={cat.id} className="category-item">
                    <div className="category-item__left">
                      <span className="category-item__dot" style={{ backgroundColor: cat.color }}></span>
                      <span className="category-item__name">{cat.name}</span>
                    </div>
                    <div className="category-item__actions">
                      <button className="btn-icon" onClick={() => handleEdit(cat)}><HiPencil /></button>
                      <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(cat.id)}><HiTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card__title">
              <span className="card__title-icon income">↑</span> Income Categories
            </h3>
            {incomeCategories.length === 0 ? (
              <div className="empty-state"><p>No income categories yet</p></div>
            ) : (
              <div className="category-list">
                {incomeCategories.map((cat) => (
                  <div key={cat.id} className="category-item">
                    <div className="category-item__left">
                      <span className="category-item__dot" style={{ backgroundColor: cat.color }}></span>
                      <span className="category-item__name">{cat.name}</span>
                    </div>
                    <div className="category-item__actions">
                      <button className="btn-icon" onClick={() => handleEdit(cat)}><HiPencil /></button>
                      <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(cat.id)}><HiTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">{editing ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit} className="form">
              <div className="form__group">
                <label htmlFor="cat-name">Name</label>
                <input
                  id="cat-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Food & Dining"
                  required
                />
              </div>
              <div className="form__group">
                <label>Type</label>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`type-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                    onClick={() => setForm({ ...form, type: 'expense' })}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${form.type === 'income' ? 'active income' : ''}`}
                    onClick={() => setForm({ ...form, type: 'income' })}
                  >
                    Income
                  </button>
                </div>
              </div>
              <div className="form__group">
                <label>Color</label>
                <div className="color-picker">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch ${form.color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>
              <div className="form__actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
