import React from 'react';
import './HealthScoreCard.css';

export const HealthScoreCard = ({ healthScore = {} }) => {
  const score = healthScore.score || 0;
  const rating = healthScore.rating || 'Fair';
  const breakdown = healthScore.breakdown || {
    savingsRateScore: 0,
    expenseRatioScore: 0,
    budgetDisciplineScore: 0,
    cashFlowScore: 0
  };
  const disclaimer = healthScore.disclaimer || 'Application-generated metric based strictly on recorded numerical data. Not financial advice.';

  // Determine gauge color based on rating
  let ratingClass = 'fair';
  if (rating === 'Excellent') ratingClass = 'excellent';
  else if (rating === 'Good') ratingClass = 'good';
  else if (rating === 'Needs Attention') ratingClass = 'attention';

  // Calculate SVG strokeDashoffset for 0-100 score circle
  const strokeDasharray = 283; // 2 * Math.PI * 45
  const strokeDashoffset = strokeDasharray - (strokeDasharray * score) / 100;

  return (
    <div className="health-score-card">
      <div className="score-top-header">
        <div className="score-title-area">
          <h3>Financial Health Score</h3>
          <span className={`rating-pill ${ratingClass}`}>{rating}</span>
        </div>
        <span className="score-tag">Deterministic Analysis</span>
      </div>

      <div className="score-body-grid">
        {/* Circular Score Gauge */}
        <div className="gauge-container">
          <svg className="score-gauge-svg" viewBox="0 0 100 100">
            <circle
              className="gauge-bg"
              cx="50"
              cy="50"
              r="45"
            />
            <circle
              className={`gauge-fill ${ratingClass}`}
              cx="50"
              cy="50"
              r="45"
              style={{
                strokeDasharray: 283,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          <div className="score-center-text">
            <span className="score-number">{score}</span>
            <span className="score-max">/100</span>
          </div>
        </div>

        {/* Documented Breakdown Progress Bars */}
        <div className="breakdown-list">
          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-name">💰 Savings Rate</span>
              <span className="breakdown-score">{breakdown.savingsRateScore} / 30 pts</span>
            </div>
            <div className="breakdown-track">
              <div
                className="breakdown-fill green"
                style={{ width: `${(breakdown.savingsRateScore / 30) * 100}%` }}
              />
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-name">📉 Expense Control</span>
              <span className="breakdown-score">{breakdown.expenseRatioScore} / 30 pts</span>
            </div>
            <div className="breakdown-track">
              <div
                className="breakdown-fill blue"
                style={{ width: `${(breakdown.expenseRatioScore / 30) * 100}%` }}
              />
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-name">🎯 Budget Discipline</span>
              <span className="breakdown-score">{breakdown.budgetDisciplineScore} / 20 pts</span>
            </div>
            <div className="breakdown-track">
              <div
                className="breakdown-fill yellow"
                style={{ width: `${(breakdown.budgetDisciplineScore / 20) * 100}%` }}
              />
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <span className="breakdown-name">🛡️ Cash Flow Stability</span>
              <span className="breakdown-score">{breakdown.cashFlowScore} / 20 pts</span>
            </div>
            <div className="breakdown-track">
              <div
                className="breakdown-fill purple"
                style={{ width: `${(breakdown.cashFlowScore / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Informational Disclaimer */}
      <div className="score-disclaimer">
        ℹ️ {disclaimer}
      </div>
    </div>
  );
};

export default HealthScoreCard;
