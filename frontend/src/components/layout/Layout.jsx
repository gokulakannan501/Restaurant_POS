import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Layout = () => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', roles: ['ADMIN', 'MANAGER'] },
        { path: '/tables', label: 'Tables', roles: ['ADMIN', 'MANAGER', 'WAITER'] },
        { path: '/menu', label: 'Menu', roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
        { path: '/orders', label: 'Orders', roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
        { path: '/billing', label: 'Billing', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
        { path: '/inventory', label: 'Inventory', roles: ['ADMIN', 'MANAGER'] },
        { path: '/reports', label: 'Reports', roles: ['ADMIN', 'MANAGER'] },
        { path: '/settings', label: 'Settings', roles: ['ADMIN', 'MANAGER'] },
    ];

    const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

    // Dark mode handling
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-dark-surface border-r border-gray-200 fixed h-full z-10">
                <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-primary-600 dark:text-dark-text">Restaurant POS</h1>
                </div>
                <nav className="p-4 space-y-1">
                    {filteredNavItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-primary-50 text-primary-700 dark:bg-dark-surface dark:text-dark-text'
                                : 'text-gray-700 hover:bg-gray-50 dark:hover:bg-dark-surface'}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-dark-surface flex items-center justify-center text-primary-700 font-bold">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize dark:text-gray-400">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-surface rounded-lg hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors mb-2"
                    >
                        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                    </button>

                </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
