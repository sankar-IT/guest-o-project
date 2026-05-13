import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import RegisterPage from './pages/Register/RegisterPage';
import LoginPage from './pages/Login/LoginPage';
import HomePage from './pages/Home/HomePage';

import WaiterLayout from './components/Layout/WaiterLayout';
import WaiterDashboard from './pages/Waiter/WaiterDashboard';
import WaiterTables from './pages/Waiter/WaiterTables';
import TableDetail from './pages/Waiter/TableDetail';
import OrderDetails from './pages/Waiter/OrderDetails';
import WaiterOrders from './pages/Waiter/WaiterOrders';
import OrderReview from './pages/Waiter/OrderReview';

import StaffLogin from './pages/Staff/StaffLogin';
import KitchenDashboard from './pages/Kitchen/KitchenDashboard';
import KitchenStatusTracker from './pages/Kitchen/KitchenStatusTracker';
import OrderWorkspace from './pages/Waiter/OrderWorkspace';
import MenuPage from './pages/Menu/MenuPage';
import ProductDetailPage from './pages/Menu/ProductDetailPage';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import './index.css';

function App() {
  return (
    <GoogleOAuthProvider clientId="791498024436-f3oa2eu8g31hpkieajgi2ma3vndvp0bc.apps.googleusercontent.com">
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Waiter Routes (Nested) */}
              <Route path="/waiter" element={<WaiterLayout />}>
                <Route path="dashboard" element={<WaiterDashboard />} />
                <Route path="tables" element={<WaiterTables />} />
                <Route path="tables/:tableId" element={<TableDetail />} />
                <Route path="order-details/:tableId/:orderId" element={<OrderDetails />} />
                <Route path="orders" element={<WaiterOrders />} />
                <Route path="order-review/:tableId" element={<OrderReview />} />
                <Route path="order/:tableId" element={<OrderWorkspace />} />
                <Route path="order" element={<OrderWorkspace />} />
                <Route path="menu" element={<MenuPage />} />
              </Route>

              {/* Auth & Staff Generic */}
              <Route path="/staff/login" element={<StaffLogin />} />
              
              {/* Kitchen Routes */}
              <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
              <Route path="/kitchen/tracker" element={<KitchenStatusTracker />} />

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
        </CartProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
