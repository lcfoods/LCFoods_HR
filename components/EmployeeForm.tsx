
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Category } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, CheckCircle, AlertCircle, MapPin, Loader2, ExternalLink, Sparkles, X, AlertTriangle, Lightbulb, ArrowDownCircle } from 'lucide-react';

interface EmployeeFormProps {
  currentCompanyId: string;
  editingEmployeeId?: string | null;
  onCancel?: () => void;
  onSaveSuccess?: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ currentCompanyId, editingEmployeeId, onCancel, onSaveSuccess }) => {
  const [departments, setDepartments] = useState<Category[]>([]);
  const [positions, setPositions] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Category[]>([]);
  const [adminUnits, setAdminUnits] = useState<Category[]>([]);
  const { t } = useLanguage();

  // Verification State
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ status: 'valid' | 'partial' | 'invalid'; details: string; correction?: string; mapLink?: string; problematicField?: string } | null>(null);

  // Job Analysis State
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [jobAnalysisResult, setJobAnalysisResult] = useState<string | null>(null);

  // Form State
  const initialFormState: Employee = {
    id: '',
    employeeCode: '', 
    identityCard: '', 
    identityIssueDate: '',
    identityPlace: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Male',
    // New Address Fields
    addressDetail: '',
    provinceCode: '',
    districtCode: '',
    wardCode: '',
    isNewAdminSystem: false,
    address: '',
    // ----------------
    jobTitle: '',
    departmentCode: '',
    positionCode: '',
    locationCode: '',
    startDate: '',
    status: 'Active',
    notes: '',
    companyId: ''
  };

  const [formData, setFormData] = useState<Employee>(initialFormState);
  const [formStatus, setFormStatus] = useState<{type: 'success' | 'error' | '', msg: ''}>({ type: '', msg: '' });

  useEffect(() => {
    // Filter out Dissolved Departments
    setDepartments(StorageService.getCategories('DEPARTMENT').filter(d => d.status !== 'Dissolved'));
    setPositions(StorageService.getCategories('POSITION').filter(p => p.status !== 'Dissolved'));
    setLocations(StorageService.getCategories('LOCATION').filter(l => l.status !== 'Dissolved'));
    setAdminUnits(StorageService.getCategories('ADMIN_UNIT'));
    
    if (editingEmployeeId) {
        const emp = StorageService.getEmployeeById(editingEmployeeId);
        if (emp) {
            setFormData(emp);
        }
    } else {
        setFormData(initialFormState);
    }
  }, [currentCompanyId, editingEmployeeId]);

  // --- Address Logic Helpers ---
  
  const provinces = useMemo(() => adminUnits.filter(u => !u.parentId), [adminUnits]);
  
  const selectedProvinceId = useMemo(() => {
      if (!formData.provinceCode) return null;
      const unit = adminUnits.find(u => u.code === formData.provinceCode);
      return unit ? unit.id : null;
  }, [adminUnits, formData.provinceCode]);

  const selectedDistrictId = useMemo(() => {
      if (!formData.districtCode) return null;
      const unit = adminUnits.find(u => u.code === formData.districtCode);
      return unit ? unit.id : null;
  }, [adminUnits, formData.districtCode]);

  const districts = useMemo(() => {
      if (formData.isNewAdminSystem || !selectedProvinceId) return []; 
      return adminUnits.filter(u => u.parentId === selectedProvinceId);
  }, [adminUnits, selectedProvinceId, formData.isNewAdminSystem]);

  const wards = useMemo(() => {
      if (formData.isNewAdminSystem) {
          if (!selectedProvinceId) return [];
          return adminUnits.filter(u => u.parentId === selectedProvinceId);
      } else {
          if (!selectedDistrictId) return [];
          return adminUnits.filter(u => u.parentId === selectedDistrictId);
      }
  }, [adminUnits, selectedProvinceId, selectedDistrictId, formData.isNewAdminSystem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
        const newData = { 
            ...prev, 
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
        };

        if (name === 'isNewAdminSystem') {
             newData.districtCode = '';
             newData.wardCode = '';
        }
        if (name === 'provinceCode') {
            newData.districtCode = '';
            newData.wardCode = '';
        }
        if (name === 'districtCode') {
            newData.wardCode = '';
        }
        return newData;
    });
  };

  const verifyAddress = async () => {
    const prov = adminUnits.find(u => u.code === formData.provinceCode)?.name || '';
    const dist = adminUnits.find(u => u.code === formData.districtCode)?.name || '';
    const ward = adminUnits.find(u => u.code === formData.wardCode)?.name || '';
    const fullAddr = `${formData.addressDetail}, ${ward}, ${dist ? dist + ', ' : ''}${prov}`;

    if (!fullAddr.trim() || !prov) return;
    
    setIsVerifyingAddress(true);
    setVerificationResult(null);
    try {
        const result = await GeminiService.verifyAddress(fullAddr);
        setVerificationResult(result);
    } catch (e) {
        setVerificationResult({ status: 'invalid', details: t.common.error });
    } finally {
        setIsVerifyingAddress(false);
    }
  };

  const applyAddressCorrection = (correction: string) => {
      setFormData(prev => ({...prev, addressDetail: correction}));
  };

  const analyzeJobTitle = async () => {
    if (!formData.jobTitle) return;
    setIsAnalyzingJob(true);
    setJobAnalysisResult(null);
    try {
        const result = await GeminiService.analyzeJobTitle(formData.jobTitle);
        setJobAnalysisResult(result);
    } catch (e) {
        setJobAnalysisResult("Analysis failed.");
    } finally {
        setIsAnalyzingJob(false);
    }
  };

  const validate = (): boolean => {
    // Required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.departmentCode || !formData.positionCode) {
      setFormStatus({ type: 'error', msg: t.employeeForm.errorReq as any });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus({ type: 'error', msg: t.employeeForm.errorEmail as any });
      return false;
    }

    // Validate Employee Code Format
    if (formData.employeeCode) {
        const codeRegex = /^[A-Z0-9]+$/; 
        if (!codeRegex.test(formData.employeeCode)) {
             setFormStatus({ type: 'error', msg: t.employeeForm.errorFormat as any });
             return false;
        }
    }

    // Validate Identity Card Format (9 or 12 digits)
    if (formData.identityCard) {
        const idRegex = /^(\d{9}|\d{12})$/;
        if (!idRegex.test(formData.identityCard)) {
             setFormStatus({ type: 'error', msg: t.employeeForm.errorIdentityFormat as any });
             return false;
        }
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let codeToSave = formData.employeeCode;
    if (!codeToSave) {
        codeToSave = StorageService.generateNextEmployeeCode(currentCompanyId);
    }

    const employeeToSave = {
      ...formData,
      id: formData.id || crypto.randomUUID(),
      employeeCode: codeToSave,
      companyId: currentCompanyId
    };

    const result = StorageService.saveEmployee(employeeToSave);

    if (result.success) {
      const successMsg = !formData.employeeCode 
        ? `${t.employeeForm.success} (Generated: ${codeToSave})` 
        : t.employeeForm.success;
        
      setFormStatus({ type: 'success', msg: successMsg as any });
      
      if (!editingEmployeeId) {
          setFormData(initialFormState);
          setVerificationResult(null);
          setJobAnalysisResult(null);
      }
      
      setTimeout(() => {
          setFormStatus({ type: '', msg: '' });
          if (onSaveSuccess) onSaveSuccess();
      }, 2000);
      
    } else {
      setFormStatus({ type: 'error', msg: result.error as any });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Check for IME composition (Vietnamese typing)
      if (e.nativeEvent.isComposing) return;

      const target = e.target as HTMLElement;
      
      // Allow default behavior for Textarea (New Line)
      if (target.tagName === 'TEXTAREA') return;

      // Skip Buttons in Enter navigation to focus on data entry
      if (target.tagName === 'BUTTON') return;

      e.preventDefault();

      const form = e.currentTarget as HTMLFormElement;
      // Get all interactive inputs, selects, textareas. Exclude buttons, hidden fields, disabled and readonly.
      const selector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])';
      const elements = Array.from(form.querySelectorAll(selector)) as HTMLElement[];
      
      const index = elements.indexOf(target);
      
      if (index > -1) {
          if (e.shiftKey) {
              // Shift + Enter: Move Backward
              if (index > 0) {
                  elements[index - 1].focus();
              }
          } else {
              // Enter: Move Forward
              if (index < elements.length - 1) {
                  elements[index + 1].focus();
              }
          }
      }
    }
  };

  // Helper to apply red border if field is marked problematic by AI
  const getErrorClass = (fieldName: string) => {
      if (verificationResult?.problematicField === fieldName) {
          return 'border-red-500 ring-1 ring-red-500 bg-red-50';
      }
      return 'border-slate-300 focus:ring-blue-500 focus:border-blue-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-900">{editingEmployeeId ? t.common.edit : t.employeeForm.title}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">{t.employeeForm.detailsHeader}</h3>
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
             {t.employeeForm.syncEnabled}
          </div>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-6 space-y-8">
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.employeeForm.personalInfo}</h4>
            
            {/* Main Info - Part 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.employeeCode}</label>
                 <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode || ''}
                    onChange={(e) => setFormData({...formData, employeeCode: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="Auto-generate if blank"
                 />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.gender}</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.lastName} *</label>
                <input
                  required
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.firstName} *</label>
                <input
                  required
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Identity Group (Moved Here) */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4">
               <label className="block text-sm font-bold text-slate-700 mb-3">Định danh công dân</label>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.identityCard}</label>
                     <input
                        type="text"
                        name="identityCard"
                        value={formData.identityCard || ''}
                        onChange={(e) => setFormData({...formData, identityCard: e.target.value.replace(/\D/g,'')})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="12 digits"
                        maxLength={12}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.identityIssueDate}</label>
                     <input
                        type="date"
                        name="identityIssueDate"
                        value={formData.identityIssueDate || ''}
                        onChange={handleInputChange}
                        disabled={!formData.identityCard}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.identityPlace}</label>
                     <select
                        name="identityPlace"
                        value={formData.identityPlace || ''}
                        onChange={handleInputChange}
                        disabled={!formData.identityCard}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 text-sm"
                     >
                         <option value="">{t.employeeForm.placeholders.select}</option>
                         {t.employeeForm.identityPlaces.map((place, idx) => (
                             <option key={idx} value={place}>{place}</option>
                         ))}
                     </select>
                  </div>
               </div>
            </div>

            {/* Main Info - Part 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.dob}</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.email} *</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.phone}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Address Group */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex items-center justify-between mb-3">
                   <label className="block text-sm font-bold text-slate-700">{t.employeeForm.fields.addressLabel}</label>
                   
                   <label className="flex items-center gap-2 cursor-pointer select-none">
                       <input 
                           type="checkbox" 
                           name="isNewAdminSystem"
                           checked={formData.isNewAdminSystem}
                           onChange={handleInputChange}
                           className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                       />
                       <span className="text-xs font-medium text-slate-600">{t.employeeForm.fields.newAdminSystem}</span>
                   </label>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                   <div>
                       <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.province}</label>
                       <select
                           name="provinceCode"
                           value={formData.provinceCode}
                           onChange={handleInputChange}
                           className={`w-full px-3 py-2 rounded-lg text-sm ${getErrorClass('provinceCode')}`}
                       >
                           <option value="">{t.employeeForm.placeholders.select}</option>
                           {provinces.map(p => (
                               <option key={p.id} value={p.code}>{p.name}</option>
                           ))}
                       </select>
                   </div>

                   {!formData.isNewAdminSystem && (
                       <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.district}</label>
                           <select
                               name="districtCode"
                               value={formData.districtCode}
                               onChange={handleInputChange}
                               disabled={!formData.provinceCode}
                               className={`w-full px-3 py-2 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-400 ${getErrorClass('districtCode')}`}
                           >
                               <option value="">{t.employeeForm.placeholders.select}</option>
                               {districts.map(d => (
                                   <option key={d.id} value={d.code}>{d.name}</option>
                               ))}
                           </select>
                       </div>
                   )}

                   <div>
                       <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.ward}</label>
                       <select
                           name="wardCode"
                           value={formData.wardCode}
                           onChange={handleInputChange}
                           disabled={
                               !formData.provinceCode || 
                               (!formData.isNewAdminSystem && !formData.districtCode)
                           }
                           className={`w-full px-3 py-2 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-400 ${getErrorClass('wardCode')}`}
                       >
                           <option value="">{t.employeeForm.placeholders.select}</option>
                           {wards.map(w => (
                               <option key={w.id} value={w.code}>{w.name}</option>
                           ))}
                       </select>
                   </div>
               </div>

               <div className="relative">
                   <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.addressDetail}</label>
                   <div className="flex gap-2">
                        <input
                            type="text"
                            name="addressDetail"
                            value={formData.addressDetail}
                            onChange={handleInputChange}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${getErrorClass('addressDetail')}`}
                            placeholder={t.employeeForm.placeholders.addressDetail}
                        />
                        <button
                            type="button"
                            onClick={verifyAddress}
                            disabled={!formData.addressDetail || isVerifyingAddress}
                            className="px-3 py-2 bg-slate-100 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                            title={t.employeeForm.verifyAddr}
                        >
                            {isVerifyingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                        </button>
                   </div>
                   
                   {verificationResult && (
                       <div className={`mt-3 p-4 rounded-xl border text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                           verificationResult.status === 'valid' ? 'bg-green-50 border-green-200 text-green-900' :
                           verificationResult.status === 'partial' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                           'bg-red-50 border-red-200 text-red-900'
                       }`}>
                           <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                               verificationResult.status === 'valid' ? 'bg-green-200 text-green-700' : 
                               verificationResult.status === 'partial' ? 'bg-amber-200 text-amber-700' :
                               'bg-red-200 text-red-700'
                           }`}>
                               {verificationResult.status === 'valid' ? <CheckCircle className="w-5 h-5" /> : 
                                verificationResult.status === 'partial' ? <AlertTriangle className="w-5 h-5" /> :
                                <AlertCircle className="w-5 h-5" />}
                           </div>
                           
                           <div className="flex-1">
                               <div className="flex justify-between items-start">
                                    <h5 className="font-bold text-base mb-1">
                                        {verificationResult.status === 'valid' ? 'Address Verified' : 
                                         verificationResult.status === 'partial' ? 'Address Needs Review' : 
                                         'Invalid Address'}
                                    </h5>
                                    <button 
                                        onClick={() => setVerificationResult(null)} 
                                        className="text-current opacity-40 hover:opacity-100 p-1"
                                    >
                                        <X className="w-4 h-4"/>
                                    </button>
                               </div>
                               
                               <p className="leading-relaxed opacity-90 mb-3 text-slate-700">
                                   {verificationResult.details}
                               </p>
                               
                               {verificationResult.correction && (
                                   <div className="mb-3 p-3 bg-white/80 rounded-lg border border-slate-200 shadow-sm">
                                       <div className="flex items-center gap-2 mb-1.5">
                                           <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                           <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">Suggested Correction</span>
                                       </div>
                                       <div className="flex items-center justify-between gap-3">
                                            <span className="font-medium text-slate-900 break-all">{verificationResult.correction}</span>
                                            <button 
                                                type="button"
                                                onClick={() => applyAddressCorrection(verificationResult.correction!)}
                                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 shadow-sm transition-colors"
                                            >
                                                <ArrowDownCircle className="w-3.5 h-3.5" /> 
                                                Apply
                                            </button>
                                       </div>
                                   </div>
                               )}

                               {verificationResult.mapLink && (
                                   <a 
                                       href={verificationResult.mapLink} 
                                       target="_blank" 
                                       rel="noreferrer"
                                       className="inline-flex items-center text-xs font-bold underline hover:no-underline opacity-80 hover:opacity-100 transition-opacity"
                                   >
                                       View location on Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                                   </a>
                               )}
                           </div>
                       </div>
                   )}
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.employeeForm.employmentDetails}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.department} *</label>
                <select
                  required
                  name="departmentCode"
                  value={formData.departmentCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.employeeForm.placeholders.select}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.position} *</label>
                <select
                  required
                  name="positionCode"
                  value={formData.positionCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.employeeForm.placeholders.select}</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Job Title - Moved After Position */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.jobTitle}</label>
                <div className="flex gap-2 relative">
                    <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={analyzeJobTitle}
                        disabled={!formData.jobTitle || isAnalyzingJob}
                        className="px-3 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                        title="Analyze Job Title for Compliance"
                    >
                        {isAnalyzingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span className="hidden sm:inline text-xs font-medium">Analyze</span>
                    </button>
                </div>
                
                {jobAnalysisResult && (
                    <div className="mt-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 relative">
                        <button 
                            onClick={() => setJobAnalysisResult(null)}
                            className="absolute top-3 right-3 text-purple-400 hover:text-purple-700 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-start gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600 shrink-0">
                                <Lightbulb className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h5 className="font-bold text-purple-900 text-sm mb-1">AI Job Title Analysis</h5>
                                <div className="prose prose-sm text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                    {jobAnalysisResult}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.location}</label>
                <select
                  name="locationCode"
                  value={formData.locationCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.employeeForm.placeholders.select}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.startDate}</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.status}</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={true}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-slate-500 cursor-not-allowed"
                >
                  <option value="Active">Active</option>
                  <option value="OnLeave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeDetail.notes}</label>
               <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Additional remarks..."
               />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
            {onCancel && (
                <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                {t.common.cancel}
                </button>
            )}
            <button
              type="submit"
              className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {t.common.save}
            </button>
          </div>
        </form>
        
        {formStatus.msg && (
            <div className={`p-4 text-center text-sm font-medium ${formStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {formStatus.msg}
            </div>
        )}
      </div>
    </div>
  );
};
