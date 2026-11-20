import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './layouts/MainLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Suppliers } from './pages/Suppliers';
import { CentralWarehouse } from './pages/CentralWarehouse';
import { Medicines } from './pages/Medicines';
import { Branches } from './pages/Branches';
import { Employees } from './pages/Employees';
import { Customers } from './pages/Customers';
import { BranchInventory } from './pages/BranchInventory';
import { POS } from './pages/POS';
import { Delivery } from './pages/Delivery';
import { Reports } from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes inside Main Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="pos" element={<POS />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="central-warehouse" element={<CentralWarehouse />} />
                <Route path="medicines" element={<Medicines />} />
                <Route path="branches" element={<Branches />} />
                <Route path="employees" element={<Employees />} />
                <Route path="customers" element={<Customers />} />
                <Route path="branch-inventory" element={<BranchInventory />} />
                <Route path="delivery" element={<Delivery />} />
                <Route path="reports" element={<Reports />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
