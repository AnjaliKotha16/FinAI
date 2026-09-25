import React from 'react';
import { PageHeader } from '../components/PageHeader';
import './PlaceholderPage.css';

export const AnalyticsPage = () => {
  return (
    <div>
      <PageHeader
        title="Spending Analysis"
        subtitle="Visual analytics, category breakdown charts, and cash flow trends."
        phaseBadge="Phase 3 Module"
        icon="📈"
      />
      <div className="placeholder-card">
        <div className="placeholder-icon">📈</div>
        <h2 className="placeholder-title">Spending Analysis Module</h2>
        <p className="placeholder-description">
          Visual spending breakdown charts, category distribution, income vs expense trends, and monthly comparisons will be implemented in Phase 3.
        </p>
        <span className="placeholder-phase-info">⚡ Planned for Phase 3</span>
      </div>
    </div>
  );
};

export default AnalyticsPage;
