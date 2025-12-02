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
            <div className="flex flex-col space-y-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Tables</h1>

                {/* Filter Buttons - Horizontal scroll on mobile */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
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

                {/* Add Table Button */}
                {isAdminOrManager && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary-600/30 flex items-center justify-center whitespace-nowrap"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Table
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {filteredTables.map((table) => (
                    <div key={table.id} className="relative group">
                        <button
                            onClick={() => handleTableClick(table)}
                            className={`w-full relative p-6 rounded-xl border-2 transition-all hover:shadow-lg hover:-translate-y-1 text-left ${table.status === 'AVAILABLE'
                                ? 'border-green-200 hover:border-green-300 bg-white dark:bg-gray-800 dark:border-green-900/50 dark:hover:border-green-700'
                                : table.status === 'OCCUPIED'
                                    ? 'border-red-200 hover:border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50 dark:hover:border-red-700'
                                    : 'border-yellow-200 hover:border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/50 dark:hover:border-yellow-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{table.number}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(table.status)}`}>
                                    {table.status}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {table.capacity} Seats
                                </div>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    {table.floor} Floor
                                </div>
                            </div>

                            {table.status === 'OCCUPIED' && table.orders?.[0] && (
                                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Active Order</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        ₹{table.orders[0].orderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </button>

                        {isAdminOrManager && (
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal(table);
                                    }}
                                    className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
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
                                    className="bg-red-600 text-white p-1.5 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
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
