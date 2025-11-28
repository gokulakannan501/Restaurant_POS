import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

export const login = async (req, res) => {
    const { pin } = req.body;

    const user = await prisma.user.findUnique({
        where: { pin: await bcrypt.hash(pin, 10) },
        select: {
            id: true,
            name: true,
            pin: true,
            role: true,
            isActive: true,
        },
    });

    // Since we can't query by hashed PIN directly, we need to get all users and compare
    const allUsers = await prisma.user.findMany({
        where: { isActive: true },
    });

    let authenticatedUser = null;
    for (const u of allUsers) {
        const isMatch = await bcrypt.compare(pin, u.pin);
        if (isMatch) {
            authenticatedUser = u;
            break;
        }
    }

    if (!authenticatedUser) {
        return res.status(401).json({
            success: false,
            message: 'Invalid PIN',
        });
    }

    const token = generateToken(authenticatedUser.id);

    res.json({
        success: true,
        data: {
            user: {
                id: authenticatedUser.id,
                name: authenticatedUser.name,
                role: authenticatedUser.role,
            },
            token,
        },
    });
};

export const logout = async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
};

export const getCurrentUser = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });

    res.json({
        success: true,
        data: user,
    });
};

export const createUser = async (req, res) => {
    const { name, pin, role } = req.body;

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await prisma.user.create({
        data: {
            name,
            pin: hashedPin,
            role,
        },
        select: {
            id: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });

    res.status(201).json({
        success: true,
        data: user,
    });
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, pin, role, isActive } = req.body;

    const data = {};
    if (name) data.name = name;
    if (pin) data.pin = await bcrypt.hash(pin, 10);
    if (role) data.role = role;
    if (typeof isActive === 'boolean') data.isActive = isActive;

    const user = await prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            role: true,
            isActive: true,
            updatedAt: true,
        },
    });

    res.json({
        success: true,
        data: user,
    });
};

export const getAllUsers = async (req, res) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    res.json({
        success: true,
        data: users,
    });
};
