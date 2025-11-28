import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        pin: z.string().length(4, 'PIN must be 4 digits'),
    }),
});

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        pin: z.string().length(4, 'PIN must be 4 digits'),
        role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']),
    }),
});

export const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        pin: z.string().length(4).optional(),
        role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']).optional(),
        isActive: z.boolean().optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
});
