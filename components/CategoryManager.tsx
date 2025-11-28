import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { StorageService } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Download, Trash2, Edit2, Save, X, FileText, ChevronRight, ChevronDown, FolderTree, AlertTriangle, Link, ExternalLink } from 'lucide-react';

interface CategoryManagerProps {
  type: Category['type'];
  title: string;
  isHierarchical?: boolean;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ type, title, isHierarchical = false }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<Partial<Category>>({
    code: '',
    name: '',
    description: '',
    parentId: '',
    appScriptUrl: '',
    googleSheetUrl: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = () => {
    setCategories(StorageService.getCategories(type));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code || !formData.name) {
      setError(t.categoryManager.reqFields);
      return;
    }

    const newCategory: Category = {
      id: editingId || crypto.randomUUID(),
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || '',
      type: type,
      parentId: formData.parentId || null,
      appScriptUrl: formData.appScriptUrl || undefined,
      googleSheetUrl: formData.googleSheetUrl || undefined
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
      appScriptUrl: cat.appScriptUrl || '',
      googleSheetUrl: cat.googleSheetUrl || ''
    });
    setEditingId(cat.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.categoryManager.confirmDelete)) {
      StorageService.deleteCategory(id);
      loadData();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ code: '', name: '', description: '', parentId: '', appScriptUrl: '', googleSheetUrl: '' });
    setError('');
  };

  const renderTree = (parentId: string | null = null, level = 0) => {
    const nodes = categories.filter(c => c.parentId === parentId);
    
    if (nodes.length === 0) return null;

    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <tr className="hover:bg-slate-50 group">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {isHierarchical && level > 0 && (
                <span className="text-slate-300 mr-2">└─</span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                level === 0 ? 'bg-blue-100 text-blue-800' : 
                level === 1 ? 'bg-indigo-100 text-indigo-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                {node.code}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
            {node.name}
            {type === 'ADMIN_UNIT' && level === 0 && (
                 <span className="ml-2 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-normal">Tỉnh/TP</span>
            )}
             {type === 'ADMIN_UNIT' && level === 1 && (
                 <span className="ml-2 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-normal">Quận/Huyện</span>
            )}
            {type === 'COMPANY' && node.appScriptUrl && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800" title={t.categoryManager.synced}>
                    <Link className="w-3 h-3 mr-1" /> {t.categoryManager.synced}
                </span>
            )}
          </td>
          <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{node.description || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex justify-end gap-3">
                <button onClick={() => handleEdit(node)} className="text-blue-600 hover:text-blue-900" title={t.common.edit}>
                <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(node.id)} className="text-red-600 hover:text-red-900" title={t.common.delete}>
                <Trash2 className="w-4 h-4" />
                </button>
            </div>
          </td>
        </tr>
        {renderTree(node.id, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {title}
            {isHierarchical && <FolderTree className="w-5 h-5 text-slate-400" />}
          </h2>
          <p className="text-sm text-slate-500">{t.categoryManager.manage} {title.toLowerCase()} {t.categoryManager.descSuffix}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => StorageService.downloadTemplate(type)}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.common.template}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.common.add}
          </button>
        </div>
      </div>

      {type === 'ADMIN_UNIT' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
                <strong>{t.categoryManager.adminNoteTitle}</strong>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>{t.categoryManager.adminNote1}</li>
                    <li>{t.categoryManager.adminNote2}</li>
                </ul>
                <p className="mt-1 text-xs opacity-80">{t.categoryManager.adminNoteDesc}</p>
            </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">{t.common.code}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">{t.common.name}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.common.description}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {categories.length > 0 ? (
                isHierarchical ? renderTree() : categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {cat.code}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {cat.name}
                            {type === 'COMPANY' && cat.appScriptUrl && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800" title={t.categoryManager.synced}>
                                    <Link className="w-3 h-3 mr-1" /> {t.categoryManager.synced}
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{cat.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-3">
                                <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-900" title={t.common.edit}>
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900" title={t.common.delete}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{t.common.noRecords}</p>
                </td>
              </tr>
            )}
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
              
              {isHierarchical && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.categoryManager.parent} (Optional)</label>
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{type === 'ADMIN_UNIT' ? t.categoryManager.noParentAdmin : t.categoryManager.noParent}</option>
                      {categories
                        .filter(c => c.id !== editingId) 
                        .map(c => (
                        <option key={c.id} value={c.id}>
                           {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">{t.categoryManager.parentDesc}</p>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.code} *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
