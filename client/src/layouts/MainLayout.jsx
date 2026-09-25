import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import './MainLayout.css';

export const MainLayout = ({ children }) => {
  return (
    <div className="layout-wrapper">
      <Header />
      <main className="layout-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};
