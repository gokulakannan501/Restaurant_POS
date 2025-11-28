import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
    try {
        // Bypass authentication for demo purposes
        // Fetch the first available user (preferably ADMIN) from the database
        // This ensures we have a valid userId for foreign key constraints
        let user = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!user) {
            user = await prisma.user.findFirst();
        }

        if (!user) {
            // If absolutely no user exists, create a default one
            // This handles the case of an empty database
            user = await prisma.user.create({
                data: {
                    name: 'Default Admin',
                    pin: '0000',
                    role: 'ADMIN',
                    isActive: true
                }
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
        }

        next();
    };
};
