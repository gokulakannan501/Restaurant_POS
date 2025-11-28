import prisma from '../config/database.js';

export const getTaxes = async (req, res) => {
    const taxes = await prisma.tax.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: taxes });
};

export const createTax = async (req, res) => {
    const { name, percentage, isActive } = req.body;

    const tax = await prisma.tax.create({
        data: {
            name,
            percentage: parseFloat(percentage),
            isActive: isActive !== undefined ? isActive : true
        }
    });

    res.status(201).json({ success: true, data: tax });
};

export const updateTax = async (req, res) => {
    const { id } = req.params;
    const { name, percentage, isActive } = req.body;

    const tax = await prisma.tax.update({
        where: { id },
        data: {
            name,
            percentage: percentage !== undefined ? parseFloat(percentage) : undefined,
            isActive
        }
    });

    res.json({ success: true, data: tax });
};

export const deleteTax = async (req, res) => {
    const { id } = req.params;

    await prisma.tax.delete({
        where: { id }
    });

    res.json({ success: true, message: 'Tax deleted successfully' });
};
