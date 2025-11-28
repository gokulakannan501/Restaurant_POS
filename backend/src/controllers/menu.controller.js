import prisma from '../config/database.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';

export const getAllMenuItems = async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const { categoryId, isAvailable, search } = req.query;

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.menuItem.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                variants: {
                    where: { isActive: true },
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        }),
        prisma.menuItem.count({ where }),
    ]);

    res.json({
        success: true,
        data: items,
        meta: getPaginationMeta(total, page, limit),
    });
};

export const getMenuItemById = async (req, res) => {
    const { id } = req.params;

    const item = await prisma.menuItem.findUnique({
        where: { id },
        include: {
            category: true,
            variants: {
                where: { isActive: true },
            },
        },
    });

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Menu item not found',
        });
    }

    res.json({
        success: true,
        data: item,
    });
};

export const createMenuItem = async (req, res) => {
    const { name, description, price, categoryId, isVeg, image, variants } = req.body;

    const item = await prisma.menuItem.create({
        data: {
            name,
            description,
            price,
            categoryId,
            isVeg,
            image,
            ...(variants && {
                variants: {
                    create: variants,
                },
            }),
        },
        include: {
            category: true,
            variants: true,
        },
    });

    res.status(201).json({
        success: true,
        data: item,
    });
};

export const updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, categoryId, isVeg, isAvailable, image } = req.body;

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (price) data.price = price;
    if (categoryId) data.categoryId = categoryId;
    if (typeof isVeg === 'boolean') data.isVeg = isVeg;
    if (typeof isAvailable === 'boolean') data.isAvailable = isAvailable;
    if (image !== undefined) data.image = image;

    const item = await prisma.menuItem.update({
        where: { id },
        data,
        include: {
            category: true,
            variants: true,
        },
    });

    res.json({
        success: true,
        data: item,
    });
};

export const deleteMenuItem = async (req, res) => {
    const { id } = req.params;

    await prisma.menuItem.delete({
        where: { id },
    });

    res.json({
        success: true,
        message: 'Menu item deleted successfully',
    });
};

export const getAllCategories = async (req, res) => {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: { menuItems: true },
            },
        },
        orderBy: {
            sortOrder: 'asc',
        },
    });

    res.json({
        success: true,
        data: categories,
    });
};

export const createCategory = async (req, res) => {
    const { name, description, sortOrder } = req.body;

    const category = await prisma.category.create({
        data: {
            name,
            description,
            sortOrder,
        },
    });

    res.status(201).json({
        success: true,
        data: category,
    });
};

export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (typeof isActive === 'boolean') data.isActive = isActive;

    const category = await prisma.category.update({
        where: { id },
        data,
    });

    res.json({
        success: true,
        data: category,
    });
};
