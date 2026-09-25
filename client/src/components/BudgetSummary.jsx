import React from 'react';
import './BudgetSummary.css';

export const BudgetSummary = ({ summary = {} }) => {
  const totalBudgeted = summary.totalBudgeted || 0;
  const totalSpent = summary.totalSpent || 0;
  const totalRemaining = summary.totalRemaining !== undefined ? summary.totalRemaining : (totalBudgeted - totalSpent);
  const activeCount = summary.activeCount || 0;

  const isExceededOverall = totalRemaining < 0;

  return (
    <div className="budget-summary-banner">
      <div className="summary-stat-card active-budgets">
        <div className="stat-top">
          <span className="stat-label">Active Budgets</span>
          <span className="stat-icon">🎯</span>
        </div>
        <div className="stat-value">{activeCount}</div>
        <div className="stat-sub">Currently monitoring</div>
      </div>

      <div className="summary-stat-card total-budgeted">
        <div className="stat-top">
          <span className="stat-label">Total Budgeted</span>
          <span className="stat-icon">💼</span>
        </div>
        <div className="stat-value">
          ₹{totalBudgeted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="stat-sub">Defined spending caps</div>
      </div>

      <div className="summary-stat-card total-spent">
        <div className="stat-top">
          <span className="stat-label">Total Spent</span>
          <span className="stat-icon">💸</span>
        </div>
        <div className="stat-value spent-color">
          ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="stat-sub">Calculated from expenses</div>
      </div>

      <div className={`summary-stat-card total-remaining ${isExceededOverall ? 'exceeded' : ''}`}>
        <div className="stat-top">
          <span className="stat-label">Total Remaining</span>
          <span className="stat-icon">{isExceededOverall ? '🚨' : '🛡️'}</span>
        </div>
        <div className={`stat-value ${isExceededOverall ? 'negative' : 'positive'}`}>
          {isExceededOverall ? '-' : ''}₹
          {Math.abs(totalRemaining).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="stat-sub">
          {isExceededOverall ? 'Overall budget limit exceeded' : 'Available remaining buffer'}
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;
