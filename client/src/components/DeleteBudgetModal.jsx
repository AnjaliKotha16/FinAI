import React from 'react';
import './DeleteBudgetModal.css';

export const DeleteBudgetModal = ({ isOpen, onClose, onConfirm, budget, isDeleting }) => {
  if (!isOpen || !budget) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container delete-modal-container">
        <div className="delete-modal-icon">⚠️</div>
        <h2>Delete Budget?</h2>
        <p className="delete-warning-text">
          Are you sure you want to delete the <strong>{budget.category}</strong> budget of{' '}
          <strong>₹{Number(budget.amount).toLocaleString('en-IN')}</strong>?
        </p>
        <p className="delete-subtext">
          This action will only delete the budget limit. Your actual transaction records will remain untouched.
        </p>

        <div className="modal-actions full-width">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-delete"
            onClick={() => onConfirm(budget._id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Budget'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBudgetModal;
