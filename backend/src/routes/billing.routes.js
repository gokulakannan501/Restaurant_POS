import express from 'express';
import {
    generateBill,
    getBillById,
    processPayment,
    getReceipt,
    getAllBills,
} from '../controllers/billing.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'), getAllBills);
router.post('/generate', authenticate, generateBill);
router.get('/:id', authenticate, getBillById);
router.post('/:id/payment', authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'), processPayment);
router.get('/:id/receipt', authenticate, getReceipt);

export default router;
