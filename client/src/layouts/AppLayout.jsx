import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import './AppLayout.css';

export const AppLayout = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={closeMobileSidebar} />

      {/* Main Content Area beside Sidebar */}
      <div className="app-shell-main">
        {/* Topbar Header */}
        <Topbar onToggleSidebar={toggleMobileSidebar} />

        {/* Page View Body */}
        <main className="app-main-content">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
