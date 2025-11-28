import express from 'express';
import {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
} from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, updateOrderSchema, updateOrderStatusSchema } from '../validators/order.validator.js';

const router = express.Router();

router.get('/', authenticate, getAllOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.put('/:id', authenticate, validate(updateOrderSchema), updateOrder);
router.patch('/:id/status', authenticate, validate(updateOrderStatusSchema), updateOrderStatus);
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteOrder);

export default router;
