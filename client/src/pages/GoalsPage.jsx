import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { GoalSummary } from '../components/GoalSummary';
import { GoalCard } from '../components/GoalCard';
import { GoalModal } from '../components/GoalModal';
import { GoalPlanModal } from '../components/GoalPlanModal';
import { GoalProgressModal } from '../components/GoalProgressModal';
import { DeleteGoalModal } from '../components/DeleteGoalModal';
import * as goalService from '../services/goalService';
import './GoalsPage.css';

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Paused', value: 'Paused' }
];

const PRIORITY_FILTER_OPTIONS = [
  { label: 'All Priorities', value: 'all' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' }
];

export const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Goal Plan modal state
  const [planningGoalId, setPlanningGoalId] = useState(null);

  // Progress update modal state
  const [progressGoal, setProgressGoal] = useState(null);

  // Delete modal state
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await goalService.getGoals({
        status: statusFilter,
        priority: priorityFilter
      });
      if (res.ok && res.data.success) {
        setGoals(res.data.data || []);
        setSummary(res.data.summary || {});
      } else {
        setError(res.data?.message || res.error || 'Unable to load your goals.');
      }
    } catch (err) {
      console.error('Fetch goals error:', err);
      setError('Unable to load your goals. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleOpenPlanModal = (goal) => {
    setPlanningGoalId(goal._id);
  };

  const handleOpenProgressModal = (goal) => {
    setProgressGoal(goal);
  };

  const handleOpenDeleteModal = (goal) => {
    setDeletingGoal(goal);
  };

  const handleSaveGoal = async (formData, setModalError) => {
    setIsSubmitting(true);
    try {
      let res;
      if (editingGoal) {
        res = await goalService.updateGoal(editingGoal._id, formData);
      } else {
        res = await goalService.createGoal(formData);
      }

      if (res.ok && res.data.success) {
        showToast(editingGoal ? 'Goal updated successfully!' : 'Goal created successfully!');
        setIsModalOpen(false);
        setEditingGoal(null);
        fetchGoals();
      } else {
        setModalError(res.data?.message || res.error || 'Unable to save goal.');
      }
    } catch (err) {
      console.error('Save goal error:', err);
      setModalError('Server error while saving goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProgress = async (id, currentAmount, setModalError) => {
    setIsSubmitting(true);
    try {
      const res = await goalService.updateGoalProgress(id, currentAmount);
      if (res.ok && res.data.success) {
        showToast('Goal savings updated!');
        setProgressGoal(null);
        fetchGoals();
      } else {
        setModalError(res.data?.message || res.error || 'Unable to update progress.');
      }
    } catch (err) {
      console.error('Update progress error:', err);
      setModalError('Server error while updating progress.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    setIsDeleting(true);
    try {
      const res = await goalService.deleteGoal(id);
      if (res.ok && res.data.success) {
        showToast('Goal deleted successfully.');
        setDeletingGoal(null);
        fetchGoals();
      } else {
        setError(res.data?.message || res.error || 'Unable to delete goal.');
      }
    } catch (err) {
      console.error('Delete goal error:', err);
      setError('Failed to delete goal. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasNoGoalsAtAll = !loading && goals.length === 0 && statusFilter === 'all' && priorityFilter === 'all';

  return (
    <div className="goals-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="goals-toast">
          <span>✅ {toastMessage}</span>
        </div>
      )}

      {/* Header & CTA */}
      <div className="goals-header-wrapper">
        <PageHeader
          title="Financial Goals"
          subtitle="Create, track, and achieve target financial milestones with deterministic goal planning."
          phaseBadge="Phase 10 Engine"
          icon="🏆"
        />

        <button className="btn-create-goal" onClick={handleOpenCreateModal}>
          + Create Goal
        </button>
      </div>

      {/* Top Metrics Summary */}
      {!error && <GoalSummary summary={summary} />}

      {/* Filter Toolbar */}
      <div className="goals-filter-bar">
        <div className="filter-group">
          <label>Status:</label>
          <div className="status-filter-pills">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`status-filter-pill ${statusFilter === opt.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="priority-filter">Priority:</label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            {PRIORITY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="goals-error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <h4>Error Loading Goals</h4>
              <p>{error}</p>
            </div>
          </div>
          <button className="btn-retry-goals" onClick={fetchGoals}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Skeleton Loading */}
      {loading && (
        <div className="goals-skeleton-grid">
          <div className="skeleton-goal-card" />
          <div className="skeleton-goal-card" />
          <div className="skeleton-goal-card" />
        </div>
      )}

      {/* Goals Grid & Empty State */}
      {!loading && !error && (
        <>
          {goals.length === 0 ? (
            <div className="goals-empty-state">
              <div className="empty-icon">🏆</div>
              <h3>{hasNoGoalsAtAll ? 'No financial goals yet' : 'No matching goals found'}</h3>
              <p>
                {hasNoGoalsAtAll
                  ? 'Create a goal to start tracking something you are saving for (Emergency Fund, Laptop, Travel, etc.).'
                  : 'Try adjusting your status or priority filters to see existing financial goals.'}
              </p>
              {hasNoGoalsAtAll && (
                <button className="btn-empty-create-goal" onClick={handleOpenCreateModal}>
                  + Create Goal
                </button>
              )}
            </div>
          ) : (
            <div className="goals-grid">
              {goals.map((goal) => (
                <GoalCard
                  key={goal._id}
                  goal={goal}
                  onPlan={handleOpenPlanModal}
                  onUpdateProgress={handleOpenProgressModal}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveGoal}
        editingGoal={editingGoal}
        isSubmitting={isSubmitting}
      />

      <GoalPlanModal
        isOpen={Boolean(planningGoalId)}
        onClose={() => setPlanningGoalId(null)}
        goalId={planningGoalId}
      />

      <GoalProgressModal
        isOpen={Boolean(progressGoal)}
        onClose={() => setProgressGoal(null)}
        onSubmit={handleSaveProgress}
        goal={progressGoal}
        isSubmitting={isSubmitting}
      />

      <DeleteGoalModal
        isOpen={Boolean(deletingGoal)}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleDeleteGoal}
        goal={deletingGoal}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default GoalsPage;
