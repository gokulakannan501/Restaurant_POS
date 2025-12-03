import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkIn, checkOut, getAttendance, getStatus } from '../controllers/attendance.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Check in
router.post('/check-in', checkIn);

// Check out
router.post('/check-out', checkOut);

// Get attendance records
router.get('/', getAttendance);

// Get current status
router.get('/status', getStatus);

export default router;
