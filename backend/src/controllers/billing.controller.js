import prisma from '../config/database.js';
import { generateBillNumber } from '../utils/generators.js';
import { config } from '../config/index.js';

export const generateBill = async (req, res) => {
    try {
        const { orderId, tableId, discount } = req.body; // discount is optional
        const userId = req.user.id;

        let ordersToBill = [];
        let existingBill = null;
        let newOrders = [];

        if (tableId) {
            // 1. Check for existing PENDING bill for this table
            existingBill = await prisma.bill.findFirst({
                where: {
                    orders: { some: { tableId } },
                    paymentStatus: 'PENDING'
                },
                include: {
                    orders: {
                        include: {
                            orderItems: {
                                include: { menuItem: true, variant: true }
                            }
                        }
                    }
                }
            });

            // 2. Find all unbilled, active orders for this table
            newOrders = await prisma.order.findMany({
                where: {
                    tableId,
                    billId: null,
                    status: { notIn: ['CANCELLED', 'COMPLETED'] }
                },
                include: {
                    orderItems: {
                        include: { menuItem: true, variant: true }
                    }
                }
            });

            if (existingBill) {
                ordersToBill = [...existingBill.orders, ...newOrders];
            } else {
                ordersToBill = newOrders;
            }

        } else if (orderId) {
            // Find specific order
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    orderItems: {
                        include: { menuItem: true, variant: true }
                    },
                    bill: true,
                },
            });

            if (order) {
                if (order.bill) {
                    return res.status(400).json({
                        success: false,
                        message: 'Bill already generated for this order',
                    });
                }
                ordersToBill = [order];
                newOrders = [order]; // All are "new" in this context
            }
        }

        if (ordersToBill.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active orders found to generate bill',
            });
        }

        // Calculate subtotal from all orders (existing + new)
        let subtotal = 0;
        ordersToBill.forEach(order => {
            order.orderItems.forEach(item => {
                subtotal += item.price * item.quantity;
            });
        });

        // Calculate tax dynamically
        const activeTaxes = await prisma.tax.findMany({ where: { isActive: true } });
        const taxRate = activeTaxes.reduce((sum, tax) => sum + tax.percentage, 0);
        const taxAmount = (subtotal * taxRate) / 100;

        // Determine discount
        // If discount is provided in request, use it.
        // If not, and existing bill has discount, use that.
        // Else 0.
        let finalDiscount = 0;
        if (discount !== undefined) {
            finalDiscount = parseFloat(discount);
        } else if (existingBill) {
            finalDiscount = existingBill.discount;
        }

        // Calculate total
        const totalAmount = subtotal + taxAmount - finalDiscount;

        let bill;

        if (existingBill) {
            // Update existing bill
            bill = await prisma.bill.update({
                where: { id: existingBill.id },
                data: {
                    subtotal,
                    taxAmount,
                    discount: finalDiscount,
                    totalAmount,
                    updatedAt: new Date(),
                    orders: {
                        connect: newOrders.map(o => ({ id: o.id }))
                    }
                },
                include: {
                    orders: {
                        include: {
                            orderItems: {
                                include: { menuItem: true, variant: true }
                            },
                            table: true,
                        },
                    },
                    user: { select: { name: true } },
                },
            });
        } else {
            // Create new bill
            const billNumber = generateBillNumber();
            bill = await prisma.bill.create({
                data: {
                    billNumber,
                    userId,
                    subtotal,
                    taxAmount,
                    discount: finalDiscount,
                    totalAmount,
                    orders: {
                        connect: ordersToBill.map(o => ({ id: o.id }))
                    }
                },
                include: {
                    orders: {
                        include: {
                            orderItems: {
                                include: { menuItem: true, variant: true }
                            },
                            table: true,
                        },
                    },
                    user: { select: { name: true } },
                },
            });
        }

        res.status(201).json({
            success: true,
            data: bill,
        });
    } catch (error) {
        console.error('Generate bill error:', error);
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
            orders: {
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
    const { paymentMode, paymentDetails } = req.body;

    // Validate split payment
    if (paymentMode === 'CASH_UPI') {
        if (!paymentDetails) {
            return res.status(400).json({
                success: false,
                message: 'Payment details required for split payment',
            });
        }

        // Find the bill to check total
        const currentBill = await prisma.bill.findUnique({ where: { id } });
        if (!currentBill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        const details = typeof paymentDetails === 'string' ? JSON.parse(paymentDetails) : paymentDetails;
        const totalPaid = (details.cash || 0) + (details.upi || 0);

        // Allow for tiny floating point differences
        if (Math.abs(totalPaid - currentBill.totalAmount) > 0.01) {
            return res.status(400).json({
                success: false,
                message: `Payment amount mismatch. Total: ${currentBill.totalAmount}, Paid: ${totalPaid}`,
            });
        }
    }

    const bill = await prisma.bill.update({
        where: { id },
        data: {
            paymentMode,
            paymentDetails: paymentDetails ? (typeof paymentDetails === 'string' ? paymentDetails : JSON.stringify(paymentDetails)) : null,
            paymentStatus: 'COMPLETED',
            paidAt: new Date(),
        },
        include: {
            orders: {
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

    // Update all orders status to completed
    await prisma.order.updateMany({
        where: { billId: id },
        data: { status: 'COMPLETED' },
    });

    // Free up table if dine-in (check first order's table)
    const tableId = bill.orders[0]?.tableId;
    if (tableId) {
        await prisma.table.update({
            where: { id: tableId },
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
            orders: {
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

    // Aggregate items from all orders
    const allItems = [];
    bill.orders.forEach(order => {
        order.orderItems.forEach(item => {
            allItems.push({
                name: item.variant ? `${item.menuItem.name} (${item.variant.name})` : item.menuItem.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
            });
        });
    });

    // Format receipt data
    const receipt = {
        billNumber: bill.billNumber,
        orderNumber: bill.orders.map(o => o.orderNumber).join(', '),
        date: bill.createdAt,
        table: bill.orders[0]?.table?.number,
        cashier: bill.user.name,
        items: allItems,
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
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            where.createdAt.gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    const bills = await prisma.bill.findMany({
        where,
        include: {
            orders: {
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
        orderBy: {
            createdAt: 'desc',
        },
    });

    res.json({
        success: true,
        data: bills,
    });
};
