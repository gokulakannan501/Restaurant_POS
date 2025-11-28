import prisma from '../config/database.js';
import { generateBillNumber } from '../utils/generators.js';
import { config } from '../config/index.js';

export const generateBill = async (req, res) => {
    try {
        const { orderId, discount = 0 } = req.body;
        const userId = req.user.id;

        // Get order with items
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
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

        if (order.bill) {
            return res.status(400).json({
                success: false,
                message: 'Bill already generated for this order',
            });
        }

        // Calculate subtotal
        const subtotal = order.orderItems.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);

        // Calculate tax dynamically
        const activeTaxes = await prisma.tax.findMany({ where: { isActive: true } });
        const taxRate = activeTaxes.reduce((sum, tax) => sum + tax.percentage, 0);
        const taxAmount = (subtotal * taxRate) / 100;

        // Calculate total
        const totalAmount = subtotal + taxAmount - discount;

        const billNumber = generateBillNumber();

        const bill = await prisma.bill.create({
            data: {
                billNumber,
                orderId,
                userId,
                subtotal,
                taxAmount,
                discount,
                totalAmount,
            },
            include: {
                order: {
                    include: {
                        orderItems: {
                            include: {
                                menuItem: true,
                                variant: true,
                            },
                        },
                        table: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: bill,
        });
    } catch (error) {
        console.error('Generate bill error:', error);

        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Bill already generated for this order',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to generate bill',
            error: error.message
        });
    }
};

export const getBillById = async (req, res) => {
    const { id } = req.params;

    const bill = await prisma.bill.findUnique({
        where: { id },
        include: {
            order: {
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                            variant: true,
                        },
                    },
                    table: true,
                },
            },
            user: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!bill) {
        return res.status(404).json({
            success: false,
            message: 'Bill not found',
        });
    }

    res.json({
        success: true,
        data: bill,
    });
};

export const processPayment = async (req, res) => {
    const { id } = req.params;
    const { paymentMode } = req.body;

    const bill = await prisma.bill.update({
        where: { id },
        data: {
            paymentMode,
            paymentStatus: 'COMPLETED',
            paidAt: new Date(),
        },
        include: {
            order: {
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                            variant: true,
                        },
                    },
                    table: true,
                },
            },
        },
    });

    // Update order status to completed
    await prisma.order.update({
        where: { id: bill.orderId },
        data: { status: 'COMPLETED' },
    });

    // Free up table if dine-in
    if (bill.order.tableId) {
        await prisma.table.update({
            where: { id: bill.order.tableId },
            data: { status: 'AVAILABLE' },
        });
    }

    res.json({
        success: true,
        data: bill,
    });
};

export const getReceipt = async (req, res) => {
    const { id } = req.params;

    const bill = await prisma.bill.findUnique({
        where: { id },
        include: {
            order: {
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                            variant: true,
                        },
                    },
                    table: true,
                },
            },
            user: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!bill) {
        return res.status(404).json({
            success: false,
            message: 'Bill not found',
        });
    }

    // Get active taxes for breakdown (assuming taxes haven't changed)
    const activeTaxes = await prisma.tax.findMany({ where: { isActive: true } });
    const taxBreakdown = activeTaxes.reduce((acc, tax) => {
        acc[tax.name] = (bill.subtotal * tax.percentage) / 100;
        return acc;
    }, {});

    // Format receipt data
    const receipt = {
        billNumber: bill.billNumber,
        orderNumber: bill.order.orderNumber,
        date: bill.createdAt,
        table: bill.order.table?.number,
        cashier: bill.user.name,
        items: bill.order.orderItems.map((item) => ({
            name: item.variant ? `${item.menuItem.name} (${item.variant.name})` : item.menuItem.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
        })),
        subtotal: bill.subtotal,
        tax: {
            ...taxBreakdown,
            total: bill.taxAmount,
        },
        discount: bill.discount,
        total: bill.totalAmount,
        paymentMode: bill.paymentMode,
        paymentStatus: bill.paymentStatus,
    };

    res.json({
        success: true,
        data: receipt,
    });
};

export const getAllBills = async (req, res) => {
    const { paymentStatus, startDate, endDate } = req.query;

    const where = {};
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const bills = await prisma.bill.findMany({
        where,
        include: {
            order: {
                select: {
                    orderNumber: true,
                    type: true,
                    table: {
                        select: {
                            number: true,
                        },
                    },
                },
            },
            user: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    res.json({
        success: true,
        data: bills,
    });
};
