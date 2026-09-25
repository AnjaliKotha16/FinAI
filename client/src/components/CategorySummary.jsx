import React, { useMemo } from 'react';
import { TRANSACTION_CATEGORIES, CATEGORY_ICONS } from '../utils/constants';
import './CategorySummary.css';

export const CategorySummary = ({ transactions = [] }) => {
  // Compute category-wise expense totals from user's transactions only
  const categoryData = useMemo(() => {
    const totals = {};
    let totalExpenseAmount = 0;

    // Initialize all categories with 0
    TRANSACTION_CATEGORIES.forEach((cat) => {
      totals[cat] = 0;
    });

    // Sum expense transactions
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const amt = Number(tx.amount) || 0;
        totals[tx.category] = (totals[tx.category] || 0) + amt;
        totalExpenseAmount += amt;
      }
    });

    // Convert to array of active categories sorted highest expense first
    const items = TRANSACTION_CATEGORIES.map((cat) => {
      const amount = totals[cat] || 0;
      const percentage = totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0;
      return {
        category: cat,
        icon: CATEGORY_ICONS[cat] || '📦',
        amount,
        percentage
      };
    }).filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return { items, totalExpenseAmount };
  }, [transactions]);

  if (categoryData.items.length === 0) {
    return null; // Don't display empty summary if no expenses exist yet
  }

  return (
    <div className="category-summary-card">
      <div className="summary-card-header">
        <h3>Category Expense Summary</h3>
        <span className="summary-badge">Phase 4</span>
      </div>

      <div className="category-summary-list">
        {categoryData.items.map((item) => (
          <div key={item.category} className="category-summary-row">
            <div className="cat-info">
              <span className="cat-icon">{item.icon}</span>
              <span className="cat-name">{item.category}</span>
            </div>

            <div className="cat-stats">
              <span className="cat-amount">
                ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="cat-pct">{item.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySummary;
