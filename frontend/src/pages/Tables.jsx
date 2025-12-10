import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Tables = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [formData, setFormData] = useState({
        number: '',
        capacity: 2,
        floor: 'Ground',
        status: 'AVAILABLE'
    });

    const navigate = useNavigate();
    const { setTableId } = useCartStore();
    const { user } = useAuthStore();

    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchTables = async () => {
        try {
            const response = await api.get('/tables');
            setTables(response.data.data);
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTableClick = (table) => {
        if (table.status === 'OCCUPIED' && table.orders?.[0]) {
            navigate('/orders', { state: { highlightOrderId: table.orders[0].id } });
        } else if (table.status === 'AVAILABLE') {
            setTableId(table.id, table.number);
            navigate('/menu', { state: { tableId: table.id, tableNumber: table.number } });
        }
    };

    const handleAddOrder = (e, table) => {
        e.stopPropagation();
        setTableId(table.id, table.number);
        navigate('/menu', { state: { tableId: table.id, tableNumber: table.number } });
    };

    const handleOpenModal = (table = null) => {
        if (table) {
            setEditingTable(table);
            setFormData({
                number: table.number,
                capacity: table.capacity,
                floor: table.floor,
                status: table.status
            });
        } else {
            setEditingTable(null);
            setFormData({
                number: '',
                capacity: 2,
                floor: 'Ground',
                status: 'AVAILABLE'
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTable(null);
        setFormData({
            number: '',
            capacity: 2,
            floor: 'Ground',
            status: 'AVAILABLE'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                capacity: parseInt(formData.capacity)
            };

            if (editingTable) {
                await api.put(`/tables/${editingTable.id}`, payload);
                toast.success('Table updated successfully');
            } else {
                await api.post('/tables', payload);
                toast.success('Table added successfully');
            }

            handleCloseModal();
            fetchTables();
        } catch (error) {
            console.error('Error saving table:', error);
            toast.error(error.response?.data?.message || 'Failed to save table');
        }
    };

    const handleDelete = async (tableId) => {
        if (!window.confirm('Are you sure you want to delete this table?')) return;

        try {
            await api.delete(`/tables/${tableId}`);
            toast.success('Table deleted successfully');
            fetchTables();
        } catch (error) {
            console.error('Error deleting table:', error);
            toast.error('Failed to delete table');
        }
    };

    const filteredTables = tables.filter(table => {
        if (filter === 'ALL') return true;
        return table.status === filter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'OCCUPIED': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'RESERVED': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
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
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Tables</h1>

                    {/* Filter Buttons */}
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${filter === status
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Table Button */}
                {isAdminOrManager && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary-600/30 flex items-center justify-center whitespace-nowrap w-full sm:w-auto"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Table
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {filteredTables.map((table, index) => (
                    <div
                        key={table.id}
                        className="relative group"
                        style={{
                            animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                        }}
                    >
                        <div
                            onClick={() => handleTableClick(table)}
                            className={`w-full relative p-6 rounded-2xl border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 text-left overflow-hidden cursor-pointer ${table.status === 'AVAILABLE'
                                ? 'border-green-300 hover:border-green-400 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 dark:border-green-700 dark:hover:border-green-600'
                                : table.status === 'OCCUPIED'
                                    ? 'border-red-300 hover:border-red-400 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20 dark:border-red-700 dark:hover:border-red-600'
                                    : 'border-yellow-300 hover:border-yellow-400 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/20 dark:border-yellow-700 dark:hover:border-yellow-600'
                                }`}
                        >
                            {/* Animated glow effect for occupied tables */}
                            {table.status === 'OCCUPIED' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10 animate-pulse rounded-2xl"></div>
                            )}

                            {/* Gradient border glow on hover */}
                            <div className={`absolute -inset-1 bg-gradient-to-br ${table.status === 'AVAILABLE'
                                ? 'from-green-400 to-emerald-500'
                                : table.status === 'OCCUPIED'
                                    ? 'from-red-400 to-rose-500'
                                    : 'from-yellow-400 to-amber-500'
                                } rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    {/* Large table number with gradient */}
                                    <span className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br ${table.status === 'AVAILABLE'
                                        ? 'from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-500'
                                        : table.status === 'OCCUPIED'
                                            ? 'from-red-600 to-rose-700 dark:from-red-400 dark:to-rose-500'
                                            : 'from-yellow-600 to-amber-700 dark:from-yellow-400 dark:to-amber-500'
                                        } group-hover:scale-110 transition-transform duration-300`}>
                                        {table.number}
                                    </span>

                                    {/* Enhanced status badge */}
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${getStatusColor(table.status)} shadow-lg backdrop-blur-sm`}>
                                        {table.status === 'OCCUPIED' && (
                                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                                        )}
                                        {table.status}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {/* Capacity with icon */}
                                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                        <div className={`p-1.5 rounded-lg mr-2 ${table.status === 'AVAILABLE'
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : table.status === 'OCCUPIED'
                                                ? 'bg-red-100 dark:bg-red-900/30'
                                                : 'bg-yellow-100 dark:bg-yellow-900/30'
                                            }`}>
                                            <svg className={`w-4 h-4 ${table.status === 'AVAILABLE'
                                                ? 'text-green-600 dark:text-green-400'
                                                : table.status === 'OCCUPIED'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-yellow-600 dark:text-yellow-400'
                                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        {table.capacity} Seats
                                    </div>

                                    {/* Floor with icon */}
                                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                        <div className={`p-1.5 rounded-lg mr-2 ${table.status === 'AVAILABLE'
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : table.status === 'OCCUPIED'
                                                ? 'bg-red-100 dark:bg-red-900/30'
                                                : 'bg-yellow-100 dark:bg-yellow-900/30'
                                            }`}>
                                            <svg className={`w-4 h-4 ${table.status === 'AVAILABLE'
                                                ? 'text-green-600 dark:text-green-400'
                                                : table.status === 'OCCUPIED'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-yellow-600 dark:text-yellow-400'
                                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        {table.floor} Floor
                                    </div>
                                </div>

                                {/* Active order info with enhanced styling */}
                                {table.status === 'OCCUPIED' && table.orders?.[0] && (
                                    <div className="mt-4 pt-4 border-t-2 border-red-200 dark:border-red-800">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Active Order</p>
                                            <div className="flex items-center">
                                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                                                <span className="text-xs text-red-600 dark:text-red-400">Live</span>
                                            </div>
                                        </div>
                                        <p className="text-lg font-black text-gray-900 dark:text-white mt-1">
                                            ₹{table.orders.reduce((total, order) => {
                                                return total + (order.orderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0);
                                            }, 0).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {/* Add Order Button */}
                                <div className="mt-4">
                                    <button
                                        onClick={(e) => handleAddOrder(e, table)}
                                        className={`w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md transform hover:scale-105 active:scale-95 ${table.status === 'AVAILABLE'
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-800/60'
                                                : table.status === 'OCCUPIED'
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-800/60'
                                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:hover:bg-yellow-800/60'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Order
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Admin action buttons with better styling */}
                        {isAdminOrManager && (
                            <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal(table);
                                    }}
                                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-110"
                                    title="Edit Table"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(table.id);
                                    }}
                                    className="bg-gradient-to-br from-red-500 to-red-600 text-white p-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-red-500/50 hover:scale-110"
                                    title="Delete Table"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add/Edit Table Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingTable ? 'Edit Table' : 'Add New Table'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Table Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="e.g., T1, A1, 101"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Capacity *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="20"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Floor *
                                    </label>
                                    <select
                                        required
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    >
                                        <option value="Ground">Ground</option>
                                        <option value="First">First</option>
                                        <option value="Second">Second</option>
                                        <option value="Terrace">Terrace</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Status *
                                </label>
                                <select
                                    required
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                >
                                    <option value="AVAILABLE">Available</option>
                                    <option value="OCCUPIED">Occupied</option>
                                    <option value="RESERVED">Reserved</option>
                                </select>
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
                                    {editingTable ? 'Update Table' : 'Add Table'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tables;
