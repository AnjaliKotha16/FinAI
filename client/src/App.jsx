import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './layouts/MainLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Authenticated Application Pages
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { GoalsPage } from './pages/GoalsPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { FinancialHealthPage } from './pages/FinancialHealthPage';
import { InsightsPage } from './pages/InsightsPage';
import { MonthlyReviewPage } from './pages/MonthlyReviewPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Routes with Main Navbar & Footer */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <HomePage />
                </MainLayout>
              }
            />
            <Route
              path="/login"
              element={
                <MainLayout>
                  <LoginPage />
                </MainLayout>
              }
            />
            <Route
              path="/register"
              element={
                <MainLayout>
                  <RegisterPage />
                </MainLayout>
              }
            />

            {/* Protected Application Shell Layout & Module Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/financial-health" element={<FinancialHealthPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/monthly-review" element={<MonthlyReviewPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <MainLayout>
                  <NotFoundPage />
                </MainLayout>
              }
            />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
