import React from 'react';
import './SummaryCard.css';

export const SummaryCard = ({ title, amount, icon, type = 'default', subtitle }) => {
  const isPositive = amount >= 0;

  return (
    <div className={`dashboard-summary-card ${type}`}>
      <div className="card-top">
        <span className="card-title">{title}</span>
        <span className="card-icon">{icon}</span>
      </div>
      <div className={`card-amount ${type}`}>
        {type === 'income' ? '+' : type === 'expense' ? '-' : ''}₹
        {Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {subtitle && <span className="card-subtitle">{subtitle}</span>}
    </div>
  );
};

export default SummaryCard;
