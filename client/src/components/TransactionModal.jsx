import React, { useState, useEffect } from 'react';
import { CategorySelect } from './CategorySelect';
import { PAYMENT_METHODS } from '../utils/constants';
import './TransactionModal.css';

export const TransactionModal = ({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount || '');
      setCategory(initialData.category || 'Food');
      setDescription(initialData.description || '');
      setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setPaymentMethod(initialData.paymentMethod || 'UPI');
      setNotes(initialData.notes || '');
    } else {
      // Reset form defaults
      setType('expense');
      setAmount('');
      setCategory('Food');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    if (!date) {
      setError('Please select a transaction date.');
      return;
    }

    onSubmit({
      type,
      amount: numericAmount,
      category,
      description: description.trim(),
      date,
      paymentMethod,
      notes: notes.trim()
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? '✏️ Edit Transaction' : '➕ Add Transaction'}</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="modal-alert error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Type Selection Tabs */}
          <div className="type-toggle-group">
            <button
              type="button"
              className={`type-toggle-btn expense ${type === 'expense' ? 'active' : ''}`}
              onClick={() => setType('expense')}
            >
              💸 Expense
            </button>
            <button
              type="button"
              className={`type-toggle-btn income ${type === 'income' ? 'active' : ''}`}
              onClick={() => setType('income')}
            >
              💰 Income
            </button>
          </div>

          <div className="form-grid">
            {/* Amount */}
            <div className="form-group">
              <label htmlFor="amount">Amount (₹) *</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Reusable Category Select */}
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <CategorySelect
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Date */}
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isSubmitting}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              placeholder="e.g. Lunch with team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              rows="2"
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              maxLength={500}
            />
          </div>

          {/* Form Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="btn-loading">
                  <span className="spinner-sm"></span> Saving...
                </span>
              ) : (
                initialData ? 'Update Transaction' : 'Save Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
