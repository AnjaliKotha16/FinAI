import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
  getInvestmentPlan,
  updateInvestmentProfile,
  simulateInvestment
} from '../services/investmentService';
import './InvestmentsPage.css';

export const InvestmentsPage = () => {
  const navigate = useNavigate();

  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planData, setPlanData] = useState(null);

  // Profile preferences state
  const [riskPreference, setRiskPreference] = useState('Moderate');
  const [investmentHorizon, setInvestmentHorizon] = useState('Medium Term');
  const [emergencyFundMonths, setEmergencyFundMonths] = useState(6);
  const [selectedGoalId, setSelectedGoalId] = useState('');

  // Simulation parameters state
  const [simInitialAmount, setSimInitialAmount] = useState(10000);
  const [simMonthlyContrib, setSimMonthlyContrib] = useState(5000);
  const [simYears, setSimYears] = useState(5);
  const [simReturnRate, setSimReturnRate] = useState(8);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Fetch initial plan data
  const fetchPlan = async (goalId = null) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInvestmentPlan(goalId);
      if (res.success && res.data) {
        setPlanData(res.data);
        if (res.data.profile) {
          setRiskPreference(res.data.profile.riskPreference || 'Moderate');
          setInvestmentHorizon(res.data.profile.investmentHorizon || 'Medium Term');
          setEmergencyFundMonths(res.data.profile.emergencyFundMonths || 6);
        }
        if (res.data.goalPlan?.goal?._id) {
          setSelectedGoalId(res.data.goalPlan.goal._id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load investment plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // Run simulation when sim inputs change
  const runSimulation = async (params) => {
    try {
      setSimLoading(true);
      const res = await simulateInvestment(params);
      if (res.success && res.data) {
        setSimResult(res.data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    runSimulation({
      initialAmount: simInitialAmount,
      monthlyContribution: simMonthlyContrib,
      years: simYears,
      annualReturnAssumption: simReturnRate
    });
  }, [simInitialAmount, simMonthlyContrib, simYears, simReturnRate]);

  // Handle updating profile preferences
  const handleUpdatePreference = async (updates) => {
    try {
      const updatedData = {
        riskPreference,
        investmentHorizon,
        emergencyFundMonths,
        ...updates
      };
      if (updates.riskPreference) setRiskPreference(updates.riskPreference);
      if (updates.investmentHorizon) setInvestmentHorizon(updates.investmentHorizon);
      if (updates.emergencyFundMonths) setEmergencyFundMonths(updates.emergencyFundMonths);

      await updateInvestmentProfile(updatedData);
      // Refresh plan to recalculate asset allocation & risk indicators
      fetchPlan(selectedGoalId);
    } catch (err) {
      console.error('Failed to update preference:', err);
    }
  };

  // Handle goal selection change
  const handleGoalChange = (e) => {
    const goalId = e.target.value;
    setSelectedGoalId(goalId);
    fetchPlan(goalId);
    handleUpdatePreference({ preferredGoalId: goalId || null });
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Investment Planning"
          subtitle="Plan investments around your financial goals, savings capacity, timeline, and risk preference."
          icon="🚀"
        />
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
          <div className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading your investment planning snapshot...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Investment Planning"
          subtitle="Plan investments around your financial goals, savings capacity, timeline, and risk preference."
          icon="🚀"
        />
        <div className="notice-box" style={{ borderColor: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', color: '#fca5a5' }}>
          ⚠️ {error}
          <button
            onClick={() => fetchPlan()}
            style={{ display: 'block', marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
          >
            Retry Loading Plan
          </button>
        </div>
      </div>
    );
  }

  const {
    financialSnapshot = {},
    emergencyFundEstimate = {},
    investmentCapacity = {},
    activeGoals = [],
    goalPlan = null,
    assetAllocation = {},
    riskAnalysis = {}
  } = planData || {};

  return (
    <div className="investments-container">
      <PageHeader
        title="Investment Planning"
        subtitle="Plan investments around your financial goals, savings capacity, timeline, and risk preference."
        icon="🚀"
      />

      {/* 1. FINANCIAL SNAPSHOT */}
      <section className="investment-section-card">
        <div className="section-title-row">
          <h2 className="section-title">📊 Financial Snapshot</h2>
          <span className="stat-subtext">Based on 90-day transaction history</span>
        </div>
        <div className="grid-4">
          <div className="snapshot-stat">
            <span className="stat-label">Monthly Income</span>
            <span className="stat-value income">₹{(financialSnapshot.monthlyIncome || 0).toLocaleString()}</span>
            <span className="stat-subtext">Avg recorded income</span>
          </div>
          <div className="snapshot-stat">
            <span className="stat-label">Monthly Expenses</span>
            <span className="stat-value expense">₹{(financialSnapshot.monthlyExpenses || 0).toLocaleString()}</span>
            <span className="stat-subtext">Avg essential & discretionary</span>
          </div>
          <div className="snapshot-stat">
            <span className="stat-label">Monthly Savings</span>
            <span className="stat-value savings">₹{(financialSnapshot.monthlySavings || 0).toLocaleString()}</span>
            <span className="stat-subtext">Savings Rate: {financialSnapshot.savingsRate || 0}%</span>
          </div>
          <div className="snapshot-stat">
            <span className="stat-label">Current Net Balance</span>
            <span className="stat-value balance">₹{(financialSnapshot.currentBalance || 0).toLocaleString()}</span>
            <span className="stat-subtext">All-time cash reserve</span>
          </div>
        </div>
      </section>

      {/* 2 & 3. RISK PREFERENCE & INVESTMENT HORIZON */}
      <div className="grid-2">
        {/* Risk Preference Card */}
        <section className="investment-section-card">
          <div className="section-title-row">
            <h2 className="section-title">🎯 Risk Preference</h2>
          </div>
          <div className="preference-selector-grid">
            <div
              className={`pref-option-card ${riskPreference === 'Conservative' ? 'active' : ''}`}
              onClick={() => handleUpdatePreference({ riskPreference: 'Conservative' })}
            >
              <div className="pref-option-header">
                <span className="pref-option-title">Conservative</span>
                <span className="pref-check">{riskPreference === 'Conservative' ? '✓' : ''}</span>
              </div>
              <p className="pref-option-desc">Focuses more on capital preservation and lower-volatility assets.</p>
            </div>

            <div
              className={`pref-option-card ${riskPreference === 'Moderate' ? 'active' : ''}`}
              onClick={() => handleUpdatePreference({ riskPreference: 'Moderate' })}
            >
              <div className="pref-option-header">
                <span className="pref-option-title">Moderate</span>
                <span className="pref-check">{riskPreference === 'Moderate' ? '✓' : ''}</span>
              </div>
              <p className="pref-option-desc">Balances growth potential and market downside protection.</p>
            </div>

            <div
              className={`pref-option-card ${riskPreference === 'Aggressive' ? 'active' : ''}`}
              onClick={() => handleUpdatePreference({ riskPreference: 'Aggressive' })}
            >
              <div className="pref-option-header">
                <span className="pref-option-title">Aggressive</span>
                <span className="pref-check">{riskPreference === 'Aggressive' ? '✓' : ''}</span>
              </div>
              <p className="pref-option-desc">Accepts greater potential volatility in pursuit of long-term growth.</p>
            </div>
          </div>
        </section>

        {/* Investment Horizon Card */}
        <section className="investment-section-card">
          <div className="section-title-row">
            <h2 className="section-title">⏳ Investment Horizon</h2>
          </div>
          <div className="preference-selector-grid">
            <div
              className={`pref-option-card ${investmentHorizon === 'Short Term' ? 'active' : ''}`}
              onClick={() => handleUpdatePreference({ investmentHorizon: 'Short Term' })}
            >
              <div className="pref-option-header">
                <span className="pref-option-title">Short Term</span>
                <span className="pref-check">{investmentHorizon === 'Short Term' ? '✓' : ''}</span>
              </div>
              <p className="pref-option-desc">Less than 3 years. Prioritizes liquidity over market risk.</p>
            </div>

            <div
              className={`pref-option-card ${investmentHorizon === 'Medium Term' ? 'active' : ''}`}
              onClick={() => handleUpdatePreference({ investmentHorizon: 'Medium Term' })}
            >
              <div className="pref-option-header">
                <span className="pref-option-title">Medium Term</span>
                <span className="pref-check">{investmentHorizon === 'Medium Term' ? '✓' : ''}</span>
              </div>
              <p className="pref-option-desc">3–5 years. Balances growth with moderate stability.</p>
            </div>

            <div
              className={`pref-option-card ${investmentHorizon === 'Long Term' ? 'active' : ''}`}
              onClick={() => handleUpdatePreference({ investmentHorizon: 'Long Term' })}
            >
              <div className="pref-option-header">
                <span className="pref-option-title">Long Term</span>
                <span className="pref-check">{investmentHorizon === 'Long Term' ? '✓' : ''}</span>
              </div>
              <p className="pref-option-desc">5+ years. Higher capacity to endure short-term market cycles.</p>
            </div>
          </div>
        </section>
      </div>

      {/* 4. EMERGENCY FUND & INVESTMENT CAPACITY */}
      <div className="grid-2">
        {/* Emergency Fund Consideration */}
        <section className="investment-section-card">
          <div className="section-title-row">
            <h2 className="section-title">🛡️ Emergency Fund Consideration</h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Estimated Essential Expenses: <strong>₹{(emergencyFundEstimate.estimatedEssentialExpenses || 0).toLocaleString()}/mo</strong>
          </p>
          <div className="months-toggle-row">
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', alignSelf: 'center', marginRight: '0.5rem' }}>Reserve Horizon:</span>
            {[3, 6, 9, 12].map((m) => (
              <button
                key={m}
                className={`month-chip ${emergencyFundMonths === m ? 'active' : ''}`}
                onClick={() => handleUpdatePreference({ emergencyFundMonths: m })}
              >
                {m} Months
              </button>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Estimated Emergency Cushion Target:</span>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#38bdf8', marginTop: '0.2rem' }}>
              ₹{(emergencyFundEstimate.estimatedEmergencyFundTarget || 0).toLocaleString()}
            </div>
            <span className={`funding-status-badge ${emergencyFundEstimate.emergencyFundStatus === 'Sufficient Liquid Cushion' ? 'aligned' : 'below'}`} style={{ marginTop: '0.5rem' }}>
              Status: {emergencyFundEstimate.emergencyFundStatus}
            </span>
          </div>
          <div className="notice-box">
            💡 {emergencyFundEstimate.disclaimer}
          </div>
        </section>

        {/* Investment Capacity */}
        <section className="investment-section-card">
          <div className="section-title-row">
            <h2 className="section-title">💡 Investment Capacity</h2>
          </div>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="snapshot-stat">
              <span className="stat-label">Total Monthly Savings</span>
              <span className="stat-value savings">₹{(investmentCapacity.monthlySavings || 0).toLocaleString()}</span>
              <span className="stat-subtext">Net unspent monthly income</span>
            </div>
            <div className="snapshot-stat" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
              <span className="stat-label">Suggested Investment Capacity</span>
              <span className="stat-value income">₹{(investmentCapacity.suggestedInvestmentAmount || 0).toLocaleString()}</span>
              <span className="stat-subtext">Suggested for goal planning</span>
            </div>
          </div>
          <div className="notice-box" style={{ borderLeftColor: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            ℹ️ {investmentCapacity.distinctionNotice}
          </div>
        </section>
      </div>

      {/* 5. GOAL-BASED INVESTMENT PLANNING & FUNDING GAP */}
      <section className="investment-section-card">
        <div className="section-title-row">
          <h2 className="section-title">🏆 Goal-Based Investment Planning</h2>
        </div>

        {activeGoals.length === 0 ? (
          <div className="no-goals-callout">
            <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8fafc' }}>You don't have an active financial goal yet.</p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.3rem' }}>Create a financial goal first to build a goal-based investment plan.</p>
            <button className="no-goals-btn" onClick={() => navigate('/goals')}>
              + Go to Goals Module
            </button>
          </div>
        ) : (
          <div>
            <label className="sim-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Select Target Financial Goal for Context:</label>
            <select className="goal-select-control" value={selectedGoalId} onChange={handleGoalChange}>
              {activeGoals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} — Target: ₹{g.targetAmount.toLocaleString()} (Saved: ₹{g.currentAmount.toLocaleString()})
                </option>
              ))}
            </select>

            {goalPlan && goalPlan.goal ? (
              <div className="goal-funding-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>{goalPlan.goal.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Target Date: {new Date(goalPlan.goal.targetDate).toLocaleDateString()}</span>
                  </div>
                  <span className={`funding-status-badge ${goalPlan.fundingGap.capacityDifference >= 0 ? 'aligned' : 'below'}`}>
                    {goalPlan.fundingGap.fundingStatusText}
                  </span>
                </div>

                <div className="grid-3" style={{ marginBottom: '1rem' }}>
                  <div className="snapshot-stat">
                    <span className="stat-label">Target Goal Amount</span>
                    <span className="stat-value">₹{goalPlan.planSummary.targetAmount.toLocaleString()}</span>
                    <span className="stat-subtext">Remaining: ₹{goalPlan.planSummary.remainingAmount.toLocaleString()}</span>
                  </div>
                  <div className="snapshot-stat">
                    <span className="stat-label">Required Monthly Savings</span>
                    <span className="stat-value expense">₹{goalPlan.fundingGap.requiredMonthlySavings.toLocaleString()}</span>
                    <span className="stat-subtext">To achieve target on time</span>
                  </div>
                  <div className="snapshot-stat">
                    <span className="stat-label">Suggested Monthly Capacity</span>
                    <span className="stat-value income">₹{goalPlan.fundingGap.suggestedInvestmentCapacity.toLocaleString()}</span>
                    <span className="stat-subtext">
                      Gap: {goalPlan.fundingGap.capacityDifference >= 0 ? `+₹${goalPlan.fundingGap.capacityDifference.toLocaleString()}` : `-₹${Math.abs(goalPlan.fundingGap.capacityDifference).toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
                  ⏱️ <strong>Time Remaining:</strong> {goalPlan.planSummary.timeRemaining.monthsRemaining} months ({goalPlan.planSummary.timeRemaining.daysRemaining} days)
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* 6. INVESTMENT ALLOCATION INFORMATION */}
      <section className="investment-section-card">
        <div className="section-title-row">
          <h2 className="section-title">📊 Investment Allocation Information ({riskPreference} Risk Profile)</h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Informational asset breakdown for educational purposes. Does NOT represent specific security buy/sell recommendations.
        </p>

        {/* Allocation Bar */}
        <div className="allocation-stacked-bar">
          <div className="alloc-segment cash" style={{ width: `${assetAllocation.cashSavingsPct}%` }} title={`Cash/Savings: ${assetAllocation.cashSavingsPct}%`} />
          <div className="alloc-segment fixed" style={{ width: `${assetAllocation.fixedIncomePct}%` }} title={`Fixed Income: ${assetAllocation.fixedIncomePct}%`} />
          <div className="alloc-segment equity" style={{ width: `${assetAllocation.equityPct}%` }} title={`Equity: ${assetAllocation.equityPct}%`} />
          <div className="alloc-segment hybrid" style={{ width: `${assetAllocation.hybridPct}%` }} title={`Hybrid: ${assetAllocation.hybridPct}%`} />
        </div>

        {/* Legend Cards */}
        <div className="allocation-legend-grid">
          <div className="legend-item">
            <span className="legend-color-dot cash" />
            <div>
              <strong style={{ color: '#3b82f6' }}>Cash / Savings ({assetAllocation.cashSavingsPct}%)</strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>High liquidity, capital safety, lower growth.</p>
            </div>
          </div>

          <div className="legend-item">
            <span className="legend-color-dot fixed" />
            <div>
              <strong style={{ color: '#10b981' }}>Fixed Income ({assetAllocation.fixedIncomePct}%)</strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Lower volatility than equity; steady income.</p>
            </div>
          </div>

          <div className="legend-item">
            <span className="legend-color-dot equity" />
            <div>
              <strong style={{ color: '#f59e0b' }}>Equity ({assetAllocation.equityPct}%)</strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Long-term capital appreciation; market fluctuation.</p>
            </div>
          </div>

          <div className="legend-item">
            <span className="legend-color-dot hybrid" />
            <div>
              <strong style={{ color: '#8b5cf6' }}>Hybrid ({assetAllocation.hybridPct}%)</strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Combination of equity and fixed-income elements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DETERMINISTIC RISK ANALYSIS */}
      <section className="investment-section-card">
        <div className="section-title-row">
          <h2 className="section-title">🔍 Risk Analysis Indicators</h2>
          <span className="risk-score-badge">
            Indicator Rating: {riskAnalysis.riskCapacityRating} ({riskAnalysis.riskCapacityScore}/100)
          </span>
        </div>

        <div className="risk-indicators-list">
          {riskAnalysis.indicators?.map((ind, idx) => (
            <div key={idx} className="risk-indicator-row">
              <div>
                <span className="indicator-title">{ind.label}</span>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{ind.detail}</p>
              </div>
              <span className="indicator-val">{ind.value}</span>
            </div>
          ))}
        </div>

        <div className="notice-box" style={{ marginTop: '1rem' }}>
          📌 <strong>Planning Indicator Notice:</strong> {riskAnalysis.scoreDisclaimer}
        </div>
      </section>

      {/* 8. INVESTMENT SCENARIO SIMULATOR */}
      <section className="investment-section-card">
        <div className="section-title-row">
          <h2 className="section-title">🧮 Investment Scenario Simulator</h2>
          <span className="stat-subtext">Hypothetical Compound Growth Calculator</span>
        </div>

        <div className="sim-controls-grid">
          <div className="sim-input-group">
            <label className="sim-label">Initial Lump Sum (₹)</label>
            <input
              type="number"
              min="0"
              className="sim-input-field"
              value={simInitialAmount}
              onChange={(e) => setSimInitialAmount(Number(e.target.value))}
            />
          </div>

          <div className="sim-input-group">
            <label className="sim-label">Monthly Contribution (₹)</label>
            <input
              type="number"
              min="0"
              className="sim-input-field"
              value={simMonthlyContrib}
              onChange={(e) => setSimMonthlyContrib(Number(e.target.value))}
            />
          </div>

          <div className="sim-input-group">
            <label className="sim-label">Time Horizon (Years)</label>
            <input
              type="number"
              min="1"
              max="50"
              className="sim-input-field"
              value={simYears}
              onChange={(e) => setSimYears(Number(e.target.value))}
            />
          </div>

          <div className="sim-input-group">
            <label className="sim-label">Hypothetical Return Rate (%)</label>
            <input
              type="number"
              min="-20"
              max="50"
              step="0.5"
              className="sim-input-field"
              value={simReturnRate}
              onChange={(e) => setSimReturnRate(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Quick Scenario Preset Comparators */}
        <div className="scenario-presets-row">
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1', alignSelf: 'center' }}>Preset Monthly Contributions:</span>
          {[2000, 5000, 10000, 15000, 25000].map((amt) => (
            <button key={amt} className="preset-btn" onClick={() => setSimMonthlyContrib(amt)}>
              ₹{amt.toLocaleString()}/mo
            </button>
          ))}
        </div>

        {/* Simulation Output Card */}
        {simResult && simResult.results ? (
          <div className="sim-results-card">
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#f8fafc' }}>
              Hypothetical Simulation Output ({simYears} Years @ {simReturnRate}% Return)
            </h3>
            <div className="grid-3">
              <div className="snapshot-stat">
                <span className="stat-label">Total Principal Invested</span>
                <span className="stat-value">₹{simResult.results.totalPrincipalInvested.toLocaleString()}</span>
                <span className="stat-subtext">Out-of-pocket contributions</span>
              </div>
              <div className="snapshot-stat">
                <span className="stat-label">Hypothetical Future Value</span>
                <span className="stat-value income">₹{simResult.results.hypotheticalFutureValue.toLocaleString()}</span>
                <span className="stat-subtext">Estimated compounded total</span>
              </div>
              <div className="snapshot-stat">
                <span className="stat-label">Hypothetical Growth / Earnings</span>
                <span className="stat-value savings">₹{simResult.results.hypotheticalGrowth.toLocaleString()}</span>
                <span className="stat-subtext">Compounded appreciation</span>
              </div>
            </div>

            {/* Comparison against Selected Goal Target */}
            {goalPlan && goalPlan.goal ? (
              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#38bdf8', fontSize: '0.95rem' }}>
                  🎯 Comparison against Selected Goal: {goalPlan.goal.name}
                </h4>
                <div style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <div>Goal Target Amount: <strong>₹{goalPlan.planSummary.targetAmount.toLocaleString()}</strong></div>
                  <div>Remaining Goal Amount: <strong>₹{goalPlan.planSummary.remainingAmount.toLocaleString()}</strong></div>
                  <div>Simulated Future Investment Value: <strong>₹{simResult.results.hypotheticalFutureValue.toLocaleString()}</strong></div>
                  <div style={{ marginTop: '0.4rem', fontWeight: '600', color: simResult.results.hypotheticalFutureValue >= goalPlan.planSummary.targetAmount ? '#34d399' : '#fb7185' }}>
                    Illustrative Scenario Result: Under this hypothetical assumption, the calculated value is ₹{simResult.results.hypotheticalFutureValue.toLocaleString()} vs required ₹{goalPlan.planSummary.targetAmount.toLocaleString()}.
                  </div>
                </div>
              </div>
            ) : null}

            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
              ⚠️ {simResult.disclaimer}
            </p>
          </div>
        ) : null}
      </section>

      {/* 9. MANDATORY DISCLAIMER BANNER */}
      <div className="disclaimer-banner">
        <span className="disclaimer-icon">⚠️</span>
        <div>
          <strong>Important Planning & Financial Disclaimer:</strong>
          <br />
          This tool provides educational and planning information based on the data you enter. It does not provide personalized financial advice, guarantee investment returns, or execute investments. Investment values shown in simulations are hypothetical and actual results may differ.
        </div>
      </div>
    </div>
  );
};

export default InvestmentsPage;
