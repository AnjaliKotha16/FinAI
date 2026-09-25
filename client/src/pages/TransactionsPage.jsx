import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { CategoryBadge } from '../components/CategoryBadge';
import { CategoryFilter } from '../components/CategoryFilter';
import { CategorySummary } from '../components/CategorySummary';
import { TransactionModal } from '../components/TransactionModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import * as transactionService from '../services/transactionService';
import './TransactionsPage.css';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Search & Combined Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' or specific category name

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all transactions from backend
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await transactionService.getTransactions();
      if (res.ok && res.data.success) {
        setTransactions(res.data.data || []);
      } else {
        setError(res.data?.message || res.error || 'Unable to load transactions.');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Financial Summary Calculations
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
      } else if (tx.type === 'expense') {
        expense += amt;
      }
    });

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  // Combined Filtered Transactions List (Type + Category + Search)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Type Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // 3. Search Term Filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        const matchCategory = tx.category.toLowerCase().includes(term);
        const matchDesc = tx.description ? tx.description.toLowerCase().includes(term) : false;
        const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(term) : false;
        const matchPayment = tx.paymentMethod ? tx.paymentMethod.toLowerCase().includes(term) : false;
        return matchCategory || matchDesc || matchNotes || matchPayment;
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, searchTerm]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSaveTransaction = async (formData) => {
    setIsSubmitting(true);
    try {
      let res;
      if (editingTransaction) {
        res = await transactionService.updateTransaction(editingTransaction._id, formData);
      } else {
        res = await transactionService.createTransaction(formData);
      }

      if (res.ok && res.data.success) {
        setIsModalOpen(false);
        showToast(editingTransaction ? 'Transaction updated successfully!' : 'Transaction created successfully!');
        fetchTransactions();
      } else {
        alert(res.data?.message || 'Unable to save transaction. Please try again.');
      }
    } catch (err) {
      alert('An error occurred while saving transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (tx) => {
    setDeletingTransaction(tx);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;

    setIsDeleting(true);
    try {
      const res = await transactionService.deleteTransaction(deletingTransaction._id);
      if (res.ok && res.data.success) {
        setDeletingTransaction(null);
        showToast('Transaction deleted successfully!');
        fetchTransactions();
      } else {
        alert(res.data?.message || 'Unable to delete transaction.');
      }
    } catch (err) {
      alert('Failed to delete transaction.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="transactions-page-container">
      <PageHeader
        title="Transaction Management"
        subtitle="Track, categorize, and filter your income and expenses effortlessly."
        phaseBadge="Phase 4 Categorized"
        icon="💳"
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="toast-notification">
          <span>✅ {toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchTransactions}>Retry</button>
        </div>
      )}

      {/* Summary Header Metrics */}
      <div className="tx-summary-grid">
        <div className="tx-summary-card balance">
          <span className="summary-label">Net Balance</span>
          <span className={`summary-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
            ₹{summary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="tx-summary-card income">
          <span className="summary-label">Total Income</span>
          <span className="summary-value positive">
            +₹{summary.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="tx-summary-card expense">
          <span className="summary-label">Total Expenses</span>
          <span className="summary-value negative">
            -₹{summary.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Category Expense Summary Section */}
      <CategorySummary transactions={transactions} />

      {/* Control Action Bar (Add, Search, Combined Filters) */}
      <div className="tx-controls-bar">
        <button className="btn-add-tx" onClick={handleOpenAddModal}>
          ➕ Add Transaction
        </button>

        <div className="tx-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn-clear-search" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        {/* Category Filter Dropdown */}
        <CategoryFilter
          selectedCategory={categoryFilter}
          onChangeCategory={setCategoryFilter}
        />

        {/* Type Filter Buttons */}
        <div className="tx-filter-buttons">
          <button
            className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn income ${typeFilter === 'income' ? 'active' : ''}`}
            onClick={() => setTypeFilter('income')}
          >
            💰 Income
          </button>
          <button
            className={`filter-btn expense ${typeFilter === 'expense' ? 'active' : ''}`}
            onClick={() => setTypeFilter('expense')}
          >
            💸 Expense
          </button>
        </div>
      </div>

      {/* Transactions Data Table / List */}
      <div className="tx-table-container">
        {loading ? (
          <div className="tx-loading-state">
            <span className="spinner-lg"></span>
            <p>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="tx-empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Transactions Found</h3>
            <p>
              {transactions.length === 0
                ? 'No transactions yet. Start tracking your finances by adding your first transaction.'
                : 'No transactions match your search and filter criteria.'}
            </p>
            {transactions.length === 0 && (
              <button className="btn-add-tx" onClick={handleOpenAddModal}>
                ➕ Add Transaction
              </button>
            )}
          </div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx._id}>
                  <td className="tx-date">
                    {new Date(tx.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td>
                    {/* Reusable Category Badge */}
                    <CategoryBadge category={tx.category} />
                  </td>
                  <td className="tx-desc">
                    <strong>{tx.description || tx.category}</strong>
                    {tx.notes && <small className="tx-notes">{tx.notes}</small>}
                  </td>
                  <td>
                    <span className="payment-badge">{tx.paymentMethod || 'Other'}</span>
                  </td>
                  <td>
                    <span className={`type-badge ${tx.type}`}>
                      {tx.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td className={`tx-amount text-right ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}₹
                    {Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-center">
                    <div className="action-buttons">
                      <button
                        className="btn-action edit"
                        onClick={() => handleOpenEditModal(tx)}
                        title="Edit Transaction & Category"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => handleOpenDeleteModal(tx)}
                        title="Delete Transaction"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTransaction}
        initialData={editingTransaction}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemDescription={deletingTransaction?.description || deletingTransaction?.category}
      />
    </div>
  );
};

export default TransactionsPage;
