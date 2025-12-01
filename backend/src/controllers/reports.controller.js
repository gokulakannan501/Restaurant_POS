import prisma from '../config/database.js';

export const getDailySalesReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    const where = {
        paymentStatus: 'COMPLETED',
    };

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
    } else {
        // Default to today if no date range provided
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        where.createdAt = {
            gte: startOfDay,
            lte: endOfDay,
        };
    }

    const bills = await prisma.bill.findMany({
        where,
        include: {
            order: {
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                        },
                    },
                },
            },
        },
    });

    const totalSales = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalOrders = bills.length;
    const totalTax = bills.reduce((sum, bill) => sum + bill.taxAmount, 0);
    const totalDiscount = bills.reduce((sum, bill) => sum + bill.discount, 0);

    // Payment mode breakdown
    const paymentModes = bills.reduce((acc, bill) => {
        const mode = bill.paymentMode || 'UNKNOWN';
        acc[mode] = (acc[mode] || 0) + bill.totalAmount;
        return acc;
    }, {});

    res.json({
        success: true,
        data: {
            date: startDate || new Date().toISOString().split('T')[0],
            totalSales,
            totalOrders,
            totalTax,
            totalDiscount,
            averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
            paymentModes,
            bills,
        },
    });
};

export const getItemWiseSalesReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    const where = {
        order: {
            bill: {
                paymentStatus: 'COMPLETED',
            },
        },
    };

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

    const orderItems = await prisma.orderItem.findMany({
        where,
        include: {
            menuItem: {
                select: {
                    id: true,
                    name: true,
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            variant: {
                select: {
                    name: true,
                },
            },
        },
    });

    // Aggregate by menu item
    const itemSales = orderItems.reduce((acc, item) => {
        const key = item.variantId
            ? `${item.menuItemId}-${item.variantId}`
            : item.menuItemId;

        if (!acc[key]) {
            acc[key] = {
                menuItemId: item.menuItemId,
                name: item.variant
                    ? `${item.menuItem.name} (${item.variant.name})`
                    : item.menuItem.name,
                category: item.menuItem.category.name,
                quantity: 0,
                revenue: 0,
            };
        }

        acc[key].quantity += item.quantity;
        acc[key].revenue += item.price * item.quantity;

        return acc;
    }, {});

    const sortedItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue);

    res.json({
        success: true,
        data: sortedItems,
    });
};

export const getPaymentModeReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    const where = {
        paymentStatus: 'COMPLETED',
    };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const bills = await prisma.bill.findMany({
        where,
        select: {
            paymentMode: true,
            totalAmount: true,
        },
    });

    const paymentModes = bills.reduce((acc, bill) => {
        const mode = bill.paymentMode || 'UNKNOWN';
        if (!acc[mode]) {
            acc[mode] = {
                mode,
                count: 0,
                total: 0,
            };
        }
        acc[mode].count += 1;
        acc[mode].total += bill.totalAmount;
        return acc;
    }, {});

    res.json({
        success: true,
        data: Object.values(paymentModes),
    });
};

export const exportReportToCSV = async (req, res) => {
    const { type, startDate, endDate } = req.query;

    let csvData = '';
    let filename = '';

    if (type === 'daily-sales') {
        const where = {
            paymentStatus: 'COMPLETED',
        };

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
        } else {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            where.createdAt = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        const bills = await prisma.bill.findMany({
            where,
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        type: true,
                    },
                },
            },
        });

        csvData = 'Bill Number,Order Number,Order Type,Subtotal,Tax,Discount,Total,Payment Mode,Date\n';
        bills.forEach(bill => {
            csvData += `${bill.billNumber},${bill.order.orderNumber},${bill.order.type},${bill.subtotal},${bill.taxAmount},${bill.discount},${bill.totalAmount},${bill.paymentMode},${bill.createdAt.toISOString()}\n`;
        });

        const dateStr = startDate || new Date().toISOString().split('T')[0];
        filename = `daily-sales-${dateStr}.csv`;
    } else if (type === 'item-wise') {
        const where = {
            order: {
                bill: {
                    paymentStatus: 'COMPLETED',
                },
            },
        };

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

        const orderItems = await prisma.orderItem.findMany({
            where,
            include: {
                menuItem: {
                    select: {
                        name: true,
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                variant: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        const itemSales = orderItems.reduce((acc, item) => {
            const key = item.variantId
                ? `${item.menuItemId}-${item.variantId}`
                : item.menuItemId;

            if (!acc[key]) {
                acc[key] = {
                    name: item.variant
                        ? `${item.menuItem.name} (${item.variant.name})`
                        : item.menuItem.name,
                    category: item.menuItem.category.name,
                    quantity: 0,
                    revenue: 0,
                };
            }

            acc[key].quantity += item.quantity;
            acc[key].revenue += item.price * item.quantity;

            return acc;
        }, {});

        csvData = 'Item Name,Category,Quantity Sold,Revenue\n';
        Object.values(itemSales).forEach(item => {
            csvData += `${item.name},${item.category},${item.quantity},${item.revenue}\n`;
        });

        filename = 'item-wise-sales.csv';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
};

export const getDashboardStats = async (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
        todaySales,
        todayOrders,
        activeOrders,
        occupiedTables,
        lowStockItems,
    ] = await Promise.all([
        prisma.bill.aggregate({
            where: {
                paymentStatus: 'COMPLETED',
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            _sum: {
                totalAmount: true,
            },
        }),
        prisma.order.count({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        }),
        prisma.order.count({
            where: {
                status: {
                    notIn: ['COMPLETED', 'CANCELLED'],
                },
            },
        }),
        prisma.table.count({
            where: {
                status: 'OCCUPIED',
            },
        }),
        prisma.inventoryItem.findMany().then(items =>
            items.filter(item => item.currentStock <= item.minStock).length
        ),
    ]);

    res.json({
        success: true,
        data: {
            todaySales: todaySales._sum.totalAmount || 0,
            todayOrders,
            activeOrders,
            occupiedTables,
            lowStockItems,
        },
    });
};
