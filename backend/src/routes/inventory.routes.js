import express from 'express';
import {
    getAllInventoryItems,
    getInventoryItemById,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getLowStockAlerts,
    restockItem,
    exportInventoryCSV,
} from '../controllers/inventory.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllInventoryItems);
router.get('/alerts', authenticate, getLowStockAlerts);
router.get('/export/csv', authenticate, exportInventoryCSV);
router.get('/:id', authenticate, getInventoryItemById);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createInventoryItem);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateInventoryItem);
router.post('/:id/restock', authenticate, authorize('ADMIN', 'MANAGER'), restockItem);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteInventoryItem);

export default router;
