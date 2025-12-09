
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { User, UserRole, Category, Role } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Plus, Trash2, Edit2, Save, X, Key, Building } from 'lucide-react';

interface UserManagerProps {
    currentUser?: User; // Pass current user to check permissions
}

export const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Category[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const { t } = useLanguage();

    const permissions = useMemo(() => {
        if (!currentUser?.roleId) return [];
        const role = StorageService.getRoleById(currentUser.roleId);
        return role ? role.permissions : [];
    }, [currentUser]);

    const canManage = permissions.includes('SYSTEM_USERS_MANAGE');

    const initialFormState: Partial<User> = {
        name: '',
        email: '',
        username: '',
        password: '',
        roleId: '', 
        companyId: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setUsers(StorageService.getUsers());
        setCompanies(StorageService.getCategories('COMPANY'));
        setRoles(StorageService.getRoles());
    };

    const handleEdit = (user: User) => {
        setFormData({
            name: user.name,
            email: user.email,
            username: user.username || '',
            password: '', 
            roleId: user.roleId || '',
            companyId: user.companyId || ''
        });
        setEditingId(user.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(t.userManager.confirmDelete)) {
            const result = StorageService.deleteUser(id);
            if (result.success) loadData();
            else alert(result.error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.email || !formData.roleId) {
            setError(t.userManager.reqFields);
            return;
        }

        const selectedRole = roles.find(r => r.id === formData.roleId);
        const isAdminRole = selectedRole?.permissions.includes('SYSTEM_SETTINGS');

        if (!isAdminRole && !formData.companyId) {
            setError("Vui lòng chọn Công ty cho nhân viên.");
            return;
        }

        const userToSave: User = {
            id: editingId || crypto.randomUUID(),
            name: formData.name || '',
            email: formData.email || '',
            username: formData.username || undefined,
            role: isAdminRole ? UserRole.ADMIN : UserRole.STAFF, 
            roleId: formData.roleId,
            password: formData.password || undefined,
            companyId: formData.companyId
        };

        const result = StorageService.saveUser(userToSave);
        if (result.success) {
            loadData();
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

    const getCompanyName = (id?: string) => {
        if (!id) return 'All Companies';
        return companies.find(c => c.id === id)?.name || 'Unknown';
    };

    const getRoleName = (id?: string) => {
        return roles.find(r => r.id === id)?.name || id || 'Unknown';
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
                {canManage && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t.common.add}
                    </button>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.employeeList.cols.name}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.userManager.roleLabel}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Công ty (Workspace)</th>
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
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{user.name}</div>
                                            {user.username && <div className="text-xs text-slate-500">@{user.username}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                        {getRoleName(user.roleId)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="flex items-center text-sm text-slate-600">
                                        <Building className="w-3 h-3 mr-1 text-slate-400" />
                                        {getCompanyName(user.companyId)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {canManage && (
                                        <>
                                            <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900 mr-4">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => handleDelete(user.id, e)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{editingId ? t.common.edit : t.common.add} {t.userManager.title}</h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* ... Form content ... */}
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
                            
                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.userManager.username}</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder={t.userManager.usernamePlaceholder}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
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
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.userManager.roleLabel}</label>
                                    <select
                                        value={formData.roleId}
                                        onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        required
                                    >
                                        <option value="">-- Chọn --</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Công ty</label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="">-- Tất cả --</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1 italic">
                                        {formData.roleId && roles.find(r => r.id === formData.roleId)?.permissions.includes('SYSTEM_SETTINGS')
                                            ? 'Vai trò này có quyền truy cập toàn hệ thống.'
                                            : 'Bắt buộc chọn công ty cho vai trò này.'}
                                    </p>
                                </div>
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
