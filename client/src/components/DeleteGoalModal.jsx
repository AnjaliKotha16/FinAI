import React from 'react';
import './DeleteGoalModal.css';

export const DeleteGoalModal = ({ isOpen, onClose, onConfirm, goal, isDeleting }) => {
  if (!isOpen || !goal) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container delete-goal-modal-container">
        <div className="delete-modal-icon">⚠️</div>
        <h2>Delete Goal?</h2>
        <p className="delete-warning-text">
          Are you sure you want to delete the goal <strong>"{goal.name}"</strong>?
        </p>
        <p className="delete-subtext">
          This action will delete the goal milestone and target tracking. Your logged transactions and budgets will remain unaffected.
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
            onClick={() => onConfirm(goal._id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGoalModal;
