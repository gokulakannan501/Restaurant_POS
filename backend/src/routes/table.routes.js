import express from 'express';
import {
    getAllTables,
    getTableById,
    createTable,
    updateTable,
    updateTableStatus,
    deleteTable,
} from '../controllers/table.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllTables);
router.get('/:id', authenticate, getTableById);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createTable);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateTable);
router.patch('/:id/status', authenticate, updateTableStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTable);

export default router;
