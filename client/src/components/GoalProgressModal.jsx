import React, { useState, useEffect } from 'react';
import './GoalProgressModal.css';

export const GoalProgressModal = ({ isOpen, onClose, onSubmit, goal, isSubmitting }) => {
  const [currentAmount, setCurrentAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal) {
      setCurrentAmount(goal.currentAmount !== undefined ? goal.currentAmount : '');
    } else {
      setCurrentAmount('');
    }
    setError('');
  }, [goal, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(currentAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please enter a valid saved amount (cannot be negative).');
      return;
    }

    onSubmit(goal._id, numAmount, setError);
  };

  if (!isOpen || !goal) return null;

  const targetAmount = Number(goal.targetAmount) || 0;
  const numCurrent = parseFloat(currentAmount) || 0;
  const progressPct = targetAmount > 0 ? Math.min(100, Math.round((numCurrent / targetAmount) * 100)) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-container progress-modal-container">
        <div className="modal-header">
          <h2>Update Goal Savings</h2>
          <button className="btn-close-modal" onClick={onClose} disabled={isSubmitting}>
            ✕
          </button>
        </div>

        <div className="progress-goal-info">
          <h3>🏆 {goal.name}</h3>
          <span className="goal-target-lbl">Target: ₹{targetAmount.toLocaleString('en-IN')}</span>
        </div>

        {error && (
          <div className="modal-error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="update-current-amount">New Total Saved Amount (₹) *</label>
            <input
              id="update-current-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 45000"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              disabled={isSubmitting}
              required
              autoFocus
            />
          </div>

          <div className="progress-preview-box">
            <div className="preview-label-row">
              <span>New Calculated Progress</span>
              <strong className={numCurrent >= targetAmount ? 'completed' : ''}>{progressPct}%</strong>
            </div>
            <div className="preview-track">
              <div
                className={`preview-fill ${numCurrent >= targetAmount ? 'completed' : ''}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
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
              {isSubmitting ? 'Updating...' : 'Save Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalProgressModal;
