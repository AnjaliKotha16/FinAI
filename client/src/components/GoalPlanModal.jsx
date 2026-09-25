import React, { useState, useEffect } from 'react';
import * as goalService from '../services/goalService';
import './GoalPlanModal.css';

export const GoalPlanModal = ({ isOpen, onClose, goalId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planData, setPlanData] = useState(null);

  // Simulation state
  const [simulatedAdditional, setSimulatedAdditional] = useState(0);

  useEffect(() => {
    if (isOpen && goalId) {
      setLoading(true);
      setError('');
      setSimulatedAdditional(0);

      goalService.getGoalPlan(goalId)
        .then((res) => {
          if (res.ok && res.data.success) {
            setPlanData(res.data.data);
          } else {
            setError(res.data?.message || res.error || 'Unable to load goal plan.');
          }
        })
        .catch((err) => {
          console.error('Goal plan fetch error:', err);
          setError('Unable to calculate goal plan. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, goalId]);

  if (!isOpen) return null;

  const goal = planData?.goal || {};
  const summary = planData?.planSummary || {};
  const explanations = planData?.explanations || {};

  const requiredSavings = summary.requiredSavings || { monthly: 0, weekly: 0, daily: 0 };
  const timeRemaining = summary.timeRemaining || { daysRemaining: 0, weeksRemaining: 0, monthsRemaining: 0 };
  const currentPace = summary.currentPace || { monthlySavingsPace: 0 };
  const comparison = summary.comparison || {};
  const budgetContext = summary.budgetContext || {};

  const planStatus = summary.planStatus || 'On Track';
  let statusClass = 'on-track';
  if (planStatus === 'Needs Adjustment') statusClass = 'needs-adjustment';
  else if (planStatus === 'Target Date Passed') statusClass = 'date-passed';
  else if (planStatus === 'Completed') statusClass = 'completed';

  // Simulation calculations
  const addNum = parseFloat(simulatedAdditional) || 0;
  const simulatedTotalPace = currentPace.monthlySavingsPace + addNum;
  const remaining = summary.remainingAmount || 0;

  let simulatedEstText = '';
  if (summary.isCompleted) {
    simulatedEstText = 'Goal completed!';
  } else if (simulatedTotalPace <= 0) {
    simulatedEstText = 'Insufficient positive savings pace to estimate completion.';
  } else {
    const simMonths = Math.ceil(remaining / simulatedTotalPace);
    simulatedEstText = `Approx. ${simMonths} month${simMonths === 1 ? '' : 's'} to reach goal`;
  }

  const formatDate = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container goal-plan-modal-container">
        <div className="modal-header">
          <div className="header-title-row">
            <h2>🎯 Goal Planning Analysis</h2>
            <span className={`plan-status-pill ${statusClass}`}>{planStatus}</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && (
          <div className="plan-loading-box">
            <div className="plan-spinner" />
            <span>Calculating goal plan and analyzing savings pace...</span>
          </div>
        )}

        {error && (
          <div className="modal-error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {!loading && !error && planData && (
          <div className="plan-modal-body">
            {/* Goal Header Card */}
            <div className="plan-goal-summary-card">
              <div className="g-info-header">
                <h3>🏆 {goal.name}</h3>
                <span className="g-target-date">📅 Target: {formatDate(goal.targetDate)}</span>
              </div>
              <div className="g-amounts-row">
                <div className="g-amt-box">
                  <span className="lbl">Target</span>
                  <span className="val">₹{summary.targetAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="g-amt-box">
                  <span className="lbl">Saved</span>
                  <span className="val saved">₹{summary.currentAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="g-amt-box">
                  <span className="lbl">Remaining</span>
                  <span className="val remaining">₹{summary.remainingAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Required Savings Section */}
            <div className="plan-section">
              <h4 className="section-heading">📌 Required Savings Rate</h4>
              <p className="section-subtext">
                Calculated required savings without assuming market returns or investment growth.
              </p>

              <div className="required-cards-grid">
                <div className="req-card">
                  <span className="req-lbl">Monthly Required</span>
                  <span className="req-val">
                    ₹{requiredSavings.monthly?.toLocaleString('en-IN')} <small>/ mo</small>
                  </span>
                  <span className="req-sub">Over {timeRemaining.monthsRemaining} months</span>
                </div>

                <div className="req-card">
                  <span className="req-lbl">Weekly Required</span>
                  <span className="req-val">
                    ₹{requiredSavings.weekly?.toLocaleString('en-IN')} <small>/ wk</small>
                  </span>
                  <span className="req-sub">Over {timeRemaining.weeksRemaining} weeks</span>
                </div>

                <div className="req-card">
                  <span className="req-lbl">Daily Required</span>
                  <span className="req-val">
                    ₹{requiredSavings.daily?.toLocaleString('en-IN')} <small>/ day</small>
                  </span>
                  <span className="req-sub">Over {timeRemaining.daysRemaining} days</span>
                </div>
              </div>
            </div>

            {/* Current Pace vs Required Comparison */}
            <div className="plan-section">
              <h4 className="section-heading">⚡ Current Savings Pace Analysis</h4>
              <p className="section-subtext">{explanations.currentSavingsPace}</p>

              <div className="pace-comparison-box">
                <div className="pace-row">
                  <span className="pace-lbl">Recorded Monthly Savings Pace (Last 90 Days):</span>
                  <span className={`pace-val ${currentPace.monthlySavingsPace < 0 ? 'negative' : 'positive'}`}>
                    ₹{currentPace.monthlySavingsPace?.toLocaleString('en-IN')} / month
                  </span>
                </div>

                <div className="pace-row">
                  <span className="pace-lbl">Required Monthly Savings:</span>
                  <span className="pace-val">₹{requiredSavings.monthly?.toLocaleString('en-IN')} / month</span>
                </div>

                <div className={`comparison-result-banner ${comparison.isDeficit ? 'deficit' : 'surplus'}`}>
                  {comparison.isDeficit ? (
                    <>
                      ⚠️ <strong>Monthly Deficit: ₹{comparison.deficitAmount?.toLocaleString('en-IN')}</strong>
                      <span>Your current recorded savings pace is below the required monthly savings rate.</span>
                    </>
                  ) : (
                    <>
                      ✅ <strong>Monthly Surplus: ₹{comparison.surplusAmount?.toLocaleString('en-IN')}</strong>
                      <span>Your current savings pace is sufficient to reach your goal on time!</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Budget Context Integration */}
            {budgetContext.activeBudgetsCount > 0 && (
              <div className="plan-section">
                <h4 className="section-heading">💼 Budget Context</h4>
                <div className="budget-context-box">
                  <div className="b-context-row">
                    <span>Total Active Budgets: <strong>{budgetContext.activeBudgetsCount}</strong></span>
                    <span>Remaining Budget Buffer: <strong>₹{budgetContext.remainingBudgetBuffer?.toLocaleString('en-IN')}</strong></span>
                  </div>
                  {comparison.isDeficit && (
                    <p className="b-context-note">
                      💡 Your recorded spending buffer indicates potential room for optimization to close the ₹{comparison.deficitAmount?.toLocaleString('en-IN')} monthly deficit.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Goal Simulation Tool */}
            {!summary.isCompleted && (
              <div className="plan-section simulation-section">
                <h4 className="section-heading">🧪 Interactive Savings Simulator</h4>
                <p className="section-subtext">{explanations.simulationNotice}</p>

                <div className="simulation-box">
                  <div className="sim-control-group">
                    <label htmlFor="sim-additional-input">
                      Simulate Additional Monthly Savings (₹):
                    </label>
                    <input
                      id="sim-additional-input"
                      type="number"
                      step="500"
                      min="0"
                      placeholder="e.g. 3000"
                      value={simulatedAdditional}
                      onChange={(e) => setSimulatedAdditional(e.target.value)}
                    />
                  </div>

                  <div className="sim-results">
                    <div className="sim-result-row">
                      <span>Projected Total Monthly Savings:</span>
                      <strong>₹{simulatedTotalPace.toLocaleString('en-IN')} / mo</strong>
                    </div>
                    <div className="sim-result-row highlight">
                      <span>Simulated Timeline:</span>
                      <strong>{simulatedEstText}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Factual Explanations Footer */}
            <div className="plan-explanations-footer">
              <p>ℹ️ <strong>Required Monthly Savings:</strong> {explanations.requiredMonthlySavings}</p>
              <p>ℹ️ <strong>Projected Completion:</strong> {explanations.projectedCompletion}</p>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Close Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalPlanModal;
