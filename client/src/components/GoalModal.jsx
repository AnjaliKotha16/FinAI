import React, { useState, useEffect } from 'react';
import './GoalModal.css';

export const GoalModal = ({ isOpen, onClose, onSubmit, editingGoal, isSubmitting }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');

  const formatDateForInput = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name || '');
      setDescription(editingGoal.description || '');
      setTargetAmount(editingGoal.targetAmount || '');
      setCurrentAmount(editingGoal.currentAmount !== undefined ? editingGoal.currentAmount : 0);
      setTargetDate(formatDateForInput(editingGoal.targetDate));
      setPriority(editingGoal.priority || 'Medium');
      setStatus(editingGoal.status || 'Active');
    } else {
      setName('');
      setDescription('');
      setTargetAmount('');
      setCurrentAmount('0');

      // Default target date: 6 months from now
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 6);
      setTargetDate(defaultDate.toISOString().split('T')[0]);

      setPriority('Medium');
      setStatus('Active');
    }
    setError('');
  }, [editingGoal, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name || name.trim().length === 0) {
      setError('Please enter a goal name.');
      return;
    }

    const numTarget = parseFloat(targetAmount);
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Target amount must be a positive number greater than 0.');
      return;
    }

    const numCurrent = parseFloat(currentAmount);
    if (isNaN(numCurrent) || numCurrent < 0) {
      setError('Current saved amount cannot be negative.');
      return;
    }

    if (!targetDate) {
      setError('Please select a target date.');
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      targetAmount: numTarget,
      currentAmount: numCurrent,
      targetDate,
      priority,
      status
    }, setError);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{editingGoal ? 'Edit Financial Goal' : 'Create New Financial Goal'}</h2>
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
            <label htmlFor="goal-name">Goal Name *</label>
            <input
              id="goal-name"
              type="text"
              placeholder="e.g. Emergency Fund, New Laptop, Car"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="goal-target">Target Amount (₹) *</label>
              <input
                id="goal-target"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 100000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-current">Currently Saved (₹)</label>
              <input
                id="goal-current"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 15000"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="goal-date">Target Date *</label>
              <input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-priority">Priority</label>
              <select
                id="goal-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {editingGoal && (
            <div className="form-group">
              <label htmlFor="goal-status">Status</label>
              <select
                id="goal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="goal-desc">Description (Optional)</label>
            <textarea
              id="goal-desc"
              rows="2"
              placeholder="Add details about why you are saving for this milestone..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                : editingGoal
                ? 'Update Goal'
                : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
