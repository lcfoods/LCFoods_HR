import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Save, ExternalLink, Settings as SettingsIcon, CheckCircle } from 'lucide-react';

export const Settings = () => {
  const [formData, setFormData] = useState({
    googleSheetUrl: '',
    appScriptUrl: ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const settings = StorageService.getSettings();
    setFormData(settings);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = StorageService.saveSettings(formData);
    if (result.success) {
      setStatus('Settings saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
         <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
             <SettingsIcon className="w-6 h-6" />
         </div>
         <div>
             <h2 className="text-2xl font-bold text-slate-900">System Configuration</h2>
             <p className="text-slate-500">Configure external connections for data synchronization.</p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Google Sheet URL</label>
            <p className="text-xs text-slate-500 mb-2">The Google Sheet where employee data will be backed up.</p>
            <div className="relative">
                <input
                    type="url"
                    value={formData.googleSheetUrl}
                    onChange={(e) => setFormData({...formData, googleSheetUrl: e.target.value})}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.googleSheetUrl && (
                    <a href={formData.googleSheetUrl} target="_blank" rel="noreferrer" className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-600">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Google Apps Script Web App URL</label>
             <p className="text-xs text-slate-500 mb-2">The deployed Web App URL for handling data POST requests.</p>
            <div className="relative">
                <input
                    type="url"
                    value={formData.appScriptUrl}
                    onChange={(e) => setFormData({...formData, appScriptUrl: e.target.value})}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
           {status && (
               <div className="flex items-center text-green-600 text-sm font-medium">
                   <CheckCircle className="w-4 h-4 mr-2" />
                   {status}
               </div>
           )}
           <div className="flex-1"></div>
           <button 
             type="submit"
             className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium flex items-center shadow-lg"
           >
             <Save className="w-4 h-4 mr-2" />
             Save Configuration
           </button>
        </div>
      </form>
    </div>
  );
};