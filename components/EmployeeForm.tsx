import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Category } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, CheckCircle, AlertCircle, MapPin, Loader2, ExternalLink } from 'lucide-react';

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
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; details: string; mapLink?: string } | null>(null);

  // Form State
  const initialFormState: Employee = {
    id: '',
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
    setDepartments(StorageService.getCategories('DEPARTMENT'));
    setPositions(StorageService.getCategories('POSITION'));
    setLocations(StorageService.getCategories('LOCATION'));
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

  // --- Address Logic Helpers (FIXED) ---
  
  // 1. Get List of Provinces (Items with no parent)
  const provinces = useMemo(() => adminUnits.filter(u => !u.parentId), [adminUnits]);
  
  // 2. Resolve Province ID from the selected Province Code
  // IMPORTANT: We store 'Code' in formData, but hierarchy uses 'ID' for parentId
  const selectedProvinceId = useMemo(() => {
      if (!formData.provinceCode) return null;
      // Find the unit that has the selected code (and is likely a province/root)
      const unit = adminUnits.find(u => u.code === formData.provinceCode);
      return unit ? unit.id : null;
  }, [adminUnits, formData.provinceCode]);

  // 3. Resolve District ID from the selected District Code
  const selectedDistrictId = useMemo(() => {
      if (!formData.districtCode) return null;
      const unit = adminUnits.find(u => u.code === formData.districtCode);
      return unit ? unit.id : null;
  }, [adminUnits, formData.districtCode]);

  // 4. Filter Districts
  // Show if: Not New Admin System AND Province is Selected
  const districts = useMemo(() => {
      if (formData.isNewAdminSystem || !selectedProvinceId) return []; 
      // Return units whose parent is the selected Province ID
      return adminUnits.filter(u => u.parentId === selectedProvinceId);
  }, [adminUnits, selectedProvinceId, formData.isNewAdminSystem]);

  // 5. Filter Wards
  const wards = useMemo(() => {
      if (formData.isNewAdminSystem) {
          // If New System: Wards are direct children of Province
          if (!selectedProvinceId) return [];
          return adminUnits.filter(u => u.parentId === selectedProvinceId);
      } else {
          // If Old System: Wards are children of District
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

        // Cascading Reset Logic
        if (name === 'isNewAdminSystem') {
             // Reset children when toggling system
             newData.districtCode = '';
             newData.wardCode = '';
        }
        if (name === 'provinceCode') {
            // Reset lower levels when province changes
            newData.districtCode = '';
            newData.wardCode = '';
        }
        if (name === 'districtCode') {
            // Reset ward when district changes
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
        setVerificationResult({ isValid: false, details: t.common.error });
    } finally {
        setIsVerifyingAddress(false);
    }
  };

  const validate = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.departmentCode || !formData.positionCode) {
      setFormStatus({ type: 'error', msg: t.employeeForm.errorReq as any });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus({ type: 'error', msg: t.employeeForm.errorEmail as any });
      return false;
    }
    
    if (!formData.provinceCode) {
        setFormStatus({ type: 'error', msg: "Vui lòng chọn Tỉnh/Thành phố." as any });
        return false;
    }
    if (!formData.isNewAdminSystem && !formData.districtCode) {
        setFormStatus({ type: 'error', msg: "Vui lòng chọn Quận/Huyện." as any });
        return false;
    }
    if (!formData.wardCode) {
        setFormStatus({ type: 'error', msg: "Vui lòng chọn Phường/Xã." as any });
        return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const employeeToSave = {
      ...formData,
      id: formData.id || crypto.randomUUID(),
      companyId: currentCompanyId
    };

    const result = StorageService.saveEmployee(employeeToSave);

    if (result.success) {
      setFormStatus({ type: 'success', msg: t.employeeForm.success as any });
      
      if (!editingEmployeeId) {
          setFormData(initialFormState);
          setVerificationResult(null);
      }
      
      setTimeout(() => {
          setFormStatus({ type: '', msg: '' });
          if (onSaveSuccess) onSaveSuccess();
      }, 1500);
      
    } else {
      setFormStatus({ type: 'error', msg: result.error as any });
    }
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

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.employeeForm.personalInfo}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            
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
                   {/* Province Selection */}
                   <div>
                       <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.province}</label>
                       <select
                           name="provinceCode"
                           value={formData.provinceCode}
                           onChange={handleInputChange}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                       >
                           <option value="">{t.employeeForm.placeholders.select}</option>
                           {provinces.map(p => (
                               <option key={p.id} value={p.code}>{p.name}</option>
                           ))}
                       </select>
                   </div>

                   {/* District Selection - Only show if NOT New Admin System */}
                   {!formData.isNewAdminSystem && (
                       <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.district}</label>
                           <select
                               name="districtCode"
                               value={formData.districtCode}
                               onChange={handleInputChange}
                               disabled={!formData.provinceCode}
                               className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                           >
                               <option value="">{t.employeeForm.placeholders.select}</option>
                               {districts.map(d => (
                                   <option key={d.id} value={d.code}>{d.name}</option>
                               ))}
                           </select>
                       </div>
                   )}

                   {/* Ward Selection */}
                   <div>
                       <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.ward}</label>
                       <select
                           name="wardCode"
                           value={formData.wardCode}
                           onChange={handleInputChange}
                           // Disable if no parent selected
                           disabled={
                               !formData.provinceCode || 
                               (!formData.isNewAdminSystem && !formData.districtCode)
                           }
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                       >
                           <option value="">{t.employeeForm.placeholders.select}</option>
                           {wards.map(w => (
                               <option key={w.id} value={w.code}>{w.name}</option>
                           ))}
                       </select>
                   </div>
               </div>

               {/* Detail Address */}
               <div className="relative">
                   <label className="block text-xs font-medium text-slate-500 mb-1">{t.employeeForm.fields.addressDetail}</label>
                   <div className="flex gap-2">
                        <input
                            type="text"
                            name="addressDetail"
                            value={formData.addressDetail}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder={t.employeeForm.placeholders.addressDetail}
                        />
                        <button 
                            type="button" 
                            onClick={verifyAddress}
                            disabled={!formData.addressDetail || isVerifyingAddress}
                            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                            title={t.employeeForm.verifyAddr}
                        >
                            {isVerifyingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                        </button>
                   </div>
                   
                   {verificationResult && (
                     <div className={`mt-2 p-2 rounded border text-xs animate-in fade-in slide-in-from-top-1 ${
                        verificationResult.isValid 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                     }`}>
                       <div className="flex items-center font-bold">
                          {verificationResult.isValid 
                              ? <CheckCircle className="w-3 h-3 mr-1" /> 
                              : <AlertCircle className="w-3 h-3 mr-1" />
                          }
                          {verificationResult.isValid ? t.employeeDetail.verifySuccess : t.employeeDetail.verifyReview}
                       </div>
                       <p className="mt-1 opacity-90">{verificationResult.details}</p>
                     </div>
                   )}
               </div>
            </div>
          </div>

          <hr className="border-slate-100" />

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
                  <option value="">{t.employeeForm.placeholders.select} {t.employeeForm.fields.department}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
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
                  <option value="">{t.employeeForm.placeholders.select} {t.employeeForm.fields.position}</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.code}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.jobTitle}</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.employeeForm.fields.location}</label>
                <select
                  name="locationCode"
                  value={formData.locationCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.employeeForm.placeholders.select} {t.employeeForm.fields.location}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.code}>{l.name} ({l.code})</option>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="OnLeave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              {formStatus.type === 'error' && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {formStatus.msg}
                </div>
              )}
              {formStatus.type === 'success' && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {formStatus.msg}
                </div>
              )}
            </div>
            <div className="flex space-x-3">
               {onCancel && (
                   <button 
                    type="button" 
                    onClick={onCancel}
                    className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                   >
                     {t.common.cancel}
                   </button>
               )}
               <button 
                type="button" 
                onClick={() => setFormData(initialFormState)}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
               >
                 {t.common.reset}
               </button>
               <button 
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center shadow-md transition-colors"
               >
                 <Save className="w-4 h-4 mr-2" />
                 {editingEmployeeId ? t.common.save : t.common.add}
               </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};