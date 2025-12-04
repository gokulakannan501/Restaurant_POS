import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().min(1, 'Email or mobile number is required'), // Changed to accept both email and mobile
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        mobile: z.string().optional(),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']),
        permissions: z.array(z.string()).optional(),
    }),
});

export const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        mobile: z.string().optional(),
        password: z.string().min(6).optional(),
        role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']).optional(),
        permissions: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }),
});
