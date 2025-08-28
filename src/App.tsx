import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { FixedExpenses } from './pages/FixedExpenses';
import { RecurringIncomes } from './pages/RecurringIncomes';
import { ExpenseEntry } from './pages/ExpenseEntry';
import { IncomeEntry } from './pages/IncomeEntry';
import { Forecast } from './pages/Forecast';
import { Timeline } from './pages/Timeline';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/forecast" replace />} />
              <Route path="settings/fixed-expenses" element={<FixedExpenses />} />
              <Route path="settings/recurring-incomes" element={<RecurringIncomes />} />
              <Route path="entry/expense" element={<ExpenseEntry />} />
              <Route path="entry/income" element={<IncomeEntry />} />
              <Route path="forecast" element={<Forecast />} />
              <Route path="timeline" element={<Timeline />} />
            </Route>
          </Routes>
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;