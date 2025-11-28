import { config } from '../config/index.js';

export const getPagination = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(
        parseInt(query.limit) || config.pagination.defaultLimit,
        config.pagination.maxLimit
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const getPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};
