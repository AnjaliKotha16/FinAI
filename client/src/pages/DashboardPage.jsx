import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { SummaryCard } from '../components/SummaryCard';
import { IncomeExpenseChart } from '../components/IncomeExpenseChart';
import { ExpenseCategoryChart } from '../components/ExpenseCategoryChart';
import { CategoryBadge } from '../components/CategoryBadge';
import { CATEGORY_ICONS } from '../utils/constants';
import * as analyticsService from '../services/analyticsService';
import * as budgetService from '../services/budgetService';
import * as goalService from '../services/goalService';
import { insightService } from '../services/insightService';
import './DashboardPage.css';

const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' }
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [activeBudgets, setActiveBudgets] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [summaryInsights, setSummaryInsights] = useState([]);

  const fetchDashboardData = useCallback(async (selectedPeriod) => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsService.getDashboardData(selectedPeriod);
      if (res.ok && res.data.success) {
        setDashboardData(res.data.data);
      } else {
        setError(res.data?.message || res.error || 'Unable to load your financial summary. Please try again.');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Unable to load your financial summary. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBudgetsOverview = useCallback(async () => {
    try {
      const res = await budgetService.getBudgets({ periodStatus: 'current' });
      if (res.ok && res.data.success) {
        setActiveBudgets(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch budgets overview error:', err);
    }
  }, []);

  const fetchGoalsOverview = useCallback(async () => {
    try {
      const res = await goalService.getGoals({ status: 'Active' });
      if (res.ok && res.data.success) {
        setActiveGoals(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch goals overview error:', err);
    }
  }, []);

  const fetchInsightsSummary = useCallback(async () => {
    try {
      const res = await insightService.getInsightsSummary();
      if (res.ok && res.data.success) {
        setSummaryInsights(res.data.data.summaryInsights || []);
      }
    } catch (err) {
      console.error('Fetch insights summary error:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(period);
    fetchBudgetsOverview();
    fetchGoalsOverview();
    fetchInsightsSummary();
  }, [period, fetchDashboardData, fetchBudgetsOverview, fetchGoalsOverview, fetchInsightsSummary]);

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod !== period) {
      setPeriod(newPeriod);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const summary = dashboardData?.summary || {
    income: dashboardData?.income || 0,
    expenses: dashboardData?.expenses || 0,
    balance: dashboardData?.balance || 0,
    savings: dashboardData?.savings || 0
  };

  const recentTransactions = dashboardData?.recentTransactions || [];
  const expenseByCategory = dashboardData?.expenseByCategory || [];
  const hasNoData = dashboardData && (dashboardData.allTimeTransactionCount === 0 || (recentTransactions.length === 0 && dashboardData.totalTransactionCount === 0));

  return (
    <div className="dashboard-page-container">
      {/* Page Header with Time Period Selector */}
      <div className="dashboard-header-wrapper">
        <PageHeader
          title={`Welcome back, ${user?.name || 'User'}!`}
          subtitle="Here is a real-time overview of your personal financial situation."
          phaseBadge="Financial Overview"
          icon="📊"
        />

        {/* Time Period Selector Pills */}
        <div className="period-selector-container">
          <span className="period-label">Period:</span>
          <div className="period-pills">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`period-pill ${period === opt.value ? 'active' : ''}`}
                onClick={() => handlePeriodChange(opt.value)}
                disabled={loading}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message with Retry */}
      {error && (
        <div className="dashboard-error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div className="error-text">
              <h4>Error Loading Dashboard</h4>
              <p>{error}</p>
            </div>
          </div>
          <button className="btn-retry" onClick={() => fetchDashboardData(period)}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !dashboardData && (
        <div className="dashboard-skeleton">
          <div className="skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
          <div className="skeleton-charts-grid">
            <div className="skeleton-chart" />
            <div className="skeleton-chart" />
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!loading && dashboardData && (
        <>
          {/* Summary Metric Cards */}
          <div className="summary-cards-grid">
            <SummaryCard
              title="Total Income"
              amount={summary.income}
              icon="💰"
              type="income"
              subtitle={`Income for ${PERIOD_OPTIONS.find((p) => p.value === period)?.label.toLowerCase()}`}
            />
            <SummaryCard
              title="Total Expenses"
              amount={summary.expenses}
              icon="💸"
              type="expense"
              subtitle={`Expenses for ${PERIOD_OPTIONS.find((p) => p.value === period)?.label.toLowerCase()}`}
            />
            <SummaryCard
              title="Current Balance"
              amount={summary.balance}
              icon="🏦"
              type="balance"
              subtitle="All-time net balance"
            />
            <SummaryCard
              title="Net Savings"
              amount={summary.savings}
              icon="🎯"
              type="savings"
              subtitle={`Savings for ${PERIOD_OPTIONS.find((p) => p.value === period)?.label.toLowerCase()}`}
            />
          </div>

          {/* Charts Row */}
          <div className="dashboard-charts-grid">
            <IncomeExpenseChart
              income={summary.income}
              expenses={summary.expenses}
            />
            <ExpenseCategoryChart
              categoryData={expenseByCategory}
            />
          </div>

          {/* Phase 9: Financial Goals Overview Widget Section */}
          <div className="dashboard-goals-overview-card">
            <div className="recent-transactions-header">
              <div className="title-area">
                <h3>Financial Goals</h3>
                <span className="recent-badge">Milestone Progress</span>
              </div>
              <Link to="/goals" className="btn-view-all">
                View All Goals →
              </Link>
            </div>

            {activeGoals.length === 0 ? (
              <div className="dash-budget-empty">
                <span>🏆 No active financial goals created yet.</span>
                <Link to="/goals" className="btn-dash-create-budget">
                  + Create a Goal
                </Link>
              </div>
            ) : (
              <div className="dash-budget-list">
                {activeGoals.slice(0, 3).map((g) => {
                  const pct = Math.min(g.progressPercentage || 0, 100);
                  return (
                    <div key={g._id} className="dash-budget-item">
                      <div className="dash-budget-info">
                        <span className="dash-budget-name">
                          <span className="dash-budget-icon">🏆</span>
                          <strong>{g.name}</strong>
                        </span>
                        <span className="dash-budget-amounts">
                          ₹{(g.currentAmount || 0).toLocaleString('en-IN')} / ₹{(g.targetAmount || 0).toLocaleString('en-IN')} ({pct}%)
                        </span>
                      </div>
                      <div className="dash-budget-track">
                        <div
                          className="dash-budget-fill good"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Phase 7: Budget Overview Widget Section */}
          <div className="dashboard-budget-overview-card">
            <div className="recent-transactions-header">
              <div className="title-area">
                <h3>Budget Overview</h3>
                <span className="recent-badge">Spending Limits</span>
              </div>
              <Link to="/budgets" className="btn-view-all">
                View All Budgets →
              </Link>
            </div>

            {activeBudgets.length === 0 ? (
              <div className="dash-budget-empty">
                <span>🎯 No active budgets set.</span>
                <Link to="/budgets" className="btn-dash-create-budget">
                  + Create a Budget
                </Link>
              </div>
            ) : (
              <div className="dash-budget-list">
                {activeBudgets.slice(0, 4).map((b) => {
                  const icon = CATEGORY_ICONS[b.category] || '📦';
                  const pct = Math.min(b.percentageUsed || 0, 100);
                  const isExceeded = b.status === 'Exceeded' || b.spent > b.amount;
                  return (
                    <div key={b._id} className="dash-budget-item">
                      <div className="dash-budget-info">
                        <span className="dash-budget-name">
                          <span className="dash-budget-icon">{icon}</span>
                          <strong>{b.category}</strong>
                        </span>
                        <span className={`dash-budget-amounts ${isExceeded ? 'exceeded' : ''}`}>
                          ₹{b.spent.toLocaleString('en-IN')} / ₹{b.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="dash-budget-track">
                        <div
                          className={`dash-budget-fill ${isExceeded ? 'exceeded' : b.percentageUsed >= 75 ? 'near' : 'good'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Personalized Financial Insights Section */}
          <div className="recent-transactions-card" style={{ marginBottom: '24px' }}>
            <div className="recent-transactions-header">
              <div className="title-area">
                <h3>💡 Personalized Financial Insights</h3>
                <span className="recent-badge">Proactive Analysis</span>
              </div>
              <Link to="/insights" className="btn-view-all">
                View All Insights →
              </Link>
            </div>

            {summaryInsights.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Add more transactions, budgets, or goals to receive proactive personalized insights.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                {summaryInsights.map((ins) => (
                  <div
                    key={ins.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderLeft: `3px solid ${ins.severity === 'warning' ? '#ef4444' : ins.severity === 'positive' ? '#10b981' : '#3b82f6'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{ins.title}</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ins.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions & Empty State Section */}
          <div className="recent-transactions-card">
            <div className="recent-transactions-header">
              <div className="title-area">
                <h3>Recent Transactions</h3>
                <span className="recent-badge">Latest Activity</span>
              </div>
              <Link to="/transactions" className="btn-view-all">
                View All Transactions →
              </Link>
            </div>

            {hasNoData ? (
              <div className="dashboard-empty-state">
                <div className="empty-icon">🪙</div>
                <h3>No transactions yet</h3>
                <p>Start tracking your finances by logging your first income or expense transaction.</p>
                <Link to="/transactions" className="btn-add-transaction">
                  + Add Transaction
                </Link>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="empty-icon">📅</div>
                <h3>No transactions in this period</h3>
                <p>There are no transactions recorded for the selected period ({PERIOD_OPTIONS.find((p) => p.value === period)?.label}).</p>
                <button className="btn-add-transaction" onClick={() => setPeriod('all')}>
                  View All-Time Data
                </button>
              </div>
            ) : (
              <div className="recent-table-responsive">
                <table className="recent-transactions-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr key={tx._id}>
                        <td>
                          <div className="tx-desc-cell">
                            <span className="tx-desc">{tx.description || tx.category}</span>
                            {tx.paymentMethod && (
                              <span className="tx-payment-method">{tx.paymentMethod}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <CategoryBadge category={tx.category} />
                        </td>
                        <td>
                          <span className={`type-tag ${tx.type}`}>
                            {tx.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className="tx-date-cell">{formatDate(tx.date)}</td>
                        <td className={`tx-amount-cell text-right ${tx.type}`}>
                          {tx.type === 'income' ? '+' : '-'}₹
                          {Number(tx.amount).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
