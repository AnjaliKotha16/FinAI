import React from 'react';
import './PageHeader.css';

export const PageHeader = ({ title, subtitle, phaseBadge, icon }) => {
  return (
    <div className="page-header">
      <div className="page-header-title-group">
        {icon && <span className="page-header-icon">{icon}</span>}
        <div>
          <div className="page-header-row">
            <h1 className="page-header-title">{title}</h1>
            {phaseBadge && <span className="page-header-badge">{phaseBadge}</span>}
          </div>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};
