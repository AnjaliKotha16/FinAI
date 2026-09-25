import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { BudgetSummary } from '../components/BudgetSummary';
import { BudgetCard } from '../components/BudgetCard';
import { BudgetModal } from '../components/BudgetModal';
import { DeleteBudgetModal } from '../components/DeleteBudgetModal';
import { TRANSACTION_CATEGORIES } from '../utils/constants';
import * as budgetService from '../services/budgetService';
import './BudgetsPage.css';

const PERIOD_STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Current', value: 'current' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' }
];

export const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodStatusFilter, setPeriodStatusFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await budgetService.getBudgets({
        category: categoryFilter,
        periodStatus: periodStatusFilter
      });
      if (res.ok && res.data.success) {
        setBudgets(res.data.data || []);
        setSummary(res.data.summary || {});
      } else {
        setError(res.data?.message || res.error || 'Unable to load budgets.');
      }
    } catch (err) {
      console.error('Fetch budgets error:', err);
      setError('Unable to load budgets. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, periodStatusFilter]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (budget) => {
    setDeletingBudget(budget);
  };

  const handleSaveBudget = async (formData, setModalError) => {
    setIsSubmitting(true);
    try {
      let res;
      if (editingBudget) {
        res = await budgetService.updateBudget(editingBudget._id, formData);
      } else {
        res = await budgetService.createBudget(formData);
      }

      if (res.ok && res.data.success) {
        showToast(editingBudget ? 'Budget updated successfully!' : 'Budget created successfully!');
        setIsModalOpen(false);
        setEditingBudget(null);
        fetchBudgets();
      } else {
        const errorMsg = res.data?.message || res.error || 'Unable to save budget.';
        setModalError(errorMsg);
      }
    } catch (err) {
      console.error('Save budget error:', err);
      setModalError('Server error while saving budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    setIsDeleting(true);
    try {
      const res = await budgetService.deleteBudget(id);
      if (res.ok && res.data.success) {
        showToast('Budget deleted successfully.');
        setDeletingBudget(null);
        fetchBudgets();
      } else {
        setError(res.data?.message || res.error || 'Unable to delete budget.');
      }
    } catch (err) {
      console.error('Delete budget error:', err);
      setError('Failed to delete budget. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasNoBudgetsAtAll = !loading && budgets.length === 0 && categoryFilter === 'all' && periodStatusFilter === 'all';

  return (
    <div className="budgets-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="budgets-toast">
          <span>✅ {toastMessage}</span>
        </div>
      )}

      {/* Page Header & Action CTA */}
      <div className="budgets-header-wrapper">
        <PageHeader
          title="Budgets & Planning"
          subtitle="Set category-wise spending limits and monitor monthly budget health in real time."
          phaseBadge="Phase 7"
          icon="🎯"
        />

        <button className="btn-create-budget" onClick={handleOpenCreateModal}>
          + Create Budget
        </button>
      </div>

      {/* Top Metrics Summary */}
      {!error && <BudgetSummary summary={summary} />}

      {/* Filter Toolbar */}
      <div className="budgets-filter-bar">
        <div className="filter-group">
          <label htmlFor="category-filter">Category:</label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {TRANSACTION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Period Status:</label>
          <div className="status-filter-pills">
            {PERIOD_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`status-filter-pill ${periodStatusFilter === opt.value ? 'active' : ''}`}
                onClick={() => setPeriodStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="budgets-error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <h4>Error Loading Budgets</h4>
              <p>{error}</p>
            </div>
          </div>
          <button className="btn-retry-budgets" onClick={fetchBudgets}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="budgets-skeleton-grid">
          <div className="skeleton-budget-card" />
          <div className="skeleton-budget-card" />
          <div className="skeleton-budget-card" />
        </div>
      )}

      {/* Main Budget Grid */}
      {!loading && !error && (
        <>
          {budgets.length === 0 ? (
            <div className="budgets-empty-state">
              <div className="empty-icon">🎯</div>
              <h3>{hasNoBudgetsAtAll ? 'No budgets created yet' : 'No matching budgets found'}</h3>
              <p>
                {hasNoBudgetsAtAll
                  ? 'Set up category spending limits to track your monthly expenses and avoid overspending.'
                  : 'Try adjusting your category or period status filters to see existing budgets.'}
              </p>
              {hasNoBudgetsAtAll && (
                <button className="btn-empty-create" onClick={handleOpenCreateModal}>
                  + Create Budget
                </button>
              )}
            </div>
          ) : (
            <div className="budgets-grid">
              {budgets.map((b) => (
                <BudgetCard
                  key={b._id}
                  budget={b}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Dialogs */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveBudget}
        editingBudget={editingBudget}
        isSubmitting={isSubmitting}
      />

      <DeleteBudgetModal
        isOpen={Boolean(deletingBudget)}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleDeleteBudget}
        budget={deletingBudget}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default BudgetsPage;
