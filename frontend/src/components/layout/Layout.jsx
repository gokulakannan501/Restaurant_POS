import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/logo.jpg';

const Layout = () => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        { path: '/users', label: 'Users', roles: ['ADMIN'] },
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

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
                    <h1 className="text-lg font-bold text-primary-600 dark:text-dark-text">The Classic Restaurant</h1>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isSidebarOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 z-40
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Desktop Header */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700 gap-3">
                    <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
                    <h1 className="text-lg font-bold text-primary-600 dark:text-dark-text">The Classic Restaurant</h1>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 16rem)' }}>
                    {filteredNavItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={closeSidebar}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-primary-50 text-primary-700 dark:bg-gray-800 dark:text-primary-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface space-y-3">
                    {/* Profile Link */}
                    <Link
                        to="/profile"
                        onClick={closeSidebar}
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-gray-700 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-lg flex-shrink-0">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </Link>

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 p-4 sm:p-6 lg:p-8 min-h-screen">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
