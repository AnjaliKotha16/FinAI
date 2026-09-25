import React from 'react';
import './GoalSummary.css';

export const GoalSummary = ({ summary = {} }) => {
  const totalGoals = summary.totalGoalsCount || 0;
  const activeGoals = summary.activeGoalsCount || 0;
  const completedGoals = summary.completedGoalsCount || 0;
  const totalTarget = summary.totalTargetAmount || 0;
  const totalSaved = summary.totalSavedAmount || 0;
  const overallProgress = summary.overallProgressPercentage || 0;

  return (
    <div className="goal-summary-banner">
      <div className="summary-stat-card total-goals-card">
        <div className="stat-top">
          <span className="stat-label">Total Goals</span>
          <span className="stat-icon">🏆</span>
        </div>
        <div className="stat-value">{totalGoals}</div>
        <div className="stat-sub">{activeGoals} active, {completedGoals} completed</div>
      </div>

      <div className="summary-stat-card total-target-card">
        <div className="stat-top">
          <span className="stat-label">Total Target</span>
          <span className="stat-icon">🎯</span>
        </div>
        <div className="stat-value">
          ₹{totalTarget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="stat-sub">Combined milestone target</div>
      </div>

      <div className="summary-stat-card total-saved-card">
        <div className="stat-top">
          <span className="stat-label">Total Saved</span>
          <span className="stat-icon">💰</span>
        </div>
        <div className="stat-value saved-color">
          ₹{totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="stat-sub">Saved toward milestones</div>
      </div>

      <div className="summary-stat-card overall-progress-card">
        <div className="stat-top">
          <span className="stat-label">Overall Progress</span>
          <span className="stat-icon">📊</span>
        </div>
        <div className="stat-value progress-color">{overallProgress}%</div>
        <div className="overall-track">
          <div className="overall-fill" style={{ width: `${Math.min(overallProgress, 100)}%` }} />
        </div>
      </div>
    </div>
  );
};

export default GoalSummary;
