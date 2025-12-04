import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const Billing = () => {
    const [activeTab, setActiveTab] = useState('UNPAID'); // UNPAID, PAID
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);

    const [dateRange, setDateRange] = useState(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        return {
            startDate: thirtyDaysAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
        };
    });

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // If redirected from Orders with an orderId or tableId, generate bill immediately
        if (location.state?.orderId) {
            generateBill({ orderId: location.state.orderId });
            window.history.replaceState({}, document.title);
        } else if (location.state?.tableId) {
            generateBill({ tableId: location.state.tableId });
            window.history.replaceState({}, document.title);
        } else {
            fetchBills();
        }
    }, [location.state]);

    useEffect(() => {
        fetchBills();
    }, [activeTab, dateRange]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const params = {
                paymentStatus: activeTab === 'UNPAID' ? 'PENDING' : 'COMPLETED'
            };

            // Only apply date filter for history (PAID bills)
            if (activeTab === 'PAID') {
                params.startDate = dateRange.startDate;
                params.endDate = dateRange.endDate;
            }

            const response = await api.get('/billing', { params });
            setBills(response.data.data);
        } catch (error) {
            console.error('Error fetching bills:', error);
            toast.error('Failed to load bills');
        } finally {
            setLoading(false);
        }
    };

    const generateBill = async (data) => {
        try {
            const response = await api.post('/billing/generate', data);
            toast.success('Bill generated successfully');
            fetchBills();
            setSelectedBill(response.data.data);
        } catch (error) {
            console.error('Error generating bill:', error);
            toast.error(error.response?.data?.message || 'Failed to generate bill');
        }
    };

    const handlePayment = async (billId, paymentMode) => {
        setProcessingPayment(true);
        try {
            await api.post(`/billing/${billId}/payment`, { paymentMode });
            toast.success('Payment processed successfully');
            setSelectedBill(null);
            fetchBills();
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Failed to process payment');
        } finally {
            setProcessingPayment(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style>{`
                @media print {
                    /* Hide everything except the receipt */
                    body * {
                        visibility: hidden;
                    }
                    
                    #receipt-area, #receipt-area * {
                        visibility: visible;
                    }
                    
                    #receipt-area {
                        position: absolute;
                        left: 50%;
                        top: 0;
                        transform: translateX(-50%);
                        width: 100%;
                        max-width: 210mm; /* A4 width */
                        margin: 0;
                        padding: 20mm;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    
                    /* Ensure content fits on page */
                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }
                    
                    /* Prevent page breaks inside important sections */
                    #receipt-area > div {
                        page-break-inside: avoid;
                    }
                    
                    /* Ensure items list doesn't break */
                    #receipt-area .space-y-3 {
                        page-break-inside: avoid;
                    }
                    
                    /* Remove backgrounds and shadows */
                    * {
                        background: white !important;
                        box-shadow: none !important;
                        color: black !important;
                    }
                    
                    /* Make sure all content is visible */
                    #receipt-area * {
                        overflow: visible !important;
                        max-height: none !important;
                    }
                }
                
                /* For thermal printers (58mm or 80mm) */
                @media print and (max-width: 100mm) {
                    #receipt-area {
                        max-width: 80mm;
                        padding: 5mm;
                        font-size: 10px;
                    }
                    
                    #receipt-area h1 {
                        font-size: 14px;
                    }
                    
                    @page {
                        size: 80mm auto;
                        margin: 5mm;
                    }
                }
            `}</style>
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
                {/* Sidebar List */}
                <div className={`w-full lg:w-1/3 bg-white dark:bg-dark-surface bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ${selectedBill ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Bills</h2>

                        {/* Date Filters */}
                        <div className="flex space-x-2 mb-4">
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="w-1/2 px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="w-1/2 px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                        </div>

                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('UNPAID')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'UNPAID'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setActiveTab('PAID')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'PAID'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : bills.length === 0 ? (
                            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                                No bills found
                            </div>
                        ) : (
                            bills.map((bill) => (
                                <button
                                    key={bill.id}
                                    onClick={() => setSelectedBill(bill)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${selectedBill?.id === bill.id
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 ring-1 ring-primary-200 dark:ring-primary-800'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-900 dark:text-white">#{bill.billNumber.slice(-6)}</span>
                                        <span className="font-bold text-primary-600 dark:text-primary-400">₹{bill.totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                        <span>{bill.orders?.[0]?.type || 'N/A'}</span>
                                        <span>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {bill.orders?.[0]?.table && (
                                        <div className="mt-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 inline-block px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                            Table {bill.orders[0].table.number}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Bill Details / Receipt */}
                <div className={`w-full lg:w-2/3 bg-white dark:bg-dark-surface bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ${selectedBill ? 'flex' : 'hidden lg:flex'}`}>
                    {selectedBill ? (
                        <div className="flex-1 flex flex-col h-full">
                            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setSelectedBill(null)}
                                        className="lg:hidden mr-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Bill Details</h2>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">ID: {selectedBill.billNumber}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={handlePrint} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm sm:text-base">
                                        <svg className="w-5 h-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        <span className="hidden sm:inline">Print</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="max-w-md mx-auto bg-white p-6 shadow-sm border border-gray-200" id="receipt-area">
                                    <div className="text-center mb-6">
                                        <h1 className="text-2xl font-bold text-gray-900">The Classic Restaurant</h1>
                                        <p className="text-gray-500 text-sm">Andagalur Gate Flyover, Sakthinagar, Rasipuram, Tamil Nadu 637401.</p>
                                        <p className="text-gray-500 text-sm">Phone: 6374038470, 8754346195</p>
                                    </div>

                                    <div className="border-b border-dashed border-gray-300 pb-4 mb-4 text-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-600">Date:</span>
                                            <span className="font-medium text-gray-900">{formatDateTime(selectedBill.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-600">Bill No:</span>
                                            <span className="font-medium text-gray-900">{selectedBill.billNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Cashier:</span>
                                            <span className="font-medium text-gray-900">{selectedBill.user?.name}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        {selectedBill.orders?.map(order => (
                                            order.orderItems?.map((item) => (
                                                <div key={item.id} className="flex justify-between text-sm">
                                                    <div className="flex-1">
                                                        <span className="font-medium text-gray-900">{item.menuItem.name}</span>
                                                        {item.variant && <span className="text-gray-500 text-xs block">{item.variant.name}</span>}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-gray-500 mr-4">{item.quantity} x {item.price}</span>
                                                        <span className="font-medium text-gray-900">{item.price * item.quantity}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ))}
                                    </div>

                                    <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium text-gray-900">₹{selectedBill.subtotal}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tax</span>
                                            <span className="font-medium text-gray-900">₹{selectedBill.taxAmount}</span>
                                        </div>
                                        {selectedBill.discount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount</span>
                                                <span>-₹{selectedBill.discount}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                                            <span>Total</span>
                                            <span>₹{selectedBill.totalAmount}</span>
                                        </div>
                                    </div>

                                    {selectedBill.paymentStatus === 'COMPLETED' && (
                                        <div className="mt-6 text-center">
                                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-200">
                                                PAID via {selectedBill.paymentMode}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-2">Thank you for dining with us!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedBill.paymentStatus === 'PENDING' && (
                                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Select Payment Mode</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        {['CASH', 'CARD', 'UPI', 'WALLET'].map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => handlePayment(selectedBill.id, mode)}
                                                disabled={processingPayment}
                                                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all shadow-sm group"
                                            >
                                                <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">{mode}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">Select a bill to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Billing;
