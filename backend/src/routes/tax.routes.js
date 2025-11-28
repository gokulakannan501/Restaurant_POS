import express from 'express';
import { getTaxes, createTax, updateTax, deleteTax } from '../controllers/tax.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTaxes);
router.post('/', authorize('ADMIN', 'MANAGER'), createTax);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateTax);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteTax);

export default router;
