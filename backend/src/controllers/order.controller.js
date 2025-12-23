import prisma from '../config/database.js';
import { generateOrderNumber } from '../utils/generators.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';

export const getAllOrders = async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const { status, type, tableId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (tableId) where.tableId = tableId;

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                            },
                        },
                        variant: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                            },
                        },
                    },
                },
                bill: {
                    select: {
                        id: true,
                        billNumber: true,
                        totalAmount: true,
                        paymentStatus: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        }),
        prisma.order.count({ where }),
    ]);

    res.json({
        success: true,
        data: orders,
        meta: getPaginationMeta(total, page, limit),
    });
};

export const getOrderById = async (req, res) => {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            table: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
            orderItems: {
                include: {
                    menuItem: true,
                    variant: true,
                },
            },
            bill: true,
        },
    });

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found',
        });
    }

    res.json({
        success: true,
        data: order,
    });
};

export const createOrder = async (req, res) => {
    const { type, tableId, customerName, customerPhone, notes, items } = req.body;
    const userId = req.user.id;

    // Validate table if dine-in
    if (type === 'DINE_IN' && !tableId) {
        return res.status(400).json({
            success: false,
            message: 'Table is required for dine-in orders',
        });
    }

    // Calculate prices for items
    const itemsWithPrices = await Promise.all(
        items.map(async (item) => {
            if (item.variantId) {
                const variant = await prisma.menuVariant.findUnique({
                    where: { id: item.variantId },
                });
                return {
                    ...item,
                    price: variant.price,
                };
            } else {
                const menuItem = await prisma.menuItem.findUnique({
                    where: { id: item.menuItemId },
                });
                return {
                    ...item,
                    price: menuItem.price,
                };
            }
        })
    );

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
        data: {
            orderNumber,
            type,
            tableId,
            userId,
            customerName,
            customerPhone,
            notes,
            orderItems: {
                create: itemsWithPrices.map((item) => ({
                    menuItemId: item.menuItemId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.price,
                    notes: item.notes,
                })),
            },
        },
        include: {
            table: true,
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            orderItems: {
                include: {
                    menuItem: true,
                    variant: true,
                },
            },
        },
    });

    // Update table status if dine-in
    if (type === 'DINE_IN' && tableId) {
        await prisma.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' },
        });
    }

    res.status(201).json({
        success: true,
        data: order,
    });
};

export const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const data = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const order = await prisma.order.update({
        where: { id },
        data,
        include: {
            table: true,
            orderItems: {
                include: {
                    menuItem: true,
                    variant: true,
                },
            },
        },
    });

    res.json({
        success: true,
        data: order,
    });
};

export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
            table: true,
            orderItems: {
                include: {
                    menuItem: true,
                    variant: true,
                },
            },
        },
    });

    // If order is completed or cancelled, free up the table
    if ((status === 'COMPLETED' || status === 'CANCELLED') && order.tableId) {
        await prisma.table.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' },
        });
    }

    res.json({
        success: true,
        data: order,
    });
};

export const deleteOrder = async (req, res) => {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
        where: { id },
        select: { tableId: true },
    });

    await prisma.order.delete({
        where: { id },
    });

    // Free up table if it was occupied
    if (order.tableId) {
        await prisma.table.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' },
        });
    }

    res.json({
        success: true,
        message: 'Order deleted successfully',
    });
};

export const deleteOrderItem = async (req, res) => {
    const { orderId, itemId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { bill: true }
    });

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    if (order.bill) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete items from a billed order'
        });
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete items from a completed or cancelled order'
        });
    }

    await prisma.orderItem.delete({
        where: {
            id: itemId,
            orderId: orderId // Ensure item belongs to this order
        }
    });

    res.json({
        success: true,
        message: 'Item removed from order'
    });
};
