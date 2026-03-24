import { HiPencil, HiTrash } from 'react-icons/hi';

const TransactionList = ({ transactions, onEdit, onDelete }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">📭</span>
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      {transactions.map((txn) => (
        <div key={txn.id} className={`transaction-item transaction-item--${txn.type}`}>
          <div className="transaction-item__left">
            <div className={`transaction-item__indicator ${txn.type}`}></div>
            <div className="transaction-item__details">
              <p className="transaction-item__desc">{txn.description}</p>
              <div className="transaction-item__meta">
                <span className="transaction-item__date">{formatDate(txn.date)}</span>
                {txn.category && (
                  <span
                    className="transaction-item__category"
                    style={{ backgroundColor: txn.category.color + '20', color: txn.category.color }}
                  >
                    {txn.category.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="transaction-item__right">
            <span className={`transaction-item__amount ${txn.type}`}>
              {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
            </span>
            <div className="transaction-item__actions">
              {onEdit && (
                <button className="btn-icon" onClick={() => onEdit(txn)} title="Edit">
                  <HiPencil />
                </button>
              )}
              {onDelete && (
                <button className="btn-icon btn-icon--danger" onClick={() => onDelete(txn.id)} title="Delete">
                  <HiTrash />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
