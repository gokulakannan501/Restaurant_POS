import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

export const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { mobile: email } // Allow login with mobile number (passed in email field)
            ]
        },
    });

    if (!user || !user.isActive || user.isDeleted) {
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
                mobile: user.mobile,
                role: user.role,
                permissions: user.permissions ? JSON.parse(user.permissions) : [],
                isFirstLogin: user.isFirstLogin,
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
            mobile: true,
            role: true,
            permissions: true,
            isActive: true,
            isFirstLogin: true,
            createdAt: true,
        },
    });

    res.json({
        success: true,
        data: {
            ...user,
            permissions: user.permissions ? JSON.parse(user.permissions) : [],
        },
    });
};

export const createUser = async (req, res) => {
    const { name, email, mobile, password, role, permissions } = req.body;

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { mobile: mobile || undefined }
            ]
        },
    });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User with this email or mobile already exists',
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            mobile,
            password: hashedPassword,
            role,
            permissions: permissions ? JSON.stringify(permissions) : null,
            isFirstLogin: true, // New users must change password on first login
        },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            permissions: true,
            isActive: true,
            isFirstLogin: true,
            createdAt: true,
        },
    });

    // Parse permissions for response
    const responseUser = {
        ...user,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
    };

    res.status(201).json({
        success: true,
        data: responseUser,
        message: `User created successfully. Temp Password: ${password}`,
    });
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, mobile, password, role, permissions, isActive } = req.body;

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (mobile) data.mobile = mobile;
    if (password) {
        data.password = await bcrypt.hash(password, 10);
        data.isFirstLogin = false; // Password has been changed
    }
    if (role) data.role = role;
    if (permissions) data.permissions = JSON.stringify(permissions);
    if (typeof isActive === 'boolean') data.isActive = isActive;

    const user = await prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            permissions: true,
            isActive: true,
            isFirstLogin: true,
            updatedAt: true,
        },
    });

    res.json({
        success: true,
        data: {
            ...user,
            permissions: user.permissions ? JSON.parse(user.permissions) : [],
        },
    });
};

export const getAllUsers = async (req, res) => {
    const users = await prisma.user.findMany({
        where: {
            isDeleted: false,
        },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            permissions: true,
            isActive: true,
            isFirstLogin: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    res.json({
        success: true,
        data: users.map(user => ({
            ...user,
            permissions: user.permissions ? JSON.parse(user.permissions) : [],
        })),
    });
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    // If it's the user's first login, skip current password validation
    if (!user.isFirstLogin) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect current password',
            });
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            isFirstLogin: false,
        },
    });

    res.json({
        success: true,
        message: 'Password updated successfully',
    });
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete your own account',
        });
    }

    // Soft delete: set isDeleted to true and rename email to free it up
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    await prisma.user.update({
        where: { id },
        data: {
            isDeleted: true,
            isActive: false,
            email: `deleted_${Date.now()}_${user.email}`
        },
    });

    res.json({
        success: true,
        message: 'User deleted successfully',
    });
};
