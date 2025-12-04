
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Role, PermissionKey } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Plus, Trash2, Edit2, Save, X, Lock, AlertTriangle, LayoutGrid, Users, Database, Settings, Filter } from 'lucide-react';

export const RoleManager = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [filterType, setFilterType] = useState<'ALL' | 'SYSTEM' | 'CUSTOM'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [error, setError] = useState('');
    const { t } = useLanguage();

    // Define Permission Groups with Icons and Titles
    const permissionGroups = useMemo(() => [
        {
            title: t.sidebar.dashboard,
            icon: LayoutGrid,
            items: [
                { key: 'DASHBOARD' as PermissionKey, label: t.roleManager.modules.DASHBOARD }
            ]
        },
        {
            title: t.sidebar.employeeDirectory,
            icon: Users,
            items: [
                { key: 'EMPLOYEE_VIEW' as PermissionKey, label: t.roleManager.modules.EMPLOYEE_VIEW },
                { key: 'EMPLOYEE_CREATE' as PermissionKey, label: t.roleManager.modules.EMPLOYEE_CREATE },
                { key: 'EMPLOYEE_EDIT' as PermissionKey, label: t.roleManager.modules.EMPLOYEE_EDIT },
                { key: 'EMPLOYEE_DELETE' as PermissionKey, label: t.roleManager.modules.EMPLOYEE_DELETE },
            ]
        },
        {
            title: t.sidebar.categories,
            icon: Database,
            items: [
                { key: 'CATEGORY_VIEW' as PermissionKey, label: t.roleManager.modules.CATEGORY_VIEW },
                { key: 'CATEGORY_CREATE' as PermissionKey, label: t.roleManager.modules.CATEGORY_CREATE },
                { key: 'CATEGORY_EDIT' as PermissionKey, label: t.roleManager.modules.CATEGORY_EDIT },
                { key: 'CATEGORY_DELETE' as PermissionKey, label: t.roleManager.modules.CATEGORY_DELETE },
            ]
        },
        {
            title: t.sidebar.system,
            icon: Settings,
            items: [
                { key: 'SYSTEM_SETTINGS' as PermissionKey, label: t.roleManager.modules.SYSTEM_SETTINGS },
                { key: 'SYSTEM_USERS_VIEW' as PermissionKey, label: t.roleManager.modules.SYSTEM_USERS_VIEW },
                { key: 'SYSTEM_USERS_MANAGE' as PermissionKey, label: t.roleManager.modules.SYSTEM_USERS_MANAGE },
                { key: 'SYSTEM_ROLES_VIEW' as PermissionKey, label: t.roleManager.modules.SYSTEM_ROLES_VIEW },
                { key: 'SYSTEM_ROLES_MANAGE' as PermissionKey, label: t.roleManager.modules.SYSTEM_ROLES_MANAGE },
            ]
        }
    ], [t]);

    // Flatten for easy lookup in List View
    const allPermissions = useMemo(() => {
        return permissionGroups.flatMap(g => g.items);
    }, [permissionGroups]);

    const initialFormState: Role = {
        id: '',
        code: '',
        name: '',
        description: '',
        permissions: [],
        isSystem: false
    };
    const [formData, setFormData] = useState<Role>(initialFormState);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setRoles(StorageService.getRoles());
    };

    const filteredRoles = useMemo(() => {
        return roles.filter(role => {
            if (filterType === 'SYSTEM') return role.isSystem;
            if (filterType === 'CUSTOM') return !role.isSystem;
            return true;
        });
    }, [roles, filterType]);

    const handleEdit = (role: Role) => {
        setFormData(role);
        setEditingId(role.id);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (roleToDelete) {
            const result = StorageService.deleteRole(roleToDelete.id);
            if (result.success) {
                loadData();
                setRoleToDelete(null);
            } else {
                alert(result.error);
            }
        }
    };

    const handlePermissionChange = (perm: PermissionKey) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(perm);
            const newPerms = exists 
                ? prev.permissions.filter(p => p !== perm) 
                : [...prev.permissions, perm];
            return { ...prev, permissions: newPerms };
        });
    };

    // Toggle all permissions in a group using Set for efficiency
    const toggleGroup = (perms: PermissionKey[]) => {
        setFormData(prev => {
            const currentPermsSet = new Set(prev.permissions);
            const groupPermsSet = new Set(perms);
            
            // Check if all items in this group are currently selected
            let allSelected = true;
            for (const p of groupPermsSet) {
                if (!currentPermsSet.has(p)) {
                    allSelected = false;
                    break;
                }
            }
            
            if (allSelected) {
                // Deselect All: Remove all group permissions
                perms.forEach(p => currentPermsSet.delete(p));
            } else {
                // Select All: Add all group permissions
                perms.forEach(p => currentPermsSet.add(p));
            }
            
            return { ...prev, permissions: Array.from(currentPermsSet) };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.code || !formData.name) {
            setError(t.categoryManager.reqFields);
            return;
        }

        const grantsSystemAccess = formData.permissions.includes('SYSTEM_SETTINGS');
        const finalIsSystem = formData.isSystem || grantsSystemAccess;

        const roleToSave: Role = {
            ...formData,
            id: editingId || crypto.randomUUID(),
            code: formData.code.toUpperCase(),
            isSystem: finalIsSystem
        };

        const result = StorageService.saveRole(roleToSave);
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

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-purple-600" />
                        {t.roleManager.title}
                    </h2>
                    <p className="text-sm text-slate-500">{t.roleManager.subtitle}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t.common.add}
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-500 mr-2">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">{t.roleManager.filters.label}:</span>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            filterType === 'ALL' 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t.roleManager.filters.all}
                    </button>
                    <button
                        onClick={() => setFilterType('SYSTEM')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            filterType === 'SYSTEM' 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t.roleManager.filters.system}
                    </button>
                    <button
                        onClick={() => setFilterType('CUSTOM')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            filterType === 'CUSTOM' 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t.roleManager.filters.custom}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => (
                        <div key={role.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        {role.name}
                                        {role.isSystem && (
                                            <span title={t.roleManager.systemRole}>
                                                <Lock className="w-3 h-3 text-amber-500" />
                                            </span>
                                        )}
                                    </h4>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{role.code}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(role)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {!role.isSystem && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRoleToDelete(role);
                                            }} 
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{role.description}</p>
                            
                            <div className="border-t border-slate-100 pt-3">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Access</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {role.permissions.slice(0, 5).map(p => (
                                        <span key={p} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                                            {allPermissions.find(m => m.key === p)?.label || p}
                                        </span>
                                    ))}
                                    {role.permissions.length > 5 && (
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                            +{role.permissions.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Shield className="w-6 h-6 opacity-20" />
                        </div>
                        <p>No roles found matching this filter.</p>
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-lg font-bold text-slate-900">{editingId ? t.common.edit : t.common.add} {t.categoryManager.modalTitle}</h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 pr-2">
                            <form id="roleForm" onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.code} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                                            disabled={formData.isSystem}
                                            title={formData.isSystem ? "System role codes cannot be changed." : ""}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.name} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.description}</label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        rows={2}
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-bold text-slate-700">{t.roleManager.permissions}</label>
                                        {formData.permissions.includes('SYSTEM_SETTINGS') && (
                                            <div className="text-xs flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 animate-in fade-in">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span className="font-semibold">Grants high-level access. Role will be locked as "System Role".</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {permissionGroups.map((group, groupIdx) => {
                                            const groupKeys = group.items.map(i => i.key);
                                            const selectedCount = groupKeys.filter(k => formData.permissions.includes(k)).length;
                                            const totalCount = groupKeys.length;
                                            const isAllSelected = selectedCount === totalCount;
                                            
                                            return (
                                                <div key={groupIdx} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col h-full hover:border-blue-200 transition-colors">
                                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                            <group.icon className="w-4 h-4 text-slate-500" />
                                                            {group.title}
                                                            <span className="text-xs font-normal text-slate-400 ml-1">
                                                                ({selectedCount}/{totalCount})
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleGroup(groupKeys)}
                                                            className={`text-xs font-bold px-2 py-1.5 rounded transition-colors border ${
                                                                isAllSelected 
                                                                    ? 'text-red-600 bg-white border-red-200 hover:bg-red-50' 
                                                                    : 'text-blue-600 bg-white border-blue-200 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            {isAllSelected ? t.common.deselectAll : t.common.selectAll}
                                                        </button>
                                                    </div>
                                                    <div className="p-3 space-y-2 flex-1">
                                                        {group.items.map((perm) => (
                                                            <label key={perm.key} className="flex items-start gap-2 cursor-pointer group p-1 -ml-1 rounded hover:bg-slate-50 transition-colors select-none">
                                                                <div className="relative flex items-center h-5">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.permissions.includes(perm.key)}
                                                                        onChange={() => handlePermissionChange(perm.key)}
                                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                                    />
                                                                </div>
                                                                <span className="text-sm text-slate-600 group-hover:text-slate-900 leading-5 pt-0.5">
                                                                    {perm.label}
                                                                </span>
                                                                {perm.key === 'SYSTEM_SETTINGS' && (
                                                                    <span className="ml-auto text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1 whitespace-nowrap">
                                                                        <Lock className="w-2.5 h-2.5" /> Locked
                                                                    </span>
                                                                )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {error && <div className="text-red-500 text-sm">{error}</div>}
                            </form>
                        </div>

                        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-slate-100 shrink-0">
                            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">{t.common.cancel}</button>
                            <button type="submit" form="roleForm" className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-2" /> {t.common.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {roleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.roleManager.deleteTitle}</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                {t.roleManager.deleteConfirm.replace('{name}', roleToDelete.name)}
                            </p>
                            <div className="flex space-x-3 w-full">
                                <button 
                                    onClick={() => setRoleToDelete(null)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                                >
                                    {t.common.cancel}
                                </button>
                                <button 
                                    onClick={handleConfirmDelete}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                                >
                                    {t.common.delete}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
