import React, { useState, useEffect } from 'react';
import { TRANSACTION_CATEGORIES } from '../utils/constants';
import './BudgetModal.css';

export const BudgetModal = ({ isOpen, onClose, onSubmit, editingBudget, isSubmitting }) => {
  const [category, setCategory] = useState(TRANSACTION_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('Monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Helper to format Date to YYYY-MM-DD for date input
  const formatDateForInput = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  };

  // Helper to calculate default end date based on period and start date
  const computeDefaultEndDate = (p, startStr) => {
    const start = startStr ? new Date(startStr) : new Date();
    if (isNaN(start.getTime())) return '';

    if (p === 'Monthly') {
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return end.toISOString().split('T')[0];
    } else if (p === 'Weekly') {
      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
      return end.toISOString().split('T')[0];
    }
    return '';
  };

  useEffect(() => {
    if (editingBudget) {
      setCategory(editingBudget.category || TRANSACTION_CATEGORIES[0]);
      setAmount(editingBudget.amount || '');
      setPeriod(editingBudget.period || 'Monthly');
      setStartDate(formatDateForInput(editingBudget.startDate));
      setEndDate(formatDateForInput(editingBudget.endDate));
      setNotes(editingBudget.notes || '');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setCategory(TRANSACTION_CATEGORIES[0]);
      setAmount('');
      setPeriod('Monthly');
      setStartDate(todayStr);
      setEndDate(computeDefaultEndDate('Monthly', todayStr));
      setNotes('');
    }
    setError('');
  }, [editingBudget, isOpen]);

  // Handle period change and recalculate end date if necessary
  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    if (newPeriod !== 'Custom') {
      setEndDate(computeDefaultEndDate(newPeriod, startDate));
    }
  };

  // Handle start date change and update default end date if not custom
  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    if (period !== 'Custom') {
      setEndDate(computeDefaultEndDate(period, newStart));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (!category) {
      setError('Please select a category.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid budget amount greater than 0.');
      return;
    }

    if (!startDate) {
      setError('Please select a start date.');
      return;
    }

    if (!endDate) {
      setError('Please select an end date.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after or equal to start date.');
      return;
    }

    onSubmit({
      category,
      amount: numAmount,
      period,
      startDate,
      endDate,
      notes: notes.trim()
    }, setError);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</h2>
          <button className="btn-close-modal" onClick={onClose} disabled={isSubmitting}>
            ✕
          </button>
        </div>

        {error && (
          <div className="modal-error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="budget-category">Category *</label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
            >
              {TRANSACTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="budget-amount">Budget Amount (₹) *</label>
            <input
              id="budget-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="budget-period">Period *</label>
            <select
              id="budget-period"
              value={period}
              onChange={handlePeriodChange}
              disabled={isSubmitting}
            >
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="budget-start-date">Start Date *</label>
              <input
                id="budget-start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="budget-end-date">End Date *</label>
              <input
                id="budget-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="budget-notes">Notes (Optional)</label>
            <textarea
              id="budget-notes"
              rows="2"
              placeholder="Add notes or goals for this budget limit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : editingBudget
                ? 'Update Budget'
                : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;
