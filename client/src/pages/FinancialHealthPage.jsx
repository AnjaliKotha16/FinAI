import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SummaryCard } from '../components/SummaryCard';
import { HealthScoreCard } from '../components/HealthScoreCard';
import { HealthTrendChart } from '../components/HealthTrendChart';
import * as financialHealthService from '../services/financialHealthService';
import * as goalService from '../services/goalService';
import './FinancialHealthPage.css';

const PERIOD_OPTIONS = [
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'This Year', value: 'year' }
];

export const FinancialHealthPage = () => {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [healthData, setHealthData] = useState(null);
  const [goalSummary, setGoalSummary] = useState({});

  const fetchHealthData = useCallback(async (selectedPeriod) => {
    setLoading(true);
    setError('');
    try {
      const res = await financialHealthService.getFinancialHealth(selectedPeriod);
      if (res.ok && res.data.success) {
        setHealthData(res.data.data);
      } else {
        setError(res.data?.message || res.error || 'Unable to load your financial health analysis. Please try again.');
      }
    } catch (err) {
      console.error('Financial Health fetch error:', err);
      setError('Unable to load your financial health analysis. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGoalMetrics = useCallback(async () => {
    try {
      const res = await goalService.getGoals();
      if (res.ok && res.data.success) {
        setGoalSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Fetch goal summary error:', err);
    }
  }, []);

  useEffect(() => {
    fetchHealthData(period);
    fetchGoalMetrics();
  }, [period, fetchHealthData, fetchGoalMetrics]);

  const metrics = healthData?.metrics || { income: 0, expenses: 0, savings: 0, savingsRate: 0 };
  const healthScore = healthData?.healthScore || {};
  const expenseTrend = healthData?.expenseTrend || {};
  const spendingConsistency = healthData?.spendingConsistency || {};
  const budgetPerformance = healthData?.budgetPerformance || {};
  const incomeAnalysis = healthData?.incomeAnalysis || {};
  const monthlyTrends = healthData?.monthlyTrends || [];
  const hasInsufficientData = healthData?.hasInsufficientData;

  return (
    <div className="health-page-container">
      {/* Header & Period Selector */}
      <div className="health-header-wrapper">
        <PageHeader
          title="Financial Health Analysis"
          subtitle="Deterministic, data-driven insights evaluating your income, spending, and budget discipline."
          phaseBadge="Phase 8 Insights"
          icon="🔍"
        />

        {/* Time Period Selector Pills */}
        <div className="health-period-selector">
          <span className="period-label">Period:</span>
          <div className="period-pills">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`period-pill ${period === opt.value ? 'active' : ''}`}
                onClick={() => setPeriod(opt.value)}
                disabled={loading}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="health-error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <h4>Error Loading Financial Health</h4>
              <p>{error}</p>
            </div>
          </div>
          <button className="btn-retry" onClick={() => fetchHealthData(period)}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !healthData && (
        <div className="health-skeleton">
          <div className="skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
          <div className="skeleton-score-box" />
        </div>
      )}

      {/* Main Content */}
      {!loading && healthData && (
        <>
          {hasInsufficientData ? (
            <div className="health-empty-state">
              <div className="empty-icon">🌱</div>
              <h3>Not enough data yet</h3>
              <p>
                Add income and expense transactions to generate your deterministic financial health analysis and score.
              </p>
              <Link to="/transactions" className="btn-empty-action">
                + Add First Transaction
              </Link>
            </div>
          ) : (
            <>
              {/* Summary Metric Cards */}
              <div className="summary-cards-grid">
                <SummaryCard
                  title="Total Income"
                  amount={metrics.income}
                  icon="💰"
                  type="income"
                  subtitle="Recorded earnings in period"
                />
                <SummaryCard
                  title="Total Expenses"
                  amount={metrics.expenses}
                  icon="💸"
                  type="expense"
                  subtitle="Recorded spending in period"
                />
                <SummaryCard
                  title="Net Savings"
                  amount={metrics.savings}
                  icon="🛡️"
                  type="savings"
                  subtitle="Income minus expenses"
                />
                <div className="dashboard-summary-card savings-rate-card">
                  <div className="card-top">
                    <span className="card-title">Savings Rate</span>
                    <span className="card-icon">📈</span>
                  </div>
                  <div className="card-amount savings-rate">
                    {metrics.savingsRate}%
                  </div>
                  <span className="card-subtitle">Percentage of income saved</span>
                </div>
              </div>

              {/* Health Score Component */}
              <HealthScoreCard healthScore={healthScore} />

              {/* Analytics & Consistency Grid */}
              <div className="health-details-grid">
                {/* Spending Analysis & Consistency */}
                <div className="health-card">
                  <div className="health-card-header">
                    <h3>📊 Spending & Consistency</h3>
                    <span className="info-tag">Expense Behavior</span>
                  </div>
                  <div className="health-card-body">
                    {/* Period Comparison */}
                    <div className="detail-row highlight-box">
                      <span className="detail-label">Expense Trend vs Prev Period</span>
                      <span className={`trend-badge ${expenseTrend.direction}`}>
                        {expenseTrend.direction === 'increased' ? '▲ +' : expenseTrend.direction === 'decreased' ? '▼ ' : '• '}
                        {expenseTrend.changePercentage}% (₹{Math.abs(expenseTrend.changeAmount).toLocaleString('en-IN')})
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Average Daily Spend</span>
                      <span className="detail-val">₹{spendingConsistency.avgDailySpend?.toLocaleString('en-IN')} / day</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Active Spending Days</span>
                      <span className="detail-val">{spendingConsistency.activeSpendDays} of {spendingConsistency.totalDays} days</span>
                    </div>

                    {spendingConsistency.highestSpendDay && (
                      <div className="detail-row">
                        <span className="detail-label">Highest Spend Day</span>
                        <span className="detail-val spent">
                          ₹{spendingConsistency.highestSpendDay.amount.toLocaleString('en-IN')} ({new Date(spendingConsistency.highestSpendDay.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Budget Performance Section */}
                <div className="health-card">
                  <div className="health-card-header">
                    <div className="title-area">
                      <h3>🎯 Budget Performance</h3>
                      <Link to="/budgets" className="sub-link">View Budgets →</Link>
                    </div>
                  </div>
                  <div className="health-card-body">
                    <div className="detail-row">
                      <span className="detail-label">Active Budgets Set</span>
                      <span className="detail-val">{budgetPerformance.activeBudgetsCount}</span>
                    </div>

                    <div className="budget-status-counts">
                      <div className="status-box green">
                        <span className="status-num">{budgetPerformance.withinLimitCount}</span>
                        <span className="status-lbl">Within Limit</span>
                      </div>
                      <div className="status-box yellow">
                        <span className="status-num">{budgetPerformance.nearLimitCount}</span>
                        <span className="status-lbl">Near Limit</span>
                      </div>
                      <div className="status-box red">
                        <span className="status-num">{budgetPerformance.exceededCount}</span>
                        <span className="status-lbl">Exceeded</span>
                      </div>
                    </div>

                    <div className="detail-row" style={{ marginTop: '0.5rem' }}>
                      <span className="detail-label">Overall Budget Utilization</span>
                      <span className="detail-val">{budgetPerformance.overallBudgetUtilization}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className={`progress-bar-fill ${budgetPerformance.overallBudgetUtilization > 100 ? 'red' : budgetPerformance.overallBudgetUtilization >= 75 ? 'yellow' : 'green'}`}
                        style={{ width: `${Math.min(budgetPerformance.overallBudgetUtilization, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Goal Milestones Section (Phase 9 Integration) */}
                <div className="health-card">
                  <div className="health-card-header">
                    <div className="title-area">
                      <h3>🏆 Goal Milestones</h3>
                      <Link to="/goals" className="sub-link">View Goals →</Link>
                    </div>
                  </div>
                  <div className="health-card-body">
                    <div className="detail-row">
                      <span className="detail-label">Active Goals</span>
                      <span className="detail-val">{goalSummary.activeGoalsCount || 0}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Completed Goals</span>
                      <span className="detail-val income">{goalSummary.completedGoalsCount || 0}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Target Saved</span>
                      <span className="detail-val income">
                        ₹{(goalSummary.totalSavedAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Overall Goal Progress</span>
                      <span className="detail-val">{goalSummary.overallProgressPercentage || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Income Consistency Section */}
                <div className="health-card">
                  <div className="health-card-header">
                    <h3>💵 Income Analysis</h3>
                    <span className="info-tag">Earning Inflows</span>
                  </div>
                  <div className="health-card-body">
                    <div className="detail-row">
                      <span className="detail-label">Income Inflow Count</span>
                      <span className="detail-val">{incomeAnalysis.incomeCount} transactions</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Average Income Inflow</span>
                      <span className="detail-val income">₹{incomeAnalysis.avgIncomeTx?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Highest Income Inflow</span>
                      <span className="detail-val income">₹{incomeAnalysis.maxIncomeAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Financial Trends Chart */}
              <HealthTrendChart trends={monthlyTrends} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialHealthPage;
