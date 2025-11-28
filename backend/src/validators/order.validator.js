import { z } from 'zod';

export const createOrderSchema = z.object({
    body: z.object({
        type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
        tableId: z.string().uuid().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
            z.object({
                menuItemId: z.string().uuid(),
                variantId: z.string().uuid().optional(),
                quantity: z.number().int().positive(),
                notes: z.string().optional(),
            })
        ).min(1, 'At least one item is required'),
    }),
});

export const updateOrderSchema = z.object({
    body: z.object({
        status: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']).optional(),
        notes: z.string().optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
});
