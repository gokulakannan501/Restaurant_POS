import express from 'express';
import {
    getDailySalesReport,
    getItemWiseSalesReport,
    getPaymentModeReport,
    exportReportToCSV,
    getDashboardStats,
} from '../controllers/reports.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/daily-sales', authenticate, authorize('ADMIN', 'MANAGER'), getDailySalesReport);
router.get('/item-wise', authenticate, authorize('ADMIN', 'MANAGER'), getItemWiseSalesReport);
router.get('/payment-modes', authenticate, authorize('ADMIN', 'MANAGER'), getPaymentModeReport);
router.get('/export/csv', authenticate, authorize('ADMIN', 'MANAGER'), exportReportToCSV);

export default router;
