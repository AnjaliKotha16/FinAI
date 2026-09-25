import React from 'react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} FinAI - AI-Powered Personal Finance & Investment Assistant.</p>
        <p className="footer-sub">Phase 0 Architecture & Foundation Build</p>
      </div>
    </footer>
  );
};
