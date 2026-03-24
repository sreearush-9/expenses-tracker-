import { HiArrowUp, HiArrowDown } from 'react-icons/hi';

const SummaryCard = ({ title, amount, type, icon }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className={`summary-card summary-card--${type}`}>
      <div className="summary-card__icon">
        {icon || (type === 'income' ? <HiArrowUp /> : type === 'expense' ? <HiArrowDown /> : '💰')}
      </div>
      <div className="summary-card__content">
        <p className="summary-card__title">{title}</p>
        <h3 className="summary-card__amount">{formatCurrency(amount || 0)}</h3>
      </div>
    </div>
  );
};

export default SummaryCard;
