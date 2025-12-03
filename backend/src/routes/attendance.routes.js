import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { markAttendance, getAttendance, getStatus, getReport } from '../controllers/attendance.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Mark attendance (Admin only)
router.post('/mark', markAttendance);

// Get attendance records
router.get('/', getAttendance);

// Get current status
router.get('/status', getStatus);

// Get attendance report
router.get('/report', getReport);

export default router;
