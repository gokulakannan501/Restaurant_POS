import express from 'express';
import {
    getAllMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getAllCategories,
    createCategory,
    updateCategory,
} from '../controllers/menu.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Menu Items
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createMenuItem);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateMenuItem);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteMenuItem);

// Categories
router.get('/categories/all', getAllCategories);
router.post('/categories', authenticate, authorize('ADMIN', 'MANAGER'), createCategory);
router.put('/categories/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateCategory);

export default router;
