import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', percentage: '', isActive: true });
    const [editingId, setEditingId] = useState(null);

    const fetchTaxes = async () => {
        try {
            const res = await api.get('/taxes');
            setTaxes(res.data.data);
        } catch (error) {
            console.error('Error fetching taxes:', error);
            toast.error('Failed to load taxes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxes();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/taxes/${editingId}`, formData);
                toast.success('Tax updated successfully');
            } else {
                await api.post('/taxes', formData);
                toast.success('Tax added successfully');
            }
            setShowModal(false);
            setFormData({ name: '', percentage: '', isActive: true });
            setEditingId(null);
            fetchTaxes();
        } catch (error) {
            console.error('Error saving tax:', error);
            toast.error('Failed to save tax');
        }
    };

    const handleEdit = (tax) => {
        setFormData({ name: tax.name, percentage: tax.percentage, isActive: tax.isActive });
        setEditingId(tax.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tax?')) return;
        try {
            await api.delete(`/taxes/${id}`);
            toast.success('Tax deleted successfully');
            fetchTaxes();
        } catch (error) {
            console.error('Error deleting tax:', error);
            toast.error('Failed to delete tax');
        }
    };

    const handleToggleActive = async (tax) => {
        try {
            await api.put(`/taxes/${tax.id}`, { ...tax, isActive: !tax.isActive });
            toast.success(`Tax ${!tax.isActive ? 'activated' : 'deactivated'}`);
            fetchTaxes();
        } catch (error) {
            console.error('Error updating tax:', error);
            toast.error('Failed to update tax status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <button
                    onClick={() => {
                        setFormData({ name: '', percentage: '', isActive: true });
                        setEditingId(null);
                        setShowModal(true);
                    }}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary-600/30 w-full sm:w-auto justify-center"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Tax
                </button>
            </div>

            {/* Taxes Section */}
            <div className="bg-white dark:bg-dark-surface bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tax Configuration</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage taxes applied to orders</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">Name</th>
                                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">Percentage</th>
                                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">Status</th>
                                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">Loading...</td>
                                </tr>
                            ) : taxes.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No taxes configured</td>
                                </tr>
                            ) : (
                                taxes.map((tax) => (
                                    <tr key={tax.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tax.name}</td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tax.percentage}%</td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleActive(tax)}
                                                className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${tax.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}
                                            >
                                                {tax.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(tax)}
                                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tax.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Edit Tax' : 'Add New Tax'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="e.g. CGST"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Percentage (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.percentage}
                                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="e.g. 2.5"
                                    required
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Active
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-600/30"
                                >
                                    {editingId ? 'Update Tax' : 'Add Tax'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
