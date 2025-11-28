import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const Cart = () => {
    const {
        items,
        tableId,
        tableNumber,
        orderType,
        customerName,
        customerPhone,
        updateQuantity,
        removeItem,
        getTotal,
        clearCart,
        setOrderType,
        setCustomerDetails,
        setTableId
    } = useCartStore();

    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await api.get('/tables');
                setTables(response.data.data);
            } catch (error) {
                console.error('Error fetching tables:', error);
            }
        };

        fetchTables();
    }, []);

    const handlePlaceOrder = async () => {
        if (items.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        if (orderType === 'DINE_IN' && !tableId) {
            toast.error('Please select a table for dine-in orders');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                type: orderType,
                tableId: orderType === 'DINE_IN' ? tableId : undefined,
                customerName,
                customerPhone,
                items: items.map(item => ({
                    menuItemId: item.menuItemId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    notes: item.notes
                }))
            };

            await api.post('/orders', orderData);
            toast.success('Order placed successfully!');
            clearCart();
            navigate('/orders');
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error(error.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (e) => {
        const selectedId = e.target.value;
        if (selectedId) {
            const table = tables.find(t => t.id === selectedId);
            if (table) {
                setTableId(table.id, table.number);
            }
        } else {
            setTableId(null, null);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)]">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4 transition-colors">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Add some delicious items from the menu</p>
                <button
                    onClick={() => navigate('/menu')}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-primary-600/30"
                >
                    Go to Menu
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Order</h1>
                {tableNumber && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Table {tableNumber}</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-dark-surface bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order Items</h2>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {items.map((item, index) => (
                                <div key={`${item.menuItemId}-${item.variantId}`} className="p-6 flex items-center">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                                        {item.variantName && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.variantName}</p>
                                        )}
                                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">₹{item.price}</p>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg">
                                            <button
                                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-10 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-surface bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-all duration-300">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Type</label>
                                <select
                                    value={orderType}
                                    onChange={(e) => setOrderType(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="DINE_IN">Dine In</option>
                                    <option value="TAKEAWAY">Takeaway</option>
                                    <option value="DELIVERY">Delivery</option>
                                </select>
                            </div>

                            {orderType === 'DINE_IN' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Table</label>
                                    <select
                                        value={tableId || ''}
                                        onChange={handleTableChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">Select Table</option>
                                        {tables.map(table => (
                                            <option key={table.id} value={table.id}>
                                                {table.number} ({table.status})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerDetails(e.target.value, customerPhone)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerDetails(customerName, e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-dark-surface bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 sticky top-6 transition-all duration-300">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>₹{getTotal()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Tax (5%)</span>
                                <span>₹{(getTotal() * 0.05).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                                <span>Total</span>
                                <span>₹{(getTotal() * 1.05).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-bold text-lg transition-all shadow-lg shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Placing Order...' : 'Place Order'}
                        </button>

                        <button
                            onClick={() => navigate('/menu')}
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 py-3 rounded-lg font-medium mt-3 transition-colors"
                        >
                            Add More Items
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
