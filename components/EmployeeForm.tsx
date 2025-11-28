
import React, { useState, useEffect } from 'react';
import { Employee, Category } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Save, CheckCircle, AlertCircle, MapPin, Loader2 } from 'lucide-react';

interface EmployeeFormProps {
  currentCompanyId: string;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ currentCompanyId }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Category[]>([]);
  const [positions, setPositions] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Category[]>([]);

  // Verification State
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [addressVerificationMsg, setAddressVerificationMsg] = useState('');

  // Form State
  const initialFormState: Employee = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Male',
    address: '',
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
    setEmployees(StorageService.getEmployees(currentCompanyId));
  }, [currentCompanyId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const verifyAddress = async () => {
    if (!formData.address) return;
    setIsVerifyingAddress(true);
    const result = await GeminiService.verifyAddress(formData.address);
    setIsVerifyingAddress(false);
    setAddressVerificationMsg(result.details);
  };

  const validate = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.departmentCode || !formData.positionCode) {
      setFormStatus({ type: 'error', msg: 'Please fill in all required fields.' as any });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus({ type: 'error', msg: 'Invalid email format.' as any });
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
      setFormStatus({ type: 'success', msg: 'Employee saved successfully!' as any });
      setFormData(initialFormState);
      setAddressVerificationMsg('');
      setEmployees(StorageService.getEmployees(currentCompanyId));
      // Auto-dismiss success message
      setTimeout(() => setFormStatus({ type: '', msg: '' }), 3000);
    } else {
      setFormStatus({ type: 'error', msg: result.error as any });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-900">New Employee Entry</h2>
         <span className="text-sm text-slate-500">Total Employees: {employees.length}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Employee Details</h3>
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
             Auto-Sync to Google Sheets Enabled
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Section 1: Personal Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
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
            
            <div className="relative">
               <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
               <div className="flex gap-2">
                 <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Street address, City, Country"
                 />
                 <button 
                  type="button" 
                  onClick={verifyAddress}
                  disabled={!formData.address || isVerifyingAddress}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 border border-slate-200"
                  title="Verify with Google Maps"
                 >
                   {isVerifyingAddress ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                 </button>
               </div>
               {addressVerificationMsg && (
                 <p className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                   {addressVerificationMsg}
                 </p>
               )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Professional Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Employment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                <select
                  required
                  name="departmentCode"
                  value={formData.departmentCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                <select
                  required
                  name="positionCode"
                  value={formData.positionCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Position</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.code}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <select
                  name="locationCode"
                  value={formData.locationCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Location</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.code}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
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

          {/* Form Actions */}
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
               <button 
                type="button" 
                onClick={() => setFormData(initialFormState)}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
               >
                 Reset
               </button>
               <button 
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center shadow-md transition-colors"
               >
                 <Save className="w-4 h-4 mr-2" />
                 Save Employee
               </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
