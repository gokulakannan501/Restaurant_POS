import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

export const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.isActive) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials or account inactive',
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials',
        });
    }

    const token = generateToken(user.id);

    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
            },
            token,
        },
    });
};

export const logout = async (req, res) => {
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
            email: true,
            role: true,
            permissions: true,
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
    const { name, email, password, role, permissions } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User with this email already exists',
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            permissions: permissions || [],
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
            isActive: true,
            createdAt: true,
        },
    });

    // TODO: Send email with temporary password

    res.status(201).json({
        success: true,
        data: user,
    });
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, permissions, isActive } = req.body;

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);
    if (role) data.role = role;
    if (permissions) data.permissions = permissions;
    if (typeof isActive === 'boolean') data.isActive = isActive;

    const user = await prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
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
            email: true,
            role: true,
            permissions: true,
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

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(400).json({
            success: false,
            message: 'Incorrect current password',
        });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    res.json({
        success: true,
        message: 'Password updated successfully',
    });
};
