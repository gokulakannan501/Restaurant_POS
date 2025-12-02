import express from 'express';
import {
    login,
    logout,
    getCurrentUser,
    createUser,
    updateUser,
    getAllUsers,
    changePassword,
    deleteUser,
} from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, createUserSchema, updateUserSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/users', authenticate, authorize('ADMIN', 'MANAGER'), getAllUsers);
router.post('/users', authenticate, authorize('ADMIN'), validate(createUserSchema), createUser);
router.put('/users/:id', authenticate, authorize('ADMIN'), validate(updateUserSchema), updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser);

export default router;
