import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { insightService } from '../services/insightService';
import './InsightsPage.css';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Insights', icon: '⚡' },
  { id: 'spending', label: 'Spending', icon: '💳' },
  { id: 'budget', label: 'Budgets', icon: '🎯' },
  { id: 'savings', label: 'Savings', icon: '💰' },
  { id: 'goals', label: 'Goals', icon: '🏆' },
  { id: 'investments', label: 'Investments', icon: '🚀' }
];

export const InsightsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState({ totalCount: 0, warningCount: 0, positiveCount: 0, infoCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchInsights(activeTab);
  }, [activeTab]);

  const fetchInsights = async (category) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await insightService.getInsights(category);

      if (res.ok && res.data?.data) {
        setInsights(res.data.data.insights || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      } else {
        setErrorMsg(res.data?.message || 'Failed to load financial insights.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to financial insights service.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('spending')) return '💳';
    if (c.includes('budget')) return '🎯';
    if (c.includes('savings')) return '💰';
    if (c.includes('goal')) return '🏆';
    if (c.includes('investment')) return '🚀';
    return '💡';
  };

  const getSeverityPill = (severity) => {
    if (severity === 'warning') return <span className="severity-pill warning">⚠️ Attention</span>;
    if (severity === 'positive') return <span className="severity-pill positive">✨ Achievement</span>;
    return <span className="severity-pill info">ℹ️ Observation</span>;
  };

  return (
    <div className="insights-container">
      <PageHeader
        title="Personalized Financial Insights"
        subtitle="Proactive, data-driven analysis of your spending, budgets, savings, and financial goals."
        phaseBadge="Phase 13"
        icon="💡"
      />

      {/* Summary Counters */}
      <div className="insights-summary-bar">
        <div className="summary-stat-card">
          <div className="stat-icon-wrapper total">⚡</div>
          <div>
            <div className="stat-val">{summary.totalCount}</div>
            <div className="stat-lbl">Active Insights</div>
          </div>
        </div>
        <div className="summary-stat-card">
          <div className="stat-icon-wrapper warning">⚠️</div>
          <div>
            <div className="stat-val">{summary.warningCount}</div>
            <div className="stat-lbl">Items Needing Review</div>
          </div>
        </div>
        <div className="summary-stat-card">
          <div className="stat-icon-wrapper positive">✨</div>
          <div>
            <div className="stat-val">{summary.positiveCount}</div>
            <div className="stat-lbl">Positive Milestones</div>
          </div>
        </div>
        <div className="summary-stat-card">
          <div className="stat-icon-wrapper info">ℹ️</div>
          <div>
            <div className="stat-val">{summary.infoCount}</div>
            <div className="stat-lbl">General Observations</div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="insights-nav-tabs">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`insight-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Analyzing your financial patterns...
        </div>
      ) : errorMsg ? (
        <div className="insights-empty-state">
          <div className="empty-icon">⚠️</div>
          <div className="empty-title">Unable to load insights</div>
          <div className="empty-subtitle">{errorMsg}</div>
          <button
            className="insight-tab-btn active"
            style={{ marginTop: '12px' }}
            onClick={() => fetchInsights(activeTab)}
          >
            Retry
          </button>
        </div>
      ) : insights.length === 0 ? (
        <div className="insights-empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">Not enough financial activity yet</div>
          <div className="empty-subtitle">
            Add more transactions, category budgets, or financial goals to receive personalized proactive insights.
          </div>
        </div>
      ) : (
        <div className="insights-grid">
          {insights.map((insight) => (
            <div key={insight.id} className={`insight-card severity-${insight.severity}`}>
              <div className="insight-card-header">
                <div className="insight-category-badge">
                  <span>{getCategoryIcon(insight.category)}</span>
                  <span>{insight.category}</span>
                </div>
                {getSeverityPill(insight.severity)}
              </div>

              <h3 className="insight-card-title">{insight.title}</h3>
              <p className="insight-card-desc">{insight.description}</p>

              <div className="insight-card-footer">
                <span>Grounding: Application Account Record</span>
                <span>
                  {insight.createdAt ? new Date(insight.createdAt).toLocaleDateString() : 'Realtime'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Persistent Disclaimer */}
      <div className="insights-disclaimer-footer">
        These insights are based on the financial information available in your account and are intended for educational and planning purposes only. They are not guaranteed financial outcomes or professional financial advice.
      </div>
    </div>
  );
};

export default InsightsPage;
