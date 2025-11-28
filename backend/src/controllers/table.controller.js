import prisma from '../config/database.js';

export const getAllTables = async (req, res) => {
    const { status, floor } = req.query;

    const where = {};
    if (status) where.status = status;
    if (floor) where.floor = floor;

    const tables = await prisma.table.findMany({
        where,
        include: {
            orders: {
                where: {
                    status: {
                        notIn: ['COMPLETED', 'CANCELLED'],
                    },
                },
                include: {
                    orderItems: {
                        include: {
                            menuItem: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            number: 'asc',
        },
    });

    res.json({
        success: true,
        data: tables,
    });
};

export const getTableById = async (req, res) => {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
        where: { id },
        include: {
            orders: {
                where: {
                    status: {
                        notIn: ['COMPLETED', 'CANCELLED'],
                    },
                },
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                            variant: true,
                        },
                    },
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!table) {
        return res.status(404).json({
            success: false,
            message: 'Table not found',
        });
    }

    res.json({
        success: true,
        data: table,
    });
};

export const createTable = async (req, res) => {
    const { number, capacity, floor, position } = req.body;

    const table = await prisma.table.create({
        data: {
            number,
            capacity,
            floor,
            position: position ? JSON.stringify(position) : null,
        },
    });

    res.status(201).json({
        success: true,
        data: table,
    });
};

export const updateTable = async (req, res) => {
    const { id } = req.params;
    const { number, capacity, floor, position, status } = req.body;

    const data = {};
    if (number) data.number = number;
    if (capacity) data.capacity = capacity;
    if (floor !== undefined) data.floor = floor;
    if (position !== undefined) data.position = JSON.stringify(position);
    if (status) data.status = status;

    const table = await prisma.table.update({
        where: { id },
        data,
    });

    res.json({
        success: true,
        data: table,
    });
};

export const updateTableStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const table = await prisma.table.update({
        where: { id },
        data: { status },
    });

    res.json({
        success: true,
        data: table,
    });
};

export const deleteTable = async (req, res) => {
    const { id } = req.params;

    // Check if table has active orders
    const activeOrders = await prisma.order.count({
        where: {
            tableId: id,
            status: {
                notIn: ['COMPLETED', 'CANCELLED'],
            },
        },
    });

    if (activeOrders > 0) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete table with active orders',
        });
    }

    await prisma.table.delete({
        where: { id },
    });

    res.json({
        success: true,
        message: 'Table deleted successfully',
    });
};
