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
        // Allow both local dev and Render frontend
        origin: [
            'http://localhost:5173', // local development
            'https://restaurant-pos-frontend-4jsr.onrender.com' // live frontend
        ],
    },
    pagination: {
        defaultLimit: 20,
        maxLimit: 100,
    },
    tax: {
        cgst: 2.5,
        sgst: 2.5,
    },
};
