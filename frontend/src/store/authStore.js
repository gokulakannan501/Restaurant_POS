import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { user, token } = response.data.data;

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    // Set token in axios defaults
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    toast.success(`Welcome back, ${user.name}!`);
                    return true;
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Login failed';
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: errorMessage,
                    });
                    toast.error(errorMessage);
                    return false;
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                }

                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    error: null,
                });

                delete api.defaults.headers.common['Authorization'];
                toast.success('Logged out successfully');
            },

            checkAuth: async () => {
                const { token } = get();

                if (!token) {
                    set({ isAuthenticated: false, user: null });
                    return;
                }

                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/auth/me');
                    set({
                        user: response.data.data,
                        isAuthenticated: true,
                    });
                } catch (error) {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                    });
                    delete api.defaults.headers.common['Authorization'];
                }
            },

            updateUser: (userData) => {
                set({ user: { ...get().user, ...userData } });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
