import React from 'react';
import { CATEGORY_ICONS } from '../utils/constants';
import './BudgetCard.css';

export const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const {
    _id,
    category,
    amount = 0,
    spent = 0,
    remaining = 0,
    percentageUsed = 0,
    status = 'On Track',
    period = 'Monthly',
    startDate,
    endDate,
    notes
  } = budget;

  const isExceeded = status === 'Exceeded' || spent > amount;
  const isNearLimit = status === 'Near Limit';

  const icon = CATEGORY_ICONS[category] || '📦';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Cap visible progress bar fill at 100%
  const progressFillWidth = Math.min(percentageUsed, 100);

  return (
    <div className={`budget-card ${status.toLowerCase().replace(' ', '-')}`}>
      {/* Header with Category & Actions */}
      <div className="budget-card-header">
        <div className="category-info">
          <span className="category-icon-box">{icon}</span>
          <div className="category-title-group">
            <h3>{category}</h3>
            <span className="period-badge">{period}</span>
          </div>
        </div>
        <div className="budget-actions">
          <button className="btn-action edit" onClick={() => onEdit(budget)} title="Edit Budget">
            ✏️
          </button>
          <button className="btn-action delete" onClick={() => onDelete(budget)} title="Delete Budget">
            🗑️
          </button>
        </div>
      </div>

      {/* Date Range Subtitle */}
      <div className="budget-date-range">
        📅 {formatDate(startDate)} - {formatDate(endDate)}
      </div>

      {/* Spending Progress Bar */}
      <div className="budget-progress-section">
        <div className="progress-label-row">
          <span className="progress-used-text">
            {percentageUsed}% used
          </span>
          <span className={`status-pill ${status.toLowerCase().replace(' ', '-')}`}>
            {status}
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${status.toLowerCase().replace(' ', '-')}`}
            style={{ width: `${progressFillWidth}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="budget-metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Budget</span>
          <span className="metric-val">₹{amount.toLocaleString('en-IN')}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Spent</span>
          <span className="metric-val spent">₹{spent.toLocaleString('en-IN')}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">{isExceeded ? 'Exceeded' : 'Remaining'}</span>
          <span className={`metric-val ${isExceeded ? 'exceeded' : 'remaining'}`}>
            {isExceeded ? '' : '₹'}{remaining < 0 ? `-₹${Math.abs(remaining).toLocaleString('en-IN')}` : remaining.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Over-Budget Alert Warning */}
      {isExceeded && (
        <div className="over-budget-banner">
          ⚠️ <strong>Budget exceeded</strong> by ₹{Math.abs(remaining).toLocaleString('en-IN')}
        </div>
      )}

      {/* Notes if available */}
      {notes && <p className="budget-notes">📝 {notes}</p>}
    </div>
  );
};

export default BudgetCard;
