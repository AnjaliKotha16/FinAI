import React from 'react';
import './GoalCard.css';

export const GoalCard = ({ goal, onPlan, onUpdateProgress, onEdit, onDelete }) => {
  const {
    _id,
    name,
    description,
    targetAmount = 0,
    currentAmount = 0,
    remainingAmount = 0,
    progressPercentage = 0,
    targetDate,
    priority = 'Medium',
    status = 'Active',
    timeRemainingText,
    isTargetDatePassed,
    isCompleted
  } = goal;

  const formatDate = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const visibleProgress = Math.min(progressPercentage, 100);

  return (
    <div className={`goal-card ${status.toLowerCase()} ${isCompleted ? 'completed-card' : ''}`}>
      {/* Header */}
      <div className="goal-card-header">
        <div className="goal-title-area">
          <div className="goal-name-row">
            <h3>{name}</h3>
            <span className={`priority-tag ${priority.toLowerCase()}`}>{priority}</span>
          </div>
          <span className={`goal-status-badge ${status.toLowerCase()}`}>
            {isCompleted ? '🏆 Completed' : status}
          </span>
        </div>
        <div className="goal-actions">
          <button className="btn-action plan" onClick={() => onPlan(goal)} title="Plan Goal">
            🎯 Plan Goal
          </button>
          <button className="btn-action edit" onClick={() => onEdit(goal)} title="Edit Goal">
            ✏️
          </button>
          <button className="btn-action delete" onClick={() => onDelete(goal)} title="Delete Goal">
            🗑️
          </button>
        </div>
      </div>

      {/* Description */}
      {description && <p className="goal-desc">{description}</p>}

      {/* Progress Bar Section */}
      <div className="goal-progress-container">
        <div className="progress-text-row">
          <span className="progress-pct">{progressPercentage}% Saved</span>
          <span className="time-remaining">
            {isCompleted ? (
              <span className="badge-completed">Goal Accomplished!</span>
            ) : isTargetDatePassed ? (
              <span className="badge-date-passed">⚠️ Target date passed</span>
            ) : (
              `⏳ ${timeRemainingText}`
            )}
          </span>
        </div>
        <div className="goal-progress-track">
          <div
            className={`goal-progress-fill ${isCompleted ? 'completed' : priority.toLowerCase()}`}
            style={{ width: `${visibleProgress}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="goal-metrics-grid">
        <div className="g-metric-box">
          <span className="g-metric-lbl">Target</span>
          <span className="g-metric-val">₹{targetAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="g-metric-box">
          <span className="g-metric-lbl">Saved</span>
          <span className="g-metric-val saved">₹{currentAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="g-metric-box">
          <span className="g-metric-lbl">Remaining</span>
          <span className={`g-metric-val ${remainingAmount === 0 ? 'completed' : 'remaining'}`}>
            ₹{remainingAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Target Date Footer */}
      <div className="goal-footer">
        <span className="target-date-lbl">📅 Target Date: <strong>{formatDate(targetDate)}</strong></span>

        {!isCompleted && (
          <button className="btn-update-savings" onClick={() => onUpdateProgress(goal)}>
            + Update Savings
          </button>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
