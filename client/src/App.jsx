import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Loader from './components/Loader/Loader';
import GlobalSocketListener from './components/GlobalSocketListener/GlobalSocketListener';
import BottomNavbar from './components/Navbar/BottomNavbar';
import WaiterLayout from './components/Layout/WaiterLayout';
import './index.css';

// Lazy load components
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const CartPage = lazy(() => import('./pages/Cart/CartPage'));
const PaymentPage = lazy(() => import('./pages/Payment/PaymentPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const ReturnsRefundsPage = lazy(() => import('./pages/Profile/ReturnsRefundsPage'));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'));
const TrackOrderPage = lazy(() => import('./pages/Orders/TrackOrderPage'));
const MenuPage = lazy(() => import('./pages/Menu/MenuPage'));
const ProductDetailPage = lazy(() => import('./pages/Menu/ProductDetailPage'));
const MenuDetailPage = lazy(() => import('./pages/Menu/MenuDetailPage'));
const StaffLogin = lazy(() => import('./pages/Staff/StaffLogin'));
const KitchenDashboard = lazy(() => import('./pages/Kitchen/KitchenDashboard'));
const KitchenStatusTracker = lazy(() => import('./pages/Kitchen/KitchenStatusTracker'));
const AboutPage = lazy(() => import('./pages/About/AboutPage'));

// Waiter Pages
const WaiterDashboard = lazy(() => import('./pages/Waiter/WaiterDashboard'));
const WaiterTables = lazy(() => import('./pages/Waiter/WaiterTables'));
const TableDetail = lazy(() => import('./pages/Waiter/TableDetail'));
const OrderDetails = lazy(() => import('./pages/Waiter/OrderDetails'));
const WaiterOrders = lazy(() => import('./pages/Waiter/WaiterOrders'));
const OrderReview = lazy(() => import('./pages/Waiter/OrderReview'));
const OrderWorkspace = lazy(() => import('./pages/Waiter/OrderWorkspace'));

const PageLoader = () => (
  <Loader fullPage={true} />
);

function App() {
  return (
    <GoogleOAuthProvider clientId="791498024436-f3oa2eu8g31hpkieajgi2ma3vndvp0bc.apps.googleusercontent.com">
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <GlobalSocketListener />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

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

                {/* Staff Routes */}
                <Route path="/staff/login" element={<StaffLogin />} />
                <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
                <Route path="/kitchen/tracker" element={<KitchenStatusTracker />} />

                {/* General Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected User Routes */}
                <Route path="/home" element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } />
                <Route path="/cart" element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                } />
                <Route path="/payment" element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/returns-refunds" element={
                  <ProtectedRoute>
                    <ReturnsRefundsPage />
                  </ProtectedRoute>
                } />
                <Route path="/my-orders" element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                } />
                <Route path="/track-order/:orderId" element={
                  <ProtectedRoute>
                    <TrackOrderPage />
                  </ProtectedRoute>
                } />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/menu/:id" element={
                  <ProtectedRoute>
                    <MenuDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/about" element={<AboutPage />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <BottomNavbar />
          </BrowserRouter>
        </CartProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
