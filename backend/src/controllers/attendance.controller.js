import prisma from '../config/database.js';

// Mark attendance (Users with attendance permission)
export const markAttendance = async (req, res) => {
    const { userId, date, status, notes } = req.body;

    // Check if user has attendance permission
    const userPermissions = req.user.permissions ? JSON.parse(req.user.permissions) : [];
    const hasAttendancePermission = userPermissions.includes('attendance') || req.user.role === 'ADMIN';

    if (!hasAttendancePermission) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You need attendance permission to mark attendance.',
        });
    }

    // Create date range for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if record exists for this user on this date
    const existingRecord = await prisma.attendance.findFirst({
        where: {
            userId,
            date: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    let attendance;

    if (existingRecord) {
        // Update existing
        attendance = await prisma.attendance.update({
            where: { id: existingRecord.id },
            data: {
                status,
                notes: notes !== undefined ? notes : existingRecord.notes,
            },
        });
    } else {
        // Create new
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        attendance = await prisma.attendance.create({
            data: {
                userId,
                date: attendanceDate,
                status,
                notes: notes || '',
            },
        });
    }

    res.json({
        success: true,
        data: attendance,
        message: 'Attendance marked successfully',
    });
};

// Get attendance records
export const getAttendance = async (req, res) => {
    const { userId, startDate, endDate } = req.query;

    // Check if user has attendance permission
    const userPermissions = req.user.permissions ? JSON.parse(req.user.permissions) : [];
    const hasAttendancePermission = userPermissions.includes('attendance') || req.user.role === 'ADMIN';

    const where = {};

    // Users with attendance permission can see all users
    // Users without it can only see their own attendance
    if (!hasAttendancePermission) {
        where.userId = req.user.id;
    } else if (userId) {
        // User with permission requesting specific user's attendance
        where.userId = userId;
    }
    // If user has permission and no userId specified, return all users (no userId filter)

    if (startDate || endDate) {
        where.date = {};
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            where.date.gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.date.lte = end;
        }
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

// Get attendance report
export const getReport = async (req, res) => {
    const { startDate, endDate, userId } = req.query;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';

    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Access denied',
        });
    }

    const where = {};

    if (userId) {
        where.userId = userId;
    }

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    // Get all attendance records
    const attendance = await prisma.attendance.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
        },
    });

    // Calculate statistics per user
    const userStats = {};

    attendance.forEach(record => {
        const userId = record.userId;
        if (!userStats[userId]) {
            userStats[userId] = {
                userId,
                userName: record.user.name,
                userRole: record.user.role,
                totalDays: 0,
                presentDays: 0,
                absentDays: 0,
                notes: [], // Collect all notes
            };
        }

        userStats[userId].totalDays++;

        if (record.status === 'PRESENT') {
            userStats[userId].presentDays++;
        } else if (record.status === 'ABSENT') {
            userStats[userId].absentDays++;
        }

        // Collect notes if they exist
        if (record.notes) {
            userStats[userId].notes.push({
                date: record.date,
                note: record.notes
            });
        }
    });

    // Format notes for display
    Object.values(userStats).forEach(stats => {
        // Convert notes array to a readable string
        stats.notesText = stats.notes.map(n =>
            `${new Date(n.date).toLocaleDateString()}: ${n.note}`
        ).join('; ') || 'No notes';
    });

    // Convert to array and sort by name
    const report = Object.values(userStats).sort((a, b) =>
        a.userName.localeCompare(b.userName)
    );

    res.json({
        success: true,
        data: {
            report,
            summary: {
                totalEmployees: report.length,
                totalAttendanceRecords: attendance.length,
                dateRange: {
                    start: startDate || 'All time',
                    end: endDate || 'Present',
                },
            },
        },
    });
};
