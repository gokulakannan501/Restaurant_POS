import prisma from '../config/database.js';

export const getAllInventoryItems = async (req, res) => {
    const { lowStock } = req.query;

    const where = {};
    if (lowStock === 'true') {
        where.currentStock = {
            lte: prisma.raw('min_stock'),
        };
    }

    const items = await prisma.inventoryItem.findMany({
        where,
        include: {
            menuItem: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            name: 'asc',
        },
    });

    // Filter low stock items manually since Prisma doesn't support column comparison in where
    const filteredItems = lowStock === 'true'
        ? items.filter(item => item.currentStock <= item.minStock)
        : items;

    res.json({
        success: true,
        data: filteredItems,
    });
};

export const getInventoryItemById = async (req, res) => {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
            menuItem: true,
        },
    });

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Inventory item not found',
        });
    }

    res.json({
        success: true,
        data: item,
    });
};

export const createInventoryItem = async (req, res) => {
    const { menuItemId, name, unit, currentStock, minStock, maxStock, lastRestocked } = req.body;

    const item = await prisma.inventoryItem.create({
        data: {
            menuItemId,
            name,
            unit,
            currentStock,
            minStock,
            maxStock,
            lastRestocked: lastRestocked ? new Date(lastRestocked) : new Date(),
        },
        include: {
            menuItem: true,
        },
    });

    res.status(201).json({
        success: true,
        data: item,
    });
};

export const updateInventoryItem = async (req, res) => {
    const { id } = req.params;
    const { name, unit, currentStock, minStock, maxStock, lastRestocked } = req.body;

    const data = {};
    if (name) data.name = name;
    if (unit) data.unit = unit;
    if (currentStock !== undefined) {
        data.currentStock = currentStock;
        // Only update lastRestocked automatically if not provided explicitly
        if (!lastRestocked) {
            data.lastRestocked = new Date();
        }
    }
    if (minStock !== undefined) data.minStock = minStock;
    if (maxStock !== undefined) data.maxStock = maxStock;
    if (lastRestocked) data.lastRestocked = new Date(lastRestocked);

    const item = await prisma.inventoryItem.update({
        where: { id },
        data,
        include: {
            menuItem: true,
        },
    });

    res.json({
        success: true,
        data: item,
    });
};

export const deleteInventoryItem = async (req, res) => {
    const { id } = req.params;

    await prisma.inventoryItem.delete({
        where: { id },
    });

    res.json({
        success: true,
        message: 'Inventory item deleted successfully',
    });
};

export const getLowStockAlerts = async (req, res) => {
    const items = await prisma.inventoryItem.findMany({
        include: {
            menuItem: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    const lowStockItems = items.filter(item => item.currentStock <= item.minStock);

    res.json({
        success: true,
        data: lowStockItems,
        count: lowStockItems.length,
    });
};

export const restockItem = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
    });

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Inventory item not found',
        });
    }

    const updatedItem = await prisma.inventoryItem.update({
        where: { id },
        data: {
            currentStock: item.currentStock + quantity,
            lastRestocked: new Date(),
        },
        include: {
            menuItem: true,
        },
    });

    res.json({
        success: true,
        data: updatedItem,
    });
};

export const exportInventoryCSV = async (req, res) => {
    try {
        const items = await prisma.inventoryItem.findMany({
            include: {
                menuItem: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Create CSV content
        const headers = ['Item Name', 'Unit', 'Current Stock', 'Min Stock', 'Max Stock', 'Last Restocked', 'Status'];
        const rows = items.map(item => {
            const status = item.currentStock <= item.minStock ? 'Low Stock' :
                item.maxStock && item.currentStock >= item.maxStock ? 'Overstocked' : 'Normal';
            return [
                item.name,
                item.unit,
                item.currentStock,
                item.minStock,
                item.maxStock || 'N/A',
                item.lastRestocked ? new Date(item.lastRestocked).toLocaleString() : 'Never',
                status
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=inventory-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting inventory CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export inventory',
        });
    }
};
