import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Plus, Trash2, Edit2, Save, X, Key } from 'lucide-react';

export const UserManager = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const { t } = useLanguage();

    const initialFormState = {
        name: '',
        email: '',
        password: '',
        role: UserRole.STAFF
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        setUsers(StorageService.getUsers());
    };

    const handleEdit = (user: User) => {
        setFormData({
            name: user.name,
            email: user.email,
            password: '', 
            role: user.role
        });
        setEditingId(user.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t.userManager.confirmDelete)) {
            const result = StorageService.deleteUser(id);
            if (result.success) loadUsers();
            else alert(result.error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.email) {
            setError(t.userManager.reqFields);
            return;
        }

        const userToSave: User = {
            id: editingId || crypto.randomUUID(),
            name: formData.name,
            email: formData.email,
            role: formData.role,
            password: formData.password || undefined 
        };

        const result = StorageService.saveUser(userToSave);
        if (result.success) {
            loadUsers();
            handleCloseModal();
        } else {
            setError(result.error || t.common.error);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(initialFormState);
        setError('');
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        {t.userManager.title}
                    </h2>
                    <p className="text-sm text-slate-500">{t.userManager.subtitle}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t.common.add}
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.employeeList.cols.name}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.employeeList.cols.roleDept}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.auth.email}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t.common.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-3">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900 mr-4">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{editingId ? t.common.edit : t.common.add} {t.userManager.title}</h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeList.cols.name}</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t.auth.email}</label>
                                <input
                                    type="email"
                                    required
                                    disabled={!!editingId}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                    <Key className="w-3 h-3" /> {t.auth.password}
                                </label>
                                <input
                                    type="password"
                                    required={!editingId}
                                    placeholder={editingId ? t.userManager.passwordPlace : ''}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeList.cols.roleDept}</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value={UserRole.STAFF}>{t.userManager.roleStaff}</option>
                                    <option value={UserRole.ADMIN}>{t.userManager.roleAdmin}</option>
                                </select>
                            </div>
                            {error && <div className="text-red-500 text-sm">{error}</div>}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg">{t.common.cancel}</button>
                                <button type="submit" className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                    <Save className="w-4 h-4 mr-2" /> {t.common.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
