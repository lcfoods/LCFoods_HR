
import React, { useState, useEffect, useMemo } from 'react';
import { Category, User } from '../types';
import { StorageService } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Download, Trash2, Edit2, Save, X, FileText, FolderTree, AlertTriangle, Link, MapPin, Map, Building, Home, ChevronRight, Layers, Archive, RefreshCw } from 'lucide-react';

interface CategoryManagerProps {
  type: Category['type'];
  title: string;
  isHierarchical?: boolean;
  user?: User; 
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ type, title, isHierarchical = false, user }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useLanguage();
  
  // Admin Unit Tabs State
  const [activeAdminTab, setActiveAdminTab] = useState<1 | 2 | 3>(1);

  // Permissions Check
  const permissions = useMemo(() => {
      if (!user?.roleId) return [];
      const role = StorageService.getRoleById(user.roleId);
      return role ? role.permissions : [];
  }, [user]);

  const canCreate = permissions.includes('CATEGORY_CREATE');
  const canEdit = permissions.includes('CATEGORY_EDIT');
  const canDelete = permissions.includes('CATEGORY_DELETE');

  const [formData, setFormData] = useState<Partial<Category>>({
    code: '',
    name: '',
    description: '',
    parentId: '',
    level: undefined,
    appScriptUrl: '',
    googleSheetUrl: '',
    status: 'Active'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    // Reset tab on type change
    setActiveAdminTab(1);
  }, [type]);

  const loadData = () => {
    // Force a fresh read from storage
    const freshData = StorageService.getCategories(type);
    setCategories(freshData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code || !formData.name) {
      setError(t.categoryManager.reqFields);
      return;
    }

    // --- Validation for Departments Logic ---
    if (type === 'DEPARTMENT' && formData.level !== undefined) {
        
        // 0. Level 0 Check (Root Level cannot have Parent)
        if (formData.level === 0 && formData.parentId) {
            setError(t.categoryManager.errors.levelRootNoParent);
            return;
        }

        // 1. Check Parent Compatibility
        // Rule: Parent Level must be numerically LESS than Child Level.
        if (formData.parentId) {
            const parent = categories.find(c => c.id === formData.parentId);
            if (parent && parent.level !== undefined) {
                 if (parent.level >= formData.level) {
                     setError(t.categoryManager.errors.levelConflictParent);
                     return;
                 }
            }
        }

        // 2. Check Children Compatibility (If editing an existing node)
        // Rule: All Children must have a Level numerically GREATER than this node.
        if (editingId) {
            const children = categories.filter(c => c.parentId === editingId);
            const invalidChild = children.find(child => child.level !== undefined && formData.level! >= child.level!);
            if (invalidChild) {
                setError(`${t.categoryManager.errors.levelConflictChild} (${invalidChild.name}: L${invalidChild.level})`);
                return;
            }
        }
    }

    const newCategory: Category = {
      id: editingId || crypto.randomUUID(),
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || '',
      type: type,
      parentId: formData.parentId || null,
      level: formData.level, // Persist level
      appScriptUrl: formData.appScriptUrl || undefined,
      googleSheetUrl: formData.googleSheetUrl || undefined,
      status: formData.status as 'Active' | 'Dissolved' || 'Active'
    };

    const result = StorageService.saveCategory(newCategory);

    if (result.success) {
      loadData();
      handleCloseModal();
    } else {
      setError(result.error || t.common.error);
    }
  };

  const handleEdit = (cat: Category) => {
    setFormData({
      code: cat.code,
      name: cat.name,
      description: cat.description,
      parentId: cat.parentId || '',
      level: cat.level,
      appScriptUrl: cat.appScriptUrl || '',
      googleSheetUrl: cat.googleSheetUrl || '',
      status: cat.status || 'Active'
    });
    setEditingId(cat.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Only stop propagation

    // 1. Check if category has children
    const hasChildren = categories.some(c => c.parentId === id);
    if (hasChildren) {
        alert(t.categoryManager.errors.hasChildren);
        return;
    }

    // 2. Check if category has employees (Only for Departments/Positions/Locations)
    // We check against ALL employees in the system
    const allEmployees = StorageService.getEmployees();
    let hasLinkedEmployees = false;

    if (type === 'DEPARTMENT') {
        hasLinkedEmployees = allEmployees.some(e => e.departmentCode === code);
    } else if (type === 'POSITION') {
        hasLinkedEmployees = allEmployees.some(e => e.positionCode === code);
    } else if (type === 'LOCATION') {
        hasLinkedEmployees = allEmployees.some(e => e.locationCode === code);
    }

    if (hasLinkedEmployees) {
        alert(`${t.categoryManager.errors.hasEmployees}\n\n${t.categoryManager.errors.useDissolve}`);
        return;
    }

    if (window.confirm(t.categoryManager.confirmDelete)) {
      StorageService.deleteCategory(id);
      loadData();
      // Optional: Add success alert if needed, but delete usually is obvious
    }
  };

  const handleDissolve = (cat: Category, e: React.MouseEvent) => {
      e.stopPropagation();
      console.log("Action: Dissolve", cat.name);
      
      const message = t.categoryManager.confirmDissolve.replace('{name}', cat.name);
      if (window.confirm(message)) {
          const updated: Category = { ...cat, status: 'Dissolved' };
          const result = StorageService.saveCategory(updated);
          if (result.success) {
              loadData(); 
              // Explicit feedback
              setTimeout(() => alert("Đã giải thể thành công!"), 100);
          } else {
              alert(result.error || t.common.error);
          }
      }
  };

  const handleRestore = (cat: Category, e: React.MouseEvent) => {
      e.stopPropagation();
      console.log("Action: Restore", cat.name);
      
      const message = t.categoryManager.confirmRestore.replace('{name}', cat.name);
      if (window.confirm(message)) {
          const updated: Category = { ...cat, status: 'Active' };
          const result = StorageService.saveCategory(updated);
          if (result.success) {
              loadData(); 
              // Explicit feedback
              setTimeout(() => alert("Đã khôi phục thành công!"), 100);
          } else {
              alert(result.error || t.common.error);
          }
      }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ code: '', name: '', description: '', parentId: '', level: undefined, appScriptUrl: '', googleSheetUrl: '', status: 'Active' });
    setError('');
  };

  // --- Helper to get Hierarchy Path (Smart Breadcrumbs) ---
  const getHierarchyPath = (currentCat: Category) => {
      const path: {name: string, level: number}[] = [];
      
      if (!currentCat.parentId) return path;

      const parent = categories.find(c => c.id === currentCat.parentId);
      if (parent) {
          if (parent.parentId) {
              const grandParent = categories.find(c => c.id === parent.parentId);
              if (grandParent) {
                   path.push({ name: grandParent.name, level: 1 });
              }
          }
          path.push({ name: parent.name, level: 2 });
      }
      return path;
  };

  // --- Filter Logic & Counts for Admin Units ---
  const { displayedCategories, counts } = useMemo(() => {
      const getLevel = (id: string): number => {
          const cat = categories.find(c => c.id === id);
          if (!cat || !cat.parentId) return 1; 
          const parent = categories.find(c => c.id === cat.parentId);
          if (!parent || !parent.parentId) return 2; 
          return 3; 
      };

      if (type !== 'ADMIN_UNIT') {
          return { displayedCategories: categories, counts: { 1: 0, 2: 0, 3: 0 } };
      }

      // Calculate counts for badges
      const c = { 1: 0, 2: 0, 3: 0 };
      categories.forEach(cat => {
          const lvl = getLevel(cat.id) as 1 | 2 | 3;
          if (c[lvl] !== undefined) c[lvl]++;
      });

      const filtered = categories.filter(c => getLevel(c.id) === activeAdminTab);
      return { displayedCategories: filtered, counts: c };
  }, [categories, type, activeAdminTab]);

  const canSupportDissolve = type !== 'COMPANY';

  // --- Recursive Tree Rendering (Used for DEPARTMENT) ---
  const renderTree = (parentId: string | null = null, level = 0) => {
    const nodes = categories
      .filter(c => c.parentId === parentId)
      .sort((a,b) => (a.level ?? 99) - (b.level ?? 99));
    
    if (nodes.length === 0) return null;

    return nodes.map(node => {
        const isDissolved = node.status === 'Dissolved';
        // Content cells get dimmed
        const contentClass = isDissolved ? 'opacity-60 grayscale' : '';
        // Row background
        const rowClass = isDissolved ? 'bg-slate-50' : 'hover:bg-slate-50 transition-colors';
        // Action cell
        const actionClass = isDissolved ? 'bg-white opacity-100' : '';

        return (
          <React.Fragment key={node.id}>
            <tr className={`group ${rowClass}`}>
              <td className={`px-6 py-4 whitespace-nowrap ${contentClass}`}>
                <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
                  {isHierarchical && level > 0 && (
                    <span className="text-slate-300 mr-2">└─</span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium border ${
                    level === 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                    level === 1 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {node.code}
                  </span>
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 ${contentClass}`}>
                <div className="flex items-center gap-2">
                    {node.name}
                    {isDissolved && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide animate-pulse">
                            {t.categoryManager.dissolvedStatus}
                        </span>
                    )}
                    {type === 'COMPANY' && node.appScriptUrl && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800" title={t.categoryManager.synced}>
                            <Link className="w-3 h-3 mr-1" /> {t.categoryManager.synced}
                        </span>
                    )}
                </div>
              </td>
              {type === 'DEPARTMENT' && (
                  <td className={`px-6 py-4 whitespace-nowrap ${contentClass}`}>
                      {node.level !== undefined ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                              node.level === 0 ? 'bg-slate-800 text-amber-400 border-slate-600' :
                              node.level === 1 ? 'bg-red-50 text-red-700 border-red-200' :
                              node.level === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              node.level === 3 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                              L{node.level}
                          </span>
                      ) : <span className="text-slate-300">-</span>}
                  </td>
              )}
              <td className={`px-6 py-4 text-sm text-slate-500 truncate max-w-xs ${contentClass}`}>{node.description || '-'}</td>
              <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${actionClass}`}>
                <div className="flex justify-end gap-2">
                    {canEdit && (
                        <button type="button" onClick={() => handleEdit(node)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100 transition-colors" title={t.common.edit}>
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    
                    {canEdit && canSupportDissolve && (
                        isDissolved ? (
                            <button 
                                type="button"
                                onClick={(e) => handleRestore(node, e)} 
                                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200 hover:shadow-md transition-all" 
                                title={t.categoryManager.restore}
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                {t.categoryManager.restore}
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={(e) => handleDissolve(node, e)} 
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded border border-transparent hover:border-amber-100 transition-colors" 
                                title={t.categoryManager.dissolve}
                            >
                                <Archive className="w-4 h-4" />
                            </button>
                        )
                    )}

                    {canDelete && (
                        <button type="button" onClick={(e) => handleDelete(node.id, node.code, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors" title={t.common.delete}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
              </td>
            </tr>
            {renderTree(node.id, level + 1)}
          </React.Fragment>
        );
    });
  };

  // --- Flat List Rendering ---
  const renderFlatList = () => {
      if (displayedCategories.length === 0) {
           return (
              <tr>
                <td colSpan={type === 'ADMIN_UNIT' && activeAdminTab > 1 ? 4 : 4} className="px-6 py-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{t.common.noRecords}</p>
                </td>
              </tr>
           );
      }

      return displayedCategories.map((cat) => {
        const path = getHierarchyPath(cat);
        const badgeClass = 
            activeAdminTab === 1 ? 'bg-blue-50 text-blue-700 border-blue-200' :
            activeAdminTab === 2 ? 'bg-purple-50 text-purple-700 border-purple-200' :
            'bg-emerald-50 text-emerald-700 border-emerald-200';
        
        const isDissolved = cat.status === 'Dissolved';
        const contentClass = isDissolved ? 'opacity-60 grayscale' : '';
        const rowClass = isDissolved ? 'bg-slate-50' : 'hover:bg-slate-50 transition-colors';
        const actionClass = isDissolved ? 'bg-white opacity-100' : '';

        return (
        <tr key={cat.id} className={`group ${rowClass}`}>
            <td className={`px-6 py-4 whitespace-nowrap ${contentClass}`}>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${badgeClass}`}>
                    {cat.code}
                </span>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 ${contentClass}`}>
                {cat.name}
                {isDissolved && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                        {t.categoryManager.dissolvedStatus}
                    </span>
                )}
            </td>
            {(type === 'ADMIN_UNIT' && activeAdminTab > 1) && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <div className="flex items-center text-slate-500">
                         {path.length === 0 ? (
                             <span className="text-slate-400 italic">No Parent</span>
                         ) : (
                             path.map((p, idx) => (
                                 <React.Fragment key={idx}>
                                     {idx > 0 && <ChevronRight className="w-3 h-3 mx-1 text-slate-300" />}
                                     <span className={idx === path.length - 1 ? 'font-medium text-slate-700' : 'text-slate-500'}>
                                         {p.name}
                                     </span>
                                 </React.Fragment>
                             ))
                         )}
                     </div>
                </td>
            )}
            <td className={`px-6 py-4 text-sm text-slate-500 truncate max-w-xs ${contentClass}`}>{cat.description || '-'}</td>
            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${actionClass}`}>
                <div className="flex justify-end gap-2">
                    {canEdit && (
                        <button type="button" onClick={() => handleEdit(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100" title={t.common.edit}>
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    
                    {canEdit && canSupportDissolve && (
                        isDissolved ? (
                            <button 
                                type="button"
                                onClick={(e) => handleRestore(cat, e)} 
                                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200 hover:shadow-md transition-all" 
                                title={t.categoryManager.restore}
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                {t.categoryManager.restore}
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={(e) => handleDissolve(cat, e)} 
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded border border-transparent hover:border-amber-100 transition-colors" 
                                title={t.categoryManager.dissolve}
                            >
                                <Archive className="w-4 h-4" />
                            </button>
                        )
                    )}

                    {canDelete && (
                        <button type="button" onClick={(e) => handleDelete(cat.id, cat.code, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100" title={t.common.delete}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
      )});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {title}
            {isHierarchical && type !== 'ADMIN_UNIT' && <FolderTree className="w-5 h-5 text-slate-400" />}
          </h2>
          <p className="text-sm text-slate-500">{t.categoryManager.manage} {title.toLowerCase()} {t.categoryManager.descSuffix}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            type="button"
            onClick={() => StorageService.exportCategoriesToExcel(categories, type)}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.common.template}
          </button>
          {canCreate && (
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.common.add}
              </button>
          )}
        </div>
      </div>

      {type === 'ADMIN_UNIT' && (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <strong>{t.categoryManager.adminNoteTitle}</strong>
                    <ul className="list-disc ml-4 mt-1 space-y-1 opacity-90">
                        <li>{t.categoryManager.adminNote1}</li>
                        <li>{t.categoryManager.adminNote2}</li>
                    </ul>
                </div>
            </div>

            {/* Smart Admin Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
                <button
                    type="button"
                    onClick={() => setActiveAdminTab(1)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeAdminTab === 1 
                        ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    <Map className="w-4 h-4" />
                    {t.categoryManager.adminTabs.level1}
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeAdminTab === 1 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                        {counts[1]}
                    </span>
                </button>
                
                <div className="w-px bg-slate-200 my-2 mx-1"></div>

                <button
                    type="button"
                    onClick={() => setActiveAdminTab(2)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeAdminTab === 2
                        ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    <Building className="w-4 h-4" />
                    {t.categoryManager.adminTabs.level2}
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeAdminTab === 2 ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'}`}>
                        {counts[2]}
                    </span>
                </button>

                <div className="w-px bg-slate-200 my-2 mx-1"></div>

                <button
                    type="button"
                    onClick={() => setActiveAdminTab(3)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeAdminTab === 3
                        ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    <Home className="w-4 h-4" />
                    {t.categoryManager.adminTabs.level3}
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeAdminTab === 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {counts[3]}
                    </span>
                </button>
            </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">{t.common.code}</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">{t.common.name}</th>
              
              {(type === 'ADMIN_UNIT' && activeAdminTab > 1) && (
                   <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                       {t.categoryManager.parent} <span className="font-normal text-slate-400 normal-case">(Hierarchy)</span>
                   </th>
              )}

              {type === 'DEPARTMENT' && (
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t.categoryManager.level}
                  </th>
              )}

              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.common.description}</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {type === 'ADMIN_UNIT' 
                ? renderFlatList() 
                : (isHierarchical ? renderTree() : renderFlatList())
            }
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? t.common.edit : t.common.add} {t.categoryManager.modalTitle}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {type === 'DEPARTMENT' && (
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t.categoryManager.level} (Org Chart)</label>
                      <div className="relative">
                          <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          <select
                              value={formData.level === undefined ? '' : formData.level}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setFormData({...formData, level: isNaN(val) ? undefined : val, parentId: ''}) 
                              }}
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                              <option value="">-- Select Level --</option>
                              <option value="0">{t.categoryManager.levelOptions[0]}</option>
                              <option value="1">{t.categoryManager.levelOptions[1]}</option>
                              <option value="2">{t.categoryManager.levelOptions[2]}</option>
                              <option value="3">{t.categoryManager.levelOptions[3]}</option>
                              <option value="4">{t.categoryManager.levelOptions[4]}</option>
                              <option value="5">{t.categoryManager.levelOptions[5]}</option>
                          </select>
                      </div>
                  </div>
              )}

              {isHierarchical && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.categoryManager.parent} (Optional)</label>
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                      disabled={formData.level === 0} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">{type === 'ADMIN_UNIT' ? t.categoryManager.noParentAdmin : t.categoryManager.noParent}</option>
                      {categories
                        .filter(c => c.id !== editingId)
                        .filter(c => c.status !== 'Dissolved') // Exclude dissolved parents
                        .filter(c => {
                             if (type !== 'DEPARTMENT') return true;
                             if (formData.level === undefined || formData.level === 0) return true;
                             return c.level !== undefined ? c.level < formData.level : true;
                        })
                        .map(c => (
                        <option key={c.id} value={c.id}>
                           {c.code} - {c.name} {c.level !== undefined ? `(L${c.level})` : ''}
                        </option>
                      ))}
                    </select>
                    {formData.level === 0 ? (
                        <p className="text-xs text-amber-600 mt-1 font-medium">{t.categoryManager.errors.levelRootNoParent}</p>
                    ) : (
                        <p className="text-xs text-slate-500 mt-1">{t.categoryManager.parentDesc}</p>
                    )}
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.code} *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="e.g. HN"
                  maxLength={15}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.name} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`e.g. Hanoi`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.description}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {type === 'COMPANY' && (
                  <div className="border-t border-slate-100 pt-4 mt-4 bg-slate-50 -mx-6 px-6 pb-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                          <Link className="w-4 h-4 text-blue-600" /> {t.categoryManager.syncTitle}
                      </h4>
                      <p className="text-xs text-slate-500 mb-3">
                          {t.categoryManager.syncDesc}
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">{t.categoryManager.endpoint}</label>
                            <input
                                type="url"
                                value={formData.appScriptUrl || ''}
                                onChange={(e) => setFormData({...formData, appScriptUrl: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                                placeholder="https://script.google.com/macros/s/..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">{t.categoryManager.sheet}</label>
                            <input
                                type="url"
                                value={formData.googleSheetUrl || ''}
                                onChange={(e) => setFormData({...formData, googleSheetUrl: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                            />
                        </div>
                      </div>
                  </div>
              )}

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
