import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Attendance = () => {
    const { user } = useAuthStore();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState([]);
    const [notes, setNotes] = useState('');
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    useEffect(() => {
        fetchStatus();
        fetchAttendance();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await api.get('/attendance/status');
            setStatus(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch status');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await api.get('/attendance');
            setAttendance(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch attendance');
        }
    };

    const handleCheckIn = async () => {
        try {
            await api.post('/attendance/check-in', { notes });
            toast.success('Checked in successfully');
            setNotes('');
            fetchStatus();
            fetchAttendance();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to check in');
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.post('/attendance/check-out', { notes });
            toast.success('Checked out successfully');
            setNotes('');
            fetchStatus();
            fetchAttendance();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to check out');
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const calculateDuration = (checkIn, checkOut) => {
        if (!checkOut) return 'In Progress';
        const duration = new Date(checkOut) - new Date(checkIn);
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Attendance</h1>

            {/* Check In/Out Card */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {status?.isCheckedIn ? 'Currently Checked In' : 'Not Checked In'}
                        </h2>
                        {status?.attendance && (
                            <p className="text-gray-600 dark:text-gray-400">
                                Check-in time: {formatTime(status.attendance.checkIn)}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes (optional)"
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {!status?.isCheckedIn ? (
                            <button
                                onClick={handleCheckIn}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                            >
                                Check In
                            </button>
                        ) : (
                            <button
                                onClick={handleCheckOut}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                            >
                                Check Out
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Attendance Records */}
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {isAdmin ? 'All Attendance Records' : 'My Attendance History'}
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Employee
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Check In
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Check Out
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Notes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {attendance.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {record.user.name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {record.user.role}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {formatDate(record.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {formatTime(record.checkIn)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {formatTime(record.checkOut)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.checkOut
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                            }`}>
                                            {calculateDuration(record.checkIn, record.checkOut)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {record.notes || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {attendance.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No attendance records found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
