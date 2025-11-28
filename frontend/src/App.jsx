import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { Toaster } from 'react-hot-toast';

// Layouts
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <Router>
            <Toaster position="top-right" />
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']}>
                            <Dashboard />
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
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
