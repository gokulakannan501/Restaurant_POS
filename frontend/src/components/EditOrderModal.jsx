import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const EditOrderModal = ({ order, isOpen, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    // Track local quantities before saving
    const [items, setItems] = useState(
        order?.orderItems.map(item => ({
            ...item,
            newQuantity: item.quantity
        })) || []
    );

    // Update local state when order changes
    React.useEffect(() => {
        if (order) {
            setItems(order.orderItems.map(item => ({
                ...item,
                newQuantity: item.quantity
            })));
        }
    }, [order]);

    if (!isOpen || !order) return null;

    const handleQuantityChange = (itemId, change) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === itemId) {
                const updatedQty = Math.max(1, item.newQuantity + change);
                return { ...item, newQuantity: updatedQty };
            }
            return item;
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Filter items that have changed
            const changedItems = items.filter(item => item.newQuantity !== item.quantity);

            if (changedItems.length === 0) {
                onClose();
                return;
            }

            // Process updates sequentially
            for (const item of changedItems) {
                await api.patch(`/orders/${order.id}/items/${item.id}`, {
                    quantity: item.newQuantity
                });
            }

            toast.success('Order updated successfully');
            onUpdate(); // Refresh parent
            onClose();
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Order</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">#{order.orderNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">{item.menuItem.name}</h4>
                                {item.variant && <p className="text-xs text-gray-500 dark:text-gray-400">{item.variant.name}</p>}
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">₹{item.price * item.newQuantity}</p>
                            </div>

                            <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm">
                                <button
                                    onClick={() => handleQuantityChange(item.id, -1)}
                                    disabled={item.newQuantity <= 1}
                                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${item.newQuantity <= 1
                                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                        : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>

                                <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.newQuantity}</span>

                                <button
                                    onClick={() => handleQuantityChange(item.id, 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-lg shadow-primary-600/30 transition-all flex items-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditOrderModal;
