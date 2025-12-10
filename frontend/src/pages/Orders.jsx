import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ACTIVE'); // ACTIVE, COMPLETED, CANCELLED
    const [dateFilter, setDateFilter] = useState('TODAY'); // TODAY, YESTERDAY, WEEK, MONTH, CUSTOM
    const [searchTerm, setSearchTerm] = useState('');
    const [customDateRange, setCustomDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [highlightedId, setHighlightedId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.highlightOrderId) {
            setHighlightedId(location.state.highlightOrderId);
            // Clear state to avoid persistent highlighting
            window.history.replaceState({}, document.title);
            // Ensure we are viewing the correct tab
            setFilter('ACTIVE');
        }
    }, [location.state]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success('Order status updated');
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const getDateRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
            case 'TODAY':
                return { start: today, end: new Date() };
            case 'YESTERDAY':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayEnd = new Date(yesterday);
                yesterdayEnd.setHours(23, 59, 59, 999);
                return { start: yesterday, end: yesterdayEnd };
            case 'WEEK':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return { start: weekAgo, end: new Date() };
            case 'MONTH':
                const monthAgo = new Date(today);
                monthAgo.setDate(monthAgo.getDate() - 30);
                return { start: monthAgo, end: new Date() };
            case 'CUSTOM':
                const start = new Date(customDateRange.startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(customDateRange.endDate);
                end.setHours(23, 59, 59, 999);
                return { start, end };
            default:
                return { start: today, end: new Date() };
        }
    };

    const filteredOrders = orders.filter(order => {
        // Status filter
        const statusMatch = filter === 'ACTIVE'
            ? !['COMPLETED', 'CANCELLED'].includes(order.status)
            : order.status === filter;

        // Date filter
        const orderDate = new Date(order.createdAt);
        const { start, end } = getDateRange();
        const dateMatch = orderDate >= start && orderDate <= end;

        // Search filter
        const lowerSearch = searchTerm.toLowerCase();
        const searchMatch = searchTerm === '' ||
            (order.table?.number && order.table.number.toString().includes(lowerSearch)) ||
            (order.customerName && order.customerName.toLowerCase().includes(lowerSearch)) ||
            (order.orderNumber && order.orderNumber.toLowerCase().includes(lowerSearch));

        return statusMatch && dateMatch && searchMatch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            case 'PREPARING': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'READY': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'SERVED': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
        <div className="bg-white dark:bg-dark-surface bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg p-6 transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Status Filter */}
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 overflow-x-auto">
                        {['ACTIVE', 'COMPLETED', 'CANCELLED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filter === status
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Table # or Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm w-full sm:w-64 transition-all"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <button
                        onClick={() => navigate('/menu')}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary-600/30 whitespace-nowrap"
                    >
                        New Order
                    </button>
                </div>
            </div>

            {/* Date Filter Section */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Date:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setDateFilter(period)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateFilter === period
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {period === 'WEEK' ? 'Last 7 Days' : period === 'MONTH' ? 'Last 30 Days' : period.charAt(0) + period.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Custom Date Range */}
                {dateFilter === 'CUSTOM' && (
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 dark:text-gray-400">From:</label>
                            <input
                                type="date"
                                value={customDateRange.startDate}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 dark:text-gray-400">To:</label>
                            <input
                                type="date"
                                value={customDateRange.endDate}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Orders Count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-bold text-gray-900 dark:text-white">{filteredOrders.length}</span> order{filteredOrders.length !== 1 ? 's' : ''}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => (
                    <div
                        key={order.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-all duration-200 ${highlightedId === order.id
                            ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50 scale-105 z-10'
                            : 'border-gray-100 dark:border-gray-700'
                            }`}
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-800/50">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-gray-900 dark:text-white">#{order.orderNumber.slice(-4)}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {order.type === 'DINE_IN' ? `Table ${order.table?.number || 'N/A'}` : order.type}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {order.customerName && (
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">{order.customerName}</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto max-h-64 custom-scrollbar">
                            <ul className="space-y-3">
                                {order.orderItems.map((item) => (
                                    <li key={item.id} className="flex justify-between text-sm">
                                        <div className="flex space-x-2">
                                            <span className="font-bold text-gray-900 dark:text-white">{item.quantity}x</span>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {item.menuItem.name}
                                                {item.variant && <span className="text-gray-500 dark:text-gray-400"> ({item.variant.name})</span>}
                                            </span>
                                        </div>
                                        {item.notes && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-0.5 italic">{item.notes}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {order.notes && (
                                <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800/50">
                                    Note: {order.notes}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    ₹{order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {order.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 py-1 text-sm rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                                            className="bg-primary-600 text-white hover:bg-primary-700 py-1 text-sm rounded transition-colors shadow-sm"
                                        >
                                            Accept
                                        </button>
                                    </>
                                )}
                                {order.status === 'PREPARING' && (
                                    <button
                                        onClick={() => handleStatusUpdate(order.id, 'READY')}
                                        className="bg-primary-600 text-white hover:bg-primary-700 py-1 text-sm col-span-2 rounded transition-colors shadow-sm"
                                    >
                                        Mark Ready
                                    </button>
                                )}
                                {order.status === 'READY' && (
                                    <button
                                        onClick={() => handleStatusUpdate(order.id, 'SERVED')}
                                        className="bg-primary-600 text-white hover:bg-primary-700 py-1 text-sm col-span-2 rounded transition-colors shadow-sm"
                                    >
                                        Mark Served
                                    </button>
                                )}
                                {order.status === 'SERVED' && !order.billId && (
                                    <button
                                        onClick={() => {
                                            if (order.type === 'DINE_IN' && order.tableId) {
                                                navigate('/billing', { state: { tableId: order.tableId } });
                                            } else {
                                                navigate('/billing', { state: { orderId: order.id } });
                                            }
                                        }}
                                        className="bg-purple-600 text-white hover:bg-purple-700 py-1 text-sm col-span-2 rounded transition-colors shadow-sm"
                                    >
                                        Generate Bill
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;
