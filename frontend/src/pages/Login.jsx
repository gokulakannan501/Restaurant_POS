import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

import logo from '../assets/logo.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate('/');
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (error) clearError();
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (error) clearError();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-4 relative overflow-hidden">
            {/* Animated background overlay */}
            <div className="absolute inset-0 bg-black opacity-20"></div>

            {/* Animated floating circles */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="relative z-10 w-full max-w-md" style={{ animation: 'slideInUp 0.6s ease-out' }}>
                <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-lg bg-opacity-95 border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="mb-4" style={{ animation: 'pulse-slow 3s ease-in-out infinite' }}>
                            <img src={logo} alt="Logo" className="h-16 w-auto mx-auto object-contain" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 mb-2" style={{ animation: 'fadeIn 0.8s ease-out' }}>
                            The Classic Restaurant
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400" style={{ animation: 'fadeIn 1s ease-out' }}>
                            Sign in to your account
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-shake">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div style={{ animation: 'fadeInUp 0.8s ease-out' }}>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email or Mobile Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    type="text"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
                                    placeholder="you@example.com or +1234567890"
                                />
                            </div>
                        </div>

                        <div style={{ animation: 'fadeInUp 1s ease-out' }}>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-base sm:text-lg transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                            style={{ animation: 'fadeInUp 1.2s ease-out' }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
