import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
    persist(
        (set) => ({
            user: {
                id: 'default-admin-id',
                name: 'Admin User',
                role: 'ADMIN'
            },
            token: 'dummy-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,

            login: async (pin) => {
                // Mock login
                set({
                    user: { id: 'default-admin-id', name: 'Admin User', role: 'ADMIN' },
                    token: 'dummy-token',
                    isAuthenticated: true,
                    isLoading: false
                });
                return true;
            },

            logout: () => {
                // Disable logout or just reset to default
                // set({ user: null, token: null, isAuthenticated: false });
                window.location.reload();
            },

            checkAuth: async () => {
                // Always authenticated
                set({
                    user: { id: 'default-admin-id', name: 'Admin User', role: 'ADMIN' },
                    isAuthenticated: true
                });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
        }
    )
);

export default useAuthStore;
