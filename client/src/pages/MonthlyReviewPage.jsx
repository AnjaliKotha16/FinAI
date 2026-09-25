import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { monthlyReviewService } from '../services/monthlyReviewService';
import './MonthlyReviewPage.css';

// Helper to generate a list of available months for selection (last 12 months)
const generateMonthOptions = () => {
  const options = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }

  return options;
};

export const MonthlyReviewPage = () => {
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [reviewData, setReviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchReview(selectedMonth);
  }, [selectedMonth]);

  const fetchReview = async (monthStr) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await monthlyReviewService.getMonthlyReview(monthStr);

      if (res.ok && res.data?.success) {
        setReviewData(res.data.data);
      } else {
        setErrorMsg(res.data?.message || 'Failed to load monthly review.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to monthly review service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="review-container">
      <PageHeader
        title="Monthly Financial Review"
        subtitle="Comprehensive review of your financial activity, month-over-month trends, and goal progress."
        phaseBadge="Phase 14"
        icon="📅"
      />

      {/* Month Selection & Print Bar */}
      <div className="review-controls-bar">
        <div className="month-selector-group">
          <label className="month-select-label">Select Review Month:</label>
          <select
            className="month-select-dropdown"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button className="print-btn" onClick={handlePrint}>
          <span>🖨️</span> Print / Export Review
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Preparing your monthly financial review...
        </div>
      ) : errorMsg ? (
        <div className="review-section-box" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
          <h3>Unable to load review</h3>
          <p style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
          <button className="print-btn" style={{ margin: '16px auto 0' }} onClick={() => fetchReview(selectedMonth)}>
            Retry
          </button>
        </div>
      ) : !reviewData ? null : (
        <>
          {/* Top Summary Stats Cards */}
          <div className="review-stats-grid">
            <div className="review-stat-card">
              <div className="stat-header">
                <span>TOTAL INCOME</span>
                <span>💵</span>
              </div>
              <div className="stat-value-large positive">
                ₹{reviewData.summary.income.toLocaleString()}
              </div>
              <div className="stat-subtitle">
                {reviewData.comparison.income.text !== 'No change' ? `vs ${reviewData.period.prevLabel}: ${reviewData.comparison.income.text}` : 'Recorded for selected month'}
              </div>
            </div>

            <div className="review-stat-card">
              <div className="stat-header">
                <span>TOTAL EXPENSES</span>
                <span>💳</span>
              </div>
              <div className="stat-value-large">
                ₹{reviewData.summary.expenses.toLocaleString()}
              </div>
              <div className="stat-subtitle">
                {reviewData.comparison.expenses.text !== 'No change' ? `vs ${reviewData.period.prevLabel}: ${reviewData.comparison.expenses.text}` : 'Recorded for selected month'}
              </div>
            </div>

            <div className="review-stat-card">
              <div className="stat-header">
                <span>NET SAVINGS</span>
                <span>💰</span>
              </div>
              <div className={`stat-value-large ${reviewData.summary.savings >= 0 ? 'positive' : 'negative'}`}>
                ₹{reviewData.summary.savings.toLocaleString()}
              </div>
              <div className="stat-subtitle">Income minus expenses</div>
            </div>

            <div className="review-stat-card">
              <div className="stat-header">
                <span>SAVINGS RATE</span>
                <span>📊</span>
              </div>
              <div className="stat-value-large positive">
                {reviewData.summary.savingsRate !== null ? `${reviewData.summary.savingsRate}%` : 'N/A'}
              </div>
              <div className="stat-subtitle">{reviewData.summary.savingsRateText}</div>
            </div>
          </div>

          {/* AI Executive Summary & Highlights */}
          <div className="review-section-box">
            <h3 className="section-box-title">
              <span>🤖</span> Executive Review & Highlights ({reviewData.period.label})
            </h3>

            {reviewData.aiSummary && (
              <div className="ai-summary-bubble">
                {reviewData.aiSummary}
              </div>
            )}

            {reviewData.highlights.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Factual Monthly Highlights:
                </h4>
                <ul className="highlights-list">
                  {reviewData.highlights.map((item, idx) => (
                    <li key={idx} className="highlight-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Spending Category Breakdown */}
          <div className="review-section-box">
            <h3 className="section-box-title">
              <span>💳</span> Category Spending Breakdown
            </h3>

            {reviewData.categoryBreakdown.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                No expense transactions were recorded for {reviewData.period.label}.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Amount Spent</th>
                      <th>% of Expenses</th>
                      <th>vs Previous Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewData.categoryBreakdown.map((cat) => (
                      <tr key={cat.category}>
                        <td style={{ fontWeight: 600 }}>{cat.category}</td>
                        <td>₹{cat.amount.toLocaleString()}</td>
                        <td>{cat.percentageOfExpenses}%</td>
                        <td>
                          <span className={`mom-tag ${cat.momComparison.status}`}>
                            {cat.momComparison.text}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Budget Performance */}
          <div className="review-section-box">
            <h3 className="section-box-title">
              <span>🎯</span> Budget Performance ({reviewData.period.label})
            </h3>

            {reviewData.budgetPerformance.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                No applicable budgets were active during {reviewData.period.label}.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Budget Category</th>
                      <th>Limit</th>
                      <th>Spent</th>
                      <th>Remaining</th>
                      <th>Utilization</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewData.budgetPerformance.map((b) => (
                      <tr key={b.budgetId}>
                        <td style={{ fontWeight: 600 }}>{b.category}</td>
                        <td>₹{b.budgetLimit.toLocaleString()}</td>
                        <td>₹{b.spentAmount.toLocaleString()}</td>
                        <td>₹{b.remainingAmount.toLocaleString()}</td>
                        <td>{b.utilizationPercentage}%</td>
                        <td>
                          <span className={`mom-tag ${b.status === 'Exceeded' ? 'increased' : b.status === 'Near Limit' ? 'neutral' : 'decreased'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Month-Over-Month Comparison */}
          <div className="review-section-box">
            <h3 className="section-box-title">
              <span>📈</span> Month-Over-Month Comparison ({reviewData.period.prevLabel} ➔ {reviewData.period.label})
            </h3>

            <div className="comparison-grid">
              <div className="comparison-card">
                <span className="comp-title">Income Change</span>
                <span className="comp-val">{reviewData.comparison.income.text}</span>
              </div>
              <div className="comparison-card">
                <span className="comp-title">Expenses Change</span>
                <span className="comp-val">{reviewData.comparison.expenses.text}</span>
              </div>
              <div className="comparison-card">
                <span className="comp-title">Net Savings Change</span>
                <span className="comp-val">{reviewData.comparison.savings.text}</span>
              </div>
              <div className="comparison-card">
                <span className="comp-title">Savings Rate Change</span>
                <span className="comp-val">{reviewData.comparison.savingsRate.text}</span>
              </div>
            </div>
          </div>

          {/* Goal Progress */}
          <div className="review-section-box">
            <h3 className="section-box-title">
              <span>🏆</span> Goal Progress Review
            </h3>

            {reviewData.goalProgress.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                You have not created any active financial goals yet.
              </p>
            ) : (
              <div className="goals-review-grid">
                {reviewData.goalProgress.map((g) => (
                  <div key={g.goalId} className="goal-review-card">
                    <div className="goal-title-row">
                      <span>{g.name}</span>
                      <span className={`mom-tag ${g.status === 'On Track' ? 'decreased' : 'increased'}`}>
                        {g.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      ₹{g.currentAmount.toLocaleString()} of ₹{g.targetAmount.toLocaleString()} saved ({g.progressPercentage}%)
                    </div>
                    <div className="goal-progress-bar-bg">
                      <div className="goal-progress-fill" style={{ width: `${Math.min(100, g.progressPercentage)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Investment & Cushion Status */}
          {reviewData.investmentSummary && (
            <div className="review-section-box">
              <h3 className="section-box-title">
                <span>🚀</span> Investment Profile & Emergency Cushion
              </h3>

              <div className="comparison-grid">
                <div className="comparison-card">
                  <span className="comp-title">Risk Preference</span>
                  <span className="comp-val">{reviewData.investmentSummary.riskPreference}</span>
                </div>
                <div className="comparison-card">
                  <span className="comp-title">Investment Horizon</span>
                  <span className="comp-val">{reviewData.investmentSummary.investmentHorizon}</span>
                </div>
                <div className="comparison-card">
                  <span className="comp-title">Emergency Cushion</span>
                  <span className="comp-val">{reviewData.investmentSummary.emergencyFundStatus}</span>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Disclaimer */}
          <div className="insights-disclaimer-footer" style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', padding: '12px' }}>
            {reviewData.disclaimer}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyReviewPage;
