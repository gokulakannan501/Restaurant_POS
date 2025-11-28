import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
    pagination: {
        defaultLimit: 20,
        maxLimit: 100,
    },
    tax: {
        cgst: 2.5, // 2.5%
        sgst: 2.5, // 2.5%
    },
};
