import prisma from '../config/database.js';

// Mark attendance (Admin only)
export const markAttendance = async (req, res) => {
    const { userId, date, status, notes } = req.body;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';

    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only admins can mark attendance.',
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
        const updateData = {
            status,
            notes: notes || existingRecord.notes,
        };

        // If marking present and no checkIn exists, set it
        if (status === 'PRESENT' && !existingRecord.checkIn) {
            const checkInTime = new Date(date);
            checkInTime.setHours(9, 0, 0, 0);
            updateData.checkIn = checkInTime;
        }

        attendance = await prisma.attendance.update({
            where: { id: existingRecord.id },
            data: updateData,
        });
    } else {
        // Create new
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const checkInTime = new Date(date);
        checkInTime.setHours(9, 0, 0, 0);

        attendance = await prisma.attendance.create({
            data: {
                userId,
                date: attendanceDate,
                status,
                notes: notes || '',
                checkIn: status === 'PRESENT' ? checkInTime : new Date(),
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
                totalHours: 0,
                lateCheckIns: 0,
                earlyCheckOuts: 0,
            };
        }

        userStats[userId].totalDays++;

        if (record.status === 'PRESENT') {
            userStats[userId].presentDays++;

            if (record.checkIn && record.checkOut) {
                const duration = new Date(record.checkOut) - new Date(record.checkIn);
                const hours = duration / (1000 * 60 * 60);
                userStats[userId].totalHours += hours;
            }

            // Check for late check-in (after 9:30 AM)
            if (record.checkIn) {
                const checkInTime = new Date(record.checkIn);
                const checkInHour = checkInTime.getHours();
                const checkInMinute = checkInTime.getMinutes();
                if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
                    userStats[userId].lateCheckIns++;
                }
            }

            // Check for early check-out (before 5:30 PM)
            if (record.checkOut) {
                const checkOutTime = new Date(record.checkOut);
                const checkOutHour = checkOutTime.getHours();
                const checkOutMinute = checkOutTime.getMinutes();
                if (checkOutHour < 17 || (checkOutHour === 17 && checkOutMinute < 30)) {
                    userStats[userId].earlyCheckOuts++;
                }
            }
        }
    });

    // Calculate averages
    Object.values(userStats).forEach(stats => {
        if (stats.presentDays > 0) {
            stats.averageHours = stats.totalHours / stats.presentDays;
        }
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
