import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Attendance = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    // State for Admin Marking
    const [users, setUsers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({}); // { userId: { status: 'PRESENT', notes: '' } }
    const [loading, setLoading] = useState(true);

    // State for Reports
    const [reportRange, setReportRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [activeTab, setActiveTab] = useState('mark'); // 'mark' or 'report'

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
            fetchDailyAttendance(selectedDate);

            // Auto-refresh attendance data every 10 seconds
            const interval = setInterval(() => {
                fetchDailyAttendance(selectedDate);
            }, 10000); // 10 seconds

            return () => clearInterval(interval);
        } else {
            fetchMyAttendance();
        }
    }, [isAdmin, selectedDate]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch users');
        }
    };

    const fetchDailyAttendance = async (date) => {
        try {
            setLoading(true);
            // Fetch attendance for specific date
            const response = await api.get(`/attendance?startDate=${date}&endDate=${date}`);
            const records = response.data.data || [];

            const data = {};
            records.forEach(record => {
                data[record.userId] = {
                    status: record.status,
                    notes: record.notes || '',
                    id: record.id
                };
            });
            setAttendanceData(data);
        } catch (error) {
            toast.error('Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyAttendance = async () => {
        // Implementation for non-admin view (history)
        // ... (can reuse previous logic or simplified)
        setLoading(false);
    };

    const handleMarkAttendance = async (userId, status) => {
        try {
            const currentData = attendanceData[userId] || {};
            await api.post('/attendance/mark', {
                userId,
                date: selectedDate,
                status,
                notes: currentData.notes || ''
            });

            setAttendanceData(prev => ({
                ...prev,
                [userId]: { ...prev[userId], status }
            }));
            toast.success('Attendance updated');
        } catch (error) {
            toast.error('Failed to update attendance');
        }
    };

    const handleUpdateNotes = async (userId, notes) => {
        try {
            const currentData = attendanceData[userId] || {};

            // Update local state immediately
            setAttendanceData(prev => ({
                ...prev,
                [userId]: { ...prev[userId], notes }
            }));

            // If attendance is already marked, save to backend
            if (currentData.status) {
                await api.post('/attendance/mark', {
                    userId,
                    date: selectedDate,
                    status: currentData.status,
                    notes
                });
            }
        } catch (error) {
            console.error('Failed to update notes:', error);
        }
    };

    const generateReport = async () => {
        try {
            const response = await api.get(`/attendance/report?startDate=${reportRange.startDate}&endDate=${reportRange.endDate}`);
            setReportData(response.data.data || null);
        } catch (error) {
            toast.error('Failed to generate report');
        }
    };

    const downloadCSV = () => {
        if (!reportData?.report) return;

        const headers = ['Employee', 'Role', 'Total Days', 'Present Days', 'Absent Days', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...reportData.report.map(row => [
                row.userName,
                row.userRole,
                row.totalDays,
                row.presentDays,
                row.absentDays || 0,
                `"${row.notesText || 'No notes'}"` // Wrap in quotes for CSV
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${reportRange.startDate}_to_${reportRange.endDate}.csv`;
        a.click();
    };

    if (!isAdmin) {
        return <div className="p-6">My Attendance History (Coming Soon)</div>; // Placeholder for non-admin
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Attendance Management</h1>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    className={`pb-2 px-4 font-medium ${activeTab === 'mark' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('mark')}
                >
                    Mark Attendance
                </button>
                <button
                    className={`pb-2 px-4 font-medium ${activeTab === 'report' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('report')}
                >
                    Reports
                </button>
            </div>

            {activeTab === 'mark' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <label className="text-gray-700 dark:text-gray-300 font-medium">Select Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                            onClick={() => fetchDailyAttendance(selectedDate)}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
                            title="Refresh Data"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map(user => {
                                    const userAttendance = attendanceData[user.id] || {};
                                    return (
                                        <tr key={user.id}>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">{user.name}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{user.role}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleMarkAttendance(user.id, 'PRESENT')}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${userAttendance.status === 'PRESENT'
                                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                                                            }`}
                                                    >
                                                        Present
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkAttendance(user.id, 'ABSENT')}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${userAttendance.status === 'ABSENT'
                                                            ? 'bg-red-100 text-red-800 border border-red-200'
                                                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                                                            }`}
                                                    >
                                                        Absent
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    placeholder="Add note..."
                                                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary-500 outline-none text-sm text-gray-900 dark:text-white"
                                                    value={userAttendance.notes || ''}
                                                    onChange={(e) => {
                                                        // Update local state as user types
                                                        setAttendanceData(prev => ({
                                                            ...prev,
                                                            [user.id]: { ...prev[user.id], notes: e.target.value }
                                                        }));
                                                    }}
                                                    onBlur={(e) => {
                                                        // Save to backend when user leaves the field
                                                        handleUpdateNotes(user.id, e.target.value);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'report' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex flex-wrap items-end gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
                            <input
                                type="date"
                                value={reportRange.startDate}
                                onChange={(e) => setReportRange({ ...reportRange, startDate: e.target.value })}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
                            <input
                                type="date"
                                value={reportRange.endDate}
                                onChange={(e) => setReportRange({ ...reportRange, endDate: e.target.value })}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <button
                            onClick={generateReport}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Generate Report
                        </button>
                        {reportData && (
                            <button
                                onClick={downloadCSV}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export CSV
                            </button>
                        )}
                    </div>

                    {reportData && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Days</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Present</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Absent</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {reportData.report.map((row, index) => (
                                        <tr key={index}>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">{row.userName}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{row.totalDays}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-green-600 font-medium">{row.presentDays}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-red-600 font-medium">{row.absentDays || 0}</td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-500 dark:text-gray-400 text-sm max-w-xs truncate" title={row.notesText}>{row.notesText || 'No notes'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Attendance;
