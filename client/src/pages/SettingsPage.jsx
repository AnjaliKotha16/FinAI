import React from 'react';
import { PageHeader } from '../components/PageHeader';
import './PlaceholderPage.css';

export const SettingsPage = () => {
  return (
    <div>
      <PageHeader
        title="Application Settings"
        subtitle="Security options, currency defaults, and notification preferences."
        phaseBadge="Phase 2 Ready"
        icon="⚙️"
      />
      <div className="placeholder-card">
        <div className="placeholder-icon">⚙️</div>
        <h2 className="placeholder-title">Settings & Preferences</h2>
        <p className="placeholder-description">
          Customize currency defaults (INR/USD), change password, export user data, and configure email/push notification alerts in upcoming releases.
        </p>
        <span className="placeholder-phase-info">⚙️ Settings System Initialized</span>
      </div>
    </div>
  );
};

export default SettingsPage;
