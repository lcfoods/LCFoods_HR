import React, { useMemo, useState, useEffect } from 'react';
import { Employee, Category } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Building2, 
  User, 
  FileText, 
  Building,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface EmployeeDetailProps {
  employeeId: string;
  onBack: () => void;
}

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employeeId, onBack }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; details: string; mapLink?: string } | null>(null);

  const employee = useMemo(() => {
    // Search across all companies/storage to find the ID
    const all = StorageService.getEmployees(); 
    return all.find(e => e.id === employeeId);
  }, [employeeId]);

  // Reset verification when switching employees
  useEffect(() => {
    setVerificationResult(null);
    setIsVerifying(false);
  }, [employeeId]);

  const categories = useMemo(() => StorageService.getCategories(), []);
  
  const getCategoryName = (code: string, type: Category['type']) => {
    const cat = categories.find(c => c.code === code && c.type === type);
    return cat ? cat.name : code;
  };

  const getCompanyName = (id?: string) => {
      if (!id) return 'Unknown Company';
      const comp = categories.find(c => c.id === id && c.type === 'COMPANY');
      return comp ? comp.name : 'Unknown Company';
  };

  const handleVerifyAddress = async () => {
    if (!employee?.address) return;
    setIsVerifying(true);
    try {
        const result = await GeminiService.verifyAddress(employee.address);
        setVerificationResult(result);
    } catch (e) {
        setVerificationResult({ isValid: false, details: "Verification failed due to an error." });
    } finally {
        setIsVerifying(false);
    }
  };

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <User className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">Employee not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          Go back to list
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-2 group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Directory
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <div className="absolute -bottom-10 left-8">
                <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg">
                    <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600">
                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                    </div>
                </div>
            </div>
        </div>
        <div className="pt-12 pb-6 px-8 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{employee.lastName} {employee.firstName}</h1>
                <div className="flex items-center gap-2 mt-2 text-slate-500">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium text-slate-700">{getCategoryName(employee.positionCode, 'POSITION')}</span>
                    <span className="mx-1">•</span>
                    <span className="text-slate-600">{getCategoryName(employee.departmentCode, 'DEPARTMENT')}</span>
                </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                 employee.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                 employee.status === 'OnLeave' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
                {employee.status}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Personal Info */}
          <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" /> Personal Details
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Email</label>
                          <div className="flex items-center text-sm font-medium text-slate-900 break-all">
                              <Mail className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                              <a href={`mailto:${employee.email}`} className="hover:text-blue-600">{employee.email}</a>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Phone</label>
                          <div className="flex items-center text-sm font-medium text-slate-900">
                              <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                              {employee.phone || 'N/A'}
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Date of Birth</label>
                          <div className="flex items-center text-sm font-medium text-slate-900">
                              <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                              {employee.dob ? new Date(employee.dob).toLocaleDateString() : 'N/A'}
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Gender</label>
                          <div className="text-sm font-medium text-slate-900 ml-5.5">
                              {employee.gender}
                          </div>
                      </div>
                      
                      {/* Address with Verification */}
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Address</label>
                          <div className="flex items-start text-sm font-medium text-slate-900">
                              <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                  <div>{employee.address || 'N/A'}</div>
                                  
                                  {employee.address && (
                                    <div className="mt-2">
                                        {!verificationResult ? (
                                            <button 
                                                onClick={handleVerifyAddress}
                                                disabled={isVerifying}
                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
                                            >
                                                {isVerifying ? (
                                                    <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Verifying...</>
                                                ) : (
                                                    <><CheckCircle className="w-3 h-3 mr-1.5" /> Verify Address</>
                                                )}
                                            </button>
                                        ) : (
                                            <div className={`p-2 rounded-lg border text-xs ${
                                                verificationResult.isValid 
                                                ? 'bg-green-50 border-green-200 text-green-800' 
                                                : 'bg-amber-50 border-amber-200 text-amber-800'
                                            }`}>
                                                <div className="flex items-center font-bold mb-1">
                                                    {verificationResult.isValid 
                                                        ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> 
                                                        : <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                                    }
                                                    {verificationResult.isValid ? 'Address Verified' : 'Needs Review'}
                                                </div>
                                                <p className="leading-snug opacity-90">{verificationResult.details}</p>
                                                {verificationResult.mapLink && (
                                                    <a 
                                                        href={verificationResult.mapLink} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="flex items-center mt-1.5 font-medium underline hover:no-underline"
                                                    >
                                                        View on Maps <ExternalLink className="w-3 h-3 ml-1" />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                  )}
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>

          {/* Right Column: Employment Info */}
          <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Employment Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div>
                          <label className="text-xs text-slate-500 block mb-1">Employee ID</label>
                          <div className="text-sm font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                              {employee.id.split('-')[0]}...
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Company</label>
                          <div className="flex items-center text-sm font-medium text-slate-900">
                               <Building className="w-4 h-4 mr-2 text-slate-400" />
                               {getCompanyName(employee.companyId)}
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Department</label>
                          <div className="text-sm font-medium text-slate-900">
                              {getCategoryName(employee.departmentCode, 'DEPARTMENT')}
                              <span className="text-xs text-slate-400 ml-1">({employee.departmentCode})</span>
                          </div>
                      </div>
                       <div>
                          <label className="text-xs text-slate-500 block mb-1">Position</label>
                          <div className="text-sm font-medium text-slate-900">
                              {getCategoryName(employee.positionCode, 'POSITION')}
                               <span className="text-xs text-slate-400 ml-1">({employee.positionCode})</span>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Location</label>
                          <div className="flex items-center text-sm font-medium text-slate-900">
                              <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                              {getCategoryName(employee.locationCode, 'LOCATION')}
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Start Date</label>
                          <div className="flex items-center text-sm font-medium text-slate-900">
                              <Clock className="w-4 h-4 mr-2 text-slate-400" />
                              {new Date(employee.startDate).toLocaleDateString()}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Notes & Remarks
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-800 leading-relaxed min-h-[100px]">
                      {employee.notes ? employee.notes : <span className="text-yellow-800/50 italic">No notes added for this employee.</span>}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};