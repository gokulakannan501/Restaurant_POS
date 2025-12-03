import prisma from '../config/database.js';

// Check in
export const checkIn = async (req, res) => {
    const userId = req.user.id;
    const { notes } = req.body;

    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckIn = await prisma.attendance.findFirst({
        where: {
            userId,
            date: {
                gte: today,
            },
            checkOut: null,
        },
    });

    if (existingCheckIn) {
        return res.status(400).json({
            success: false,
            message: 'Already checked in today',
        });
    }

    const attendance = await prisma.attendance.create({
        data: {
            userId,
            notes,
            date: today,
        },
    });

    res.status(201).json({
        success: true,
        data: attendance,
        message: 'Checked in successfully',
    });
};

// Check out
export const checkOut = async (req, res) => {
    const userId = req.user.id;
    const { notes } = req.body;

    // Find today's check-in record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
        where: {
            userId,
            date: {
                gte: today,
            },
            checkOut: null,
        },
    });

    if (!attendance) {
        return res.status(400).json({
            success: false,
            message: 'No active check-in found',
        });
    }

    const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
            checkOut: new Date(),
            notes: notes || attendance.notes,
        },
    });

    res.json({
        success: true,
        data: updatedAttendance,
        message: 'Checked out successfully',
    });
};

// Get attendance records
export const getAttendance = async (req, res) => {
    const { userId, startDate, endDate } = req.query;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';

    const where = {};

    // Non-admins can only see their own attendance
    if (!isAdmin || !userId) {
        where.userId = req.user.id;
    } else if (userId) {
        where.userId = userId;
    }

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    const attendance = await prisma.attendance.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: {
            checkIn: 'desc',
        },
    });

    res.json({
        success: true,
        data: attendance,
    });
};

// Get current status
export const getStatus = async (req, res) => {
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
        where: {
            userId,
            date: {
                gte: today,
            },
            checkOut: null,
        },
    });

    res.json({
        success: true,
        data: {
            isCheckedIn: !!attendance,
            attendance: attendance || null,
        },
    });
};
