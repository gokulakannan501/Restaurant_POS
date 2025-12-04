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
            email: `deleted_${Date.now()}_${user.email}`,
            mobile: user.mobile ? `deleted_${Date.now()}_${user.mobile}` : null
        },
    });

    res.json({
        success: true,
        message: 'User deleted successfully',
    });
};

// Update own profile (for regular users)
export const updateOwnProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, mobile } = req.body;

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (mobile !== undefined) data.mobile = mobile; // Allow setting to empty string

    const user = await prisma.user.update({
        where: { id: userId },
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

// Cleanup deleted users (Admin only)
export const cleanupDeletedUsers = async (req, res) => {
    try {
        // Find all deleted users
        const deletedUsers = await prisma.user.findMany({
            where: {
                isDeleted: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true
            }
        });

        if (deletedUsers.length === 0) {
            return res.json({
                success: true,
                message: 'No deleted users found. Database is clean!',
                data: { count: 0, users: [] }
            });
        }

        // Update each deleted user
        const timestamp = Date.now();
        const updatePromises = deletedUsers.map((user, index) => {
            const uniqueTimestamp = timestamp + index;
            return prisma.user.update({
                where: { id: user.id },
                data: {
                    email: `deleted_${uniqueTimestamp}_${user.email}`,
                    mobile: user.mobile ? `deleted_${uniqueTimestamp}_${user.mobile}` : null
                }
            });
        });

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: `Successfully cleaned up ${deletedUsers.length} deleted user(s)`,
            data: {
                count: deletedUsers.length,
                users: deletedUsers.map(u => ({ name: u.name, email: u.email, mobile: u.mobile }))
            }
        });
    } catch (error) {
        console.error('Error cleaning up deleted users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup deleted users',
            error: error.message
        });
    }
};

