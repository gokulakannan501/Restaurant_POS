import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { Toaster } from 'react-hot-toast';

// Layouts
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Attendance from './pages/Attendance';

function App() {
    const { isAuthenticated, user, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const getHomeRoute = () => {
        if (!user) return '/';
        if (user.role === 'WAITER') return '/tables';
        if (user.role === 'CASHIER') return '/billing';
        return '/';
    };

    return (
        <Router>
            <Toaster position="top-right" />
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Login />
                } />

                {/* Protected Routes */}
                <Route element={<Layout />}>
                    <Route path="/" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']}>
                            <Profile />
                        </ProtectedRoute>
                    } />

                    <Route path="/users" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <Users />
                        </ProtectedRoute>
                    } />

                    <Route path="/tables" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']}>
                            <Tables />
                        </ProtectedRoute>
                    } />

                    <Route path="/menu" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']}>
                            <Menu />
                        </ProtectedRoute>
                    } />

                    <Route path="/orders" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']}>
                            <Orders />
                        </ProtectedRoute>
                    } />

                    <Route path="/orders/new" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']}>
                            <Cart />
                        </ProtectedRoute>
                    } />

                    <Route path="/billing" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER']}>
                            <Billing />
                        </ProtectedRoute>
                    } />

                    <Route path="/inventory" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                            <Inventory />
                        </ProtectedRoute>
                    } />

                    <Route path="/reports" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                            <Reports />
                        </ProtectedRoute>
                    } />

                    <Route path="/settings" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                            <Settings />
                        </ProtectedRoute>
                    } />

                    <Route path="/attendance" element={
                        <ProtectedRoute requiredPermission="attendance">
                            <Attendance />
                        </ProtectedRoute>
                    } />
                </Route>

                {/* Redirect to login if not authenticated */}
                <Route path="*" element={
                    isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Navigate to="/login" replace />
                } />
            </Routes>
        </Router>
    );
}

export default App;
