import React from 'react';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting, itemDescription }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
        <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Delete Transaction</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Are you sure you want to delete {itemDescription ? <strong>"{itemDescription}"</strong> : 'this transaction'}? This action cannot be undone.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
          <button
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            style={{
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
