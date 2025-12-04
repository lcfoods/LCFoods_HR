

import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Category, SystemSettings } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, ExternalLink, Settings as SettingsIcon, CheckCircle, Building, Link as LinkIcon, AlertCircle, FileSpreadsheet, Trash2, AlertTriangle } from 'lucide-react';

export const Settings = () => {
  const [formData, setFormData] = useState<SystemSettings>({
    googleSheetUrl: '',
    appScriptUrl: '',
    exportColumns: []
  });
  const [companies, setCompanies] = useState<Category[]>([]);
  const [status, setStatus] = useState('');
  const { t } = useLanguage();

  // Updated order: Last Name then First Name
  const allColumns = [
      { key: 'id', label: 'ID' },
      { key: 'lastName', label: t.employeeForm.fields.lastName },
      { key: 'firstName', label: t.employeeForm.fields.firstName },
      { key: 'email', label: t.employeeForm.fields.email },
      { key: 'phone', label: t.employeeForm.fields.phone },
      { key: 'dob', label: t.employeeForm.fields.dob },
      { key: 'gender', label: t.employeeForm.fields.gender },
      { key: 'address', label: t.employeeForm.fields.addressLabel },
      { key: 'departmentCode', label: t.employeeForm.fields.department },
      { key: 'positionCode', label: t.employeeForm.fields.position },
      { key: 'locationCode', label: t.employeeForm.fields.location },
      { key: 'startDate', label: t.employeeForm.fields.startDate },
      { key: 'status', label: t.employeeForm.fields.status },
      { key: 'jobTitle', label: t.employeeForm.fields.jobTitle },
      { key: 'notes', label: t.employeeDetail.notes }
  ];

  useEffect(() => {
    loadSettings();
    setCompanies(StorageService.getCategories('COMPANY'));
  }, []);

  const loadSettings = () => {
    const settings = StorageService.getSettings();
    setFormData({
        googleSheetUrl: settings.googleSheetUrl || '',
        appScriptUrl: settings.appScriptUrl || '',
        exportColumns: settings.exportColumns || allColumns.map(c => c.key)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = StorageService.saveSettings(formData);
    
    if (result.success) {
      loadSettings(); 
      setStatus(t.settings.saved);
      setTimeout(() => setStatus(''), 3000);
    } else {
      setStatus(t.common.error);
    }
  };

  const toggleColumn = (key: string) => {
      setFormData(prev => {
          const current = prev.exportColumns || [];
          const exists = current.includes(key);
          const newCols = exists ? current.filter(c => c !== key) : [...current, key];
          return { ...prev, exportColumns: newCols };
      });
  };

  const handleReset = () => {
      if (window.confirm(t.settings.confirmReset)) {
          StorageService.resetSystem();
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
         <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
             <SettingsIcon className="w-6 h-6" />
         </div>
         <div>
             <h2 className="text-2xl font-bold text-slate-900">{t.settings.title}</h2>
             <p className="text-slate-500">{t.settings.subtitle}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8">
            {/* Global Configuration */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4 text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-800">{t.settings.globalDefaults}</h3>
                </div>
                
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t.settings.defaultSheet}</label>
                        <p className="text-xs text-slate-500 mb-2">{t.settings.defaultSheetDesc}</p>
                        <div className="relative">
                            <input
                                type="url"
                                value={formData.googleSheetUrl}
                                onChange={(e) => setFormData({...formData, googleSheetUrl: e.target.value})}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {formData.googleSheetUrl && (
                                <a href={formData.googleSheetUrl} target="_blank" rel="noreferrer" className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-600">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t.settings.defaultEndpoint}</label>
                        <p className="text-xs text-slate-500 mb-2">{t.settings.defaultEndpointDesc}</p>
                        <div className="relative">
                            <input
                                type="url"
                                value={formData.appScriptUrl}
                                onChange={(e) => setFormData({...formData, appScriptUrl: e.target.value})}
                                placeholder="https://script.google.com/macros/s/..."
                                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* Excel Configuration */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-800">{t.settings.exportConfig}</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <p className="text-xs text-slate-500 mb-4">{t.settings.exportConfigDesc}</p>
                    <div className="grid grid-cols-2 gap-3">
                        {allColumns.map(col => (
                            <label key={col.key} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={(formData.exportColumns || []).includes(col.key)}
                                    onChange={() => toggleColumn(col.key)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span>{col.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium flex items-center shadow-lg transition-transform active:scale-95"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {t.common.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Company Links Overview */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-800">{t.settings.companyLinks}</h3>
           </div>
           
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden sticky top-8">
             {companies.length > 0 ? (
                 <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {companies.map(company => {
                        const hasCustomLink = !!company.appScriptUrl;
                        return (
                            <div key={company.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-slate-800 text-sm flex items-center">
                                        {company.name}
                                        <span className="text-xs font-normal text-slate-400 ml-2">({company.code})</span>
                                    </h4>
                                    {hasCustomLink ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            <LinkIcon className="w-3 h-3 mr-1" /> {t.settings.custom}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                                            {t.settings.default}
                                        </span>
                                    )}
                                </div>
                                
                                {hasCustomLink ? (
                                    <div className="space-y-1 mt-2">
                                        <div className="flex items-center text-xs text-slate-600">
                                            <span className="w-16 font-medium text-slate-400">Endpoint:</span>
                                            <span className="truncate flex-1 font-mono bg-slate-50 px-1 py-0.5 rounded">{company.appScriptUrl?.substring(0, 35)}...</span>
                                        </div>
                                        {company.googleSheetUrl && (
                                            <div className="flex items-center text-xs text-blue-600">
                                                <span className="w-16 font-medium text-slate-400">Sheet:</span>
                                                <a href={company.googleSheetUrl} target="_blank" rel="noreferrer" className="flex items-center hover:underline truncate flex-1">
                                                    {t.settings.editHint} <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 mt-1 italic">{t.settings.usingGlobal}</p>
                                )}
                            </div>
                        );
                    })}
                 </div>
             ) : (
                 <div className="p-8 text-center text-slate-400">
                     <Building className="w-8 h-8 mx-auto mb-2 opacity-20" />
                     <p>{t.common.noRecords}</p>
                 </div>
             )}
             <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
                 <p className="text-xs text-slate-500 flex items-center">
                     <AlertCircle className="w-3 h-3 mr-1.5" />
                     {t.settings.editHint}
                 </p>
             </div>
           </div>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="border border-red-200 rounded-xl overflow-hidden mt-10 shadow-sm animate-in fade-in slide-in-from-bottom-8">
          <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-900">{t.settings.dangerZone}</h3>
          </div>
          <div className="p-6 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                  <h4 className="font-bold text-slate-800 mb-1">{t.settings.resetData}</h4>
                  <p className="text-sm text-slate-500 max-w-xl">
                      {t.settings.resetDataDesc}
                  </p>
              </div>
              <button 
                  onClick={handleReset}
                  className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center shrink-0"
              >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.settings.resetData}
              </button>
          </div>
      </div>

      {status && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center animate-in slide-in-from-bottom-4 z-50">
              <CheckCircle className="w-5 h-5 mr-2" />
              {status}
          </div>
      )}
    </div>
  );
};
