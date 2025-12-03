import express from 'express';
import authRoutes from './auth.routes.js';
import menuRoutes from './menu.routes.js';
import orderRoutes from './order.routes.js';
import tableRoutes from './table.routes.js';
import billingRoutes from './billing.routes.js';
import inventoryRoutes from './inventory.routes.js';
import reportsRoutes from './reports.routes.js';
import taxRoutes from './tax.routes.js';
import uploadRoutes from './upload.routes.js';
import attendanceRoutes from './attendance.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/tables', tableRoutes);
router.use('/billing', billingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportsRoutes);
router.use('/taxes', taxRoutes);
router.use('/upload', uploadRoutes);
router.use('/attendance', attendanceRoutes);

export default router;
