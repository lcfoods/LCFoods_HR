import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { StorageService } from '../services/storageService';
import { Plus, Download, Trash2, Edit2, Save, X, FileText, ChevronRight, ChevronDown, FolderTree, AlertTriangle } from 'lucide-react';

interface CategoryManagerProps {
  type: Category['type'];
  title: string;
  isHierarchical?: boolean;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ type, title, isHierarchical = false }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Category>>({
    code: '',
    name: '',
    description: '',
    parentId: ''
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
      setError('Code and Name are required.');
      return;
    }

    const newCategory: Category = {
      id: editingId || crypto.randomUUID(),
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || '',
      type: type,
      parentId: formData.parentId || null
    };

    const result = StorageService.saveCategory(newCategory);

    if (result.success) {
      loadData();
      handleCloseModal();
    } else {
      setError(result.error || 'Failed to save');
    }
  };

  const handleEdit = (cat: Category) => {
    setFormData({
      code: cat.code,
      name: cat.name,
      description: cat.description,
      parentId: cat.parentId || ''
    });
    setEditingId(cat.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? If it has sub-categories, they will also be deleted.')) {
      StorageService.deleteCategory(id);
      loadData();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ code: '', name: '', description: '', parentId: '' });
    setError('');
  };

  // --- Recursive Tree Rendering ---
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
                level === 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {node.code}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
            {node.name}
            {type === 'ADMIN_UNIT' && level === 0 && (
                 <span className="ml-2 text-xs text-slate-400 font-normal">(Prov/City)</span>
            )}
             {type === 'ADMIN_UNIT' && level === 1 && (
                 <span className="ml-2 text-xs text-slate-400 font-normal">(Dist/Ward)</span>
            )}
          </td>
          <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{node.description || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => handleEdit(node)} className="text-blue-600 hover:text-blue-900 mr-4">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(node.id)} className="text-red-600 hover:text-red-900">
              <Trash2 className="w-4 h-4" />
            </button>
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
          <p className="text-sm text-slate-500">Manage {title.toLowerCase()} codes and hierarchy.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => StorageService.downloadTemplate(type)}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Template
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </button>
        </div>
      </div>

      {type === 'ADMIN_UNIT' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
                <strong>Administrative Boundaries Note (Effective 01/07/2025):</strong>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Standard Structure: Province/City → District → Ward (3 Levels).</li>
                    <li>New Structure: Province/City → Ward/Commune (2 Levels).</li>
                </ul>
                <p className="mt-1 text-xs opacity-80">Use the "Parent Unit" selector below to define whether a Ward belongs directly to a Province (2-level) or a District (3-level).</p>
            </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{cat.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{cat.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-900 mr-4">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No records found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Edit' : 'Add'} {title}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {isHierarchical && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent {title} (Optional)</label>
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- No Parent (Root Level) --</option>
                      {categories
                        .filter(c => c.id !== editingId) // Prevent self-parenting
                        .map(c => (
                        <option key={c.id} value={c.id}>
                           {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Select a parent to nest this item (e.g., District inside Province).</p>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`e.g. Hanoi`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};