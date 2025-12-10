import React, { useEffect, useState } from 'react';
import api, { BASE_URL } from '../services/api';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Menu = () => {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        isVeg: true,
        isAvailable: true,
        image: ''
    });
    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        description: '',
        sortOrder: 0
    });

    const { addItem, items: cartItems, updateQuantity } = useCartStore();
    const { user } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const tableInfo = location.state;

    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catsRes, itemsRes] = await Promise.all([
                api.get('/menu/categories/all'),
                api.get('/menu?limit=1000')
            ]);
            setCategories(catsRes.data.data);
            setMenuItems(itemsRes.data.data);
        } catch (error) {
            console.error('Error fetching menu:', error);
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'ALL' || item.categoryId === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddToCart = (item) => {
        if (item.variants && item.variants.length > 0) {
            addItem(item, item.variants[0], 1);
        } else {
            addItem(item, null, 1);
        }
        toast.success(`Added ${item.name} to cart`);
    };

    const handleOpenModal = (item = null) => {
        setSelectedFile(null);
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                price: item.price,
                categoryId: item.categoryId,
                isVeg: item.isVeg,
                isAvailable: item.isAvailable,
                image: item.image || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                categoryId: categories[0]?.id || '',
                isVeg: true,
                isAvailable: true,
                image: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setSelectedFile(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            categoryId: '',
            isVeg: true,
            isAvailable: true,
            image: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let imageUrl = formData.image;

            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('image', selectedFile);
                const uploadRes = await api.post('/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.imageUrl;
            }

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                image: imageUrl
            };

            if (editingItem) {
                await api.put(`/menu/${editingItem.id}`, payload);
                toast.success('Menu item updated successfully');
            } else {
                await api.post('/menu', payload);
                toast.success('Menu item added successfully');
            }

            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error('Error saving menu item:', error);
            toast.error('Failed to save menu item');
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            await api.delete(`/menu/${itemId}`);
            toast.success('Menu item deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting menu item:', error);
            toast.error('Failed to delete menu item');
        }
    };

    const handleToggleAvailability = async (item) => {
        try {
            await api.put(`/menu/${item.id}`, { isAvailable: !item.isAvailable });
            toast.success(`${item.name} is now ${!item.isAvailable ? 'available' : 'unavailable'}`);
            fetchData();
        } catch (error) {
            console.error('Error updating availability:', error);
            toast.error('Failed to update availability');
        }
    };

    // Category Management Functions
    const handleOpenCategoryModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setCategoryFormData({
                name: category.name,
                description: category.description || '',
                sortOrder: category.sortOrder || 0
            });
        } else {
            setEditingCategory(null);
            setCategoryFormData({
                name: '',
                description: '',
                sortOrder: categories.length
            });
        }
        setShowCategoryModal(true);
    };

    const handleCloseCategoryModal = () => {
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryFormData({
            name: '',
            description: '',
            sortOrder: 0
        });
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...categoryFormData,
                sortOrder: parseInt(categoryFormData.sortOrder)
            };

            if (editingCategory) {
                await api.put(`/menu/categories/${editingCategory.id}`, payload);
                toast.success('Category updated successfully');
            } else {
                await api.post('/menu/categories', payload);
                toast.success('Category added successfully');
            }

            handleCloseCategoryModal();
            fetchData();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header Section */}
            <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
                {/* Title and Table Info */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Menu</h1>
                    {tableInfo && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Ordering for Table {tableInfo.tableNumber}
                        </p>
                    )}
                </div>

                {/* Search and Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {isAdminOrManager && (
                            <>
                                <button
                                    onClick={() => handleOpenCategoryModal()}
                                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-green-600/30 flex items-center justify-center text-sm whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Category
                                </button>
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary-600/30 flex items-center justify-center text-sm whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Item
                                </button>
                            </>
                        )}
                        {cartItems.length > 0 && (
                            <button
                                onClick={() => navigate('/orders/new')}
                                className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors relative shadow-lg shadow-primary-600/30 text-sm"
                            >
                                View Cart
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                                    {cartItems.length}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex space-x-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${activeCategory === 'ALL'
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent'
                        }`}
                >
                    All Items
                </button>
                {categories.map((cat) => (
                    <div key={cat.id} className="relative group flex-shrink-0">
                        <button
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeCategory === cat.id
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent'
                                }`}
                        >
                            {cat.name}
                        </button>
                        {isAdminOrManager && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCategoryModal(cat);
                                }}
                                className="absolute -top-1 -right-1 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                title="Edit Category"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredItems.map((item, index) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative"
                            style={{
                                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                            }}
                        >
                            {/* Unavailable overlay */}
                            {!item.isAvailable && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-2xl">
                                            Unavailable
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Admin action buttons */}
                            {isAdminOrManager && (
                                <div className="absolute top-3 left-3 flex space-x-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-110"
                                        title="Edit"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleToggleAvailability(item)}
                                        className={`${item.isAvailable ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'} text-white p-2 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/50 hover:scale-110`}
                                        title={item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.isAvailable ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="bg-gradient-to-br from-red-500 to-red-600 text-white p-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-red-500/50 hover:scale-110"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Image section - larger and with zoom effect */}
                            <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
                                {item.image ? (
                                    <img
                                        src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Veg/Non-Veg badge with better styling */}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-black shadow-xl backdrop-blur-sm border-2 ${item.isVeg
                                        ? 'bg-green-100/90 text-green-800 border-green-300 dark:bg-green-900/90 dark:text-green-100 dark:border-green-700'
                                        : 'bg-red-100/90 text-red-800 border-red-300 dark:bg-red-900/90 dark:text-red-100 dark:border-red-700'
                                        }`}>
                                        {item.isVeg ? '🌿 VEG' : '🍖 NON-VEG'}
                                    </span>
                                </div>

                                {/* Gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>

                            {/* Content section */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {item.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                        {item.description || 'Delicious item from our menu'}
                                    </p>
                                </div>

                                {/* Price and Add button */}
                                <div className="mt-4 flex items-center justify-between">
                                    {/* Gradient price tag */}
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300">
                                            ₹{item.price}
                                        </span>
                                    </div>

                                    {/* Enhanced Add button with Quantity Controls */}
                                    {item.isAvailable && (
                                        (() => {
                                            const cartItemIndex = cartItems.findIndex(cartItem => cartItem.menuItemId === item.id);
                                            const quantity = cartItemIndex > -1 ? cartItems[cartItemIndex].quantity : 0;

                                            if (quantity > 0) {
                                                return (
                                                    <div className="flex items-center bg-primary-600 rounded-xl shadow-lg shadow-primary-500/30">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (quantity === 1) {
                                                                    // We need to access the store's updateQuantity which handles removal if qty becomes 0
                                                                    // Or directly use removeItem if we exposed it, but updateQuantity(index, 0) works too based on store logic
                                                                    updateQuantity(cartItemIndex, 0);
                                                                    toast.success(`Removed ${item.name} from cart`);
                                                                } else {
                                                                    updateQuantity(cartItemIndex, quantity - 1);
                                                                }
                                                            }}
                                                            className="px-3 py-2 text-white hover:bg-primary-700 rounded-l-xl transition-colors font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 py-2 text-white font-bold bg-primary-600 border-x border-primary-500 min-w-[2.5rem] text-center">
                                                            {quantity}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addItem(item, null, 1);
                                                                toast.success(`Added ${item.name} to cart`);
                                                            }}
                                                            className="px-3 py-2 text-white hover:bg-primary-700 rounded-r-xl transition-colors font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent card click
                                                        handleAddToCart(item);
                                                    }}
                                                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-2.5 px-5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add
                                                </button>
                                            );
                                        })()
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Menu Item Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Butter Chicken"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    rows="3"
                                    placeholder="Brief description of the item"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        required
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Item Image
                                </label>
                                <div className="flex items-center gap-4">
                                    {(selectedFile || formData.image) && (
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                                            <img
                                                src={selectedFile ? URL.createObjectURL(selectedFile) : (formData.image.startsWith('http') ? formData.image : `${BASE_URL}${formData.image}`)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setFormData({ ...formData, image: '' });
                                                }}
                                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                title="Remove Image"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setSelectedFile(e.target.files[0])}
                                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-primary-50 file:text-primary-700
                                                hover:file:bg-primary-100
                                                dark:file:bg-primary-900/30 dark:file:text-primary-300"
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Upload an image for this menu item</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Item Type *
                                </label>
                                <div className="flex items-center space-x-6">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="itemType"
                                            checked={formData.isVeg === true}
                                            onChange={() => setFormData({ ...formData, isVeg: true })}
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vegetarian</span>
                                    </label>

                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="itemType"
                                            checked={formData.isVeg === false}
                                            onChange={() => setFormData({ ...formData, isVeg: false })}
                                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Non-Vegetarian</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Available for ordering
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium transition-colors shadow-lg shadow-primary-600/30"
                                >
                                    {editingItem ? 'Update Item' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h2>
                        </div>

                        <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={categoryFormData.name}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Desserts"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={categoryFormData.description}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    rows="2"
                                    placeholder="Brief description of the category"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={categoryFormData.sortOrder}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, sortOrder: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleCloseCategoryModal}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors shadow-lg shadow-green-600/30"
                                >
                                    {editingCategory ? 'Update Category' : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
