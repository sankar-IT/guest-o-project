import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import RegisterPage from './pages/Register/RegisterPage';
import LoginPage from './pages/Login/LoginPage';
import HomePage from './pages/Home/HomePage';

import StaffLogin from './pages/Staff/StaffLogin';
import KitchenDashboard from './pages/Kitchen/KitchenDashboard';
import TableDashboard from './pages/Staff/TableDashboard';
import TableDetailedView from './pages/Staff/TableDetailedView';
import OrderedItemDetails from './pages/Staff/OrderedItemDetails';
import KitchenStatusTracker from './pages/Kitchen/KitchenStatusTracker';
import OrderWorkspace from './pages/Order/OrderWorkspace';
import OrderReviewPage from './pages/Order/OrderReviewPage';
import MenuPage from './pages/Menu/MenuPage';
import ProductDetailPage from './pages/Menu/ProductDetailPage';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

function App() {
  return (
    <GoogleOAuthProvider clientId="791498024436-f3oa2eu8g31hpkieajgi2ma3vndvp0bc.apps.googleusercontent.com">
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Staff Routes */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/tables" element={<TableDashboard />} />
            <Route path="/staff/detail/:tableId" element={<TableDetailedView />} />
            <Route path="/staff/order-details/:tableId/:orderId" element={<OrderedItemDetails />} />
            <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
            <Route path="/kitchen/tracker" element={<KitchenStatusTracker />} />
            <Route path="/order/:tableId" element={<OrderWorkspace />} />
            <Route path="/order" element={<OrderWorkspace />} />
            <Route path="/staff/order-review/:tableId" element={<OrderReviewPage />} />

            {/* General Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route path="/home" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

