import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { Employee, Category, User } from '../types'; 
import { useLanguage } from '../contexts/LanguageContext';
import { Search, ArrowUpDown, Upload, UserPlus, Phone, Calendar, Building2, Briefcase, Edit2, Trash2, Download, FileDown, X, CheckCircle, AlertCircle } from 'lucide-react';

interface EmployeeListProps {
  currentCompanyId: string;
  onAddNew: () => void;
  onSelectEmployee: (id: string) => void;
  onEditEmployee: (id: string) => void;
  user: User; 
}

type SortKey = keyof Employee;

export const EmployeeList: React.FC<EmployeeListProps> = ({ currentCompanyId, onAddNew, onSelectEmployee, onEditEmployee, user }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Category[]>([]);
  const [positions, setPositions] = useState<Category[]>([]);
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const permissions = useMemo(() => {
      if (!user.roleId) return [];
      const role = StorageService.getRoleById(user.roleId);
      return role ? role.permissions : [];
  }, [user]);

  const canCreate = permissions.includes('EMPLOYEE_CREATE');
  const canEdit = permissions.includes('EMPLOYEE_EDIT');
  const canDelete = permissions.includes('EMPLOYEE_DELETE');

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [identityFilter, setIdentityFilter] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'startDate',
    direction: 'desc'
  });

  const [importResult, setImportResult] = useState<{success: number, errors: string[]} | null>(null);

  useEffect(() => {
    loadData();
  }, [currentCompanyId]);

  const loadData = () => {
    setEmployees(StorageService.getEmployees(currentCompanyId));
    setDepartments(StorageService.getCategories('DEPARTMENT'));
    setPositions(StorageService.getCategories('POSITION'));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); 
      if (window.confirm(t.common.confirmDelete)) {
          const result = StorageService.deleteEmployee(id);
          if (result.success) {
              loadData();
          } else {
              alert(result.error);
          }
      }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); 
      onEditEmployee(id);
  };

  const getDeptName = (code: string) => departments.find(d => d.code === code)?.name || code;
  const getPosName = (code: string) => positions.find(p => p.code === code)?.name || code;

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees.filter(emp => {
      const matchesSearch = 
        (emp.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = deptFilter ? emp.departmentCode === deptFilter : true;
      const matchesStatus = statusFilter ? emp.status === statusFilter : true;
      const matchesIdentity = identityFilter === 'has' 
          ? !!emp.identityCard 
          : identityFilter === 'missing' 
          ? !emp.identityCard 
          : true;

      return matchesSearch && matchesDept && matchesStatus && matchesIdentity;
    });

    result.sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';

      if (valA < valB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [employees, searchTerm, deptFilter, statusFilter, identityFilter, sortConfig]);

  const handleExport = () => {
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
          alert("Excel library not loaded.");
          return;
      }

      const settings = StorageService.getSettings();
      const columnsToExport = settings.exportColumns && settings.exportColumns.length > 0 
          ? settings.exportColumns 
          : ['employeeCode', 'lastName', 'firstName', 'email', 'departmentCode', 'positionCode', 'status', 'identityCard'];

      const dataToExport = filteredAndSortedEmployees.map(emp => {
          const row: any = {};
          columnsToExport.forEach(col => {
              if (col === 'departmentCode') row['Department'] = getDeptName(emp.departmentCode);
              else if (col === 'positionCode') row['Position'] = getPosName(emp.positionCode);
              else if (col === 'startDate') row['Start Date'] = emp.startDate;
              else if (col === 'employeeCode') row['Emp Code'] = emp.employeeCode;
              else if (col === 'identityCard') row['ID Card'] = emp.identityCard;
              else row[col] = (emp as any)[col];
          });
          return row;
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      XLSX.writeFile(wb, `Employee_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadTemplate = () => {
       const XLSX = (window as any).XLSX;
       if (!XLSX) return;

       // Define explicit headers - Updated order: Last Name then First Name
       const headers = [
           "Employee Code", "Identity Card", "Issue Date", "Place of Issue",
           "Last Name", "First Name", "Email", "Phone", "DOB", "Gender",
           "Department Code", "Position Code", "Job Title", "Location Code",
           "Start Date", "Status",
           "Address Detail", "Province Code", "District Code", "Ward Code"
       ];

       // Define example data
       const exampleData = [
           "EMP001", "001090000001", "2020-01-01", "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
           "Nguyen Van", "A", "a.nguyen@lcfoods.com", "0901234567", "1990-01-01", "Male",
           "IT", "DEV", "Senior Dev", "HO",
           "2023-01-01", "Active",
           "123 Street", "HN", "CG", "YENHOA"
       ];
       
       const ws = XLSX.utils.aoa_to_sheet([headers, exampleData]);
       const wb = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(wb, ws, "Template");
       XLSX.writeFile(wb, "Employee_Import_Template.xlsx");
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const XLSX = (window as any).XLSX;
      if (!XLSX) {
          alert("Excel library not loaded.");
          return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws, { defval: "" }); 

              processImport(data);
          } catch (error) {
              console.error(error);
              alert("Failed to read file.");
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };

  const processImport = (data: any[]) => {
      let successCount = 0;
      let errors: string[] = [];
      
      data.forEach((row, index) => {
           try {
               const employee: Employee = {
                   id: crypto.randomUUID(),
                   companyId: currentCompanyId,
                   employeeCode: row["Employee Code"] || StorageService.generateNextEmployeeCode(currentCompanyId),
                   identityCard: row["Identity Card"],
                   identityIssueDate: row["Issue Date"],
                   identityPlace: row["Place of Issue"],
                   lastName: row["Last Name"],
                   firstName: row["First Name"],
                   email: row["Email"],
                   phone: row["Phone"],
                   dob: row["DOB"],
                   gender: row["Gender"] || 'Male',
                   departmentCode: row["Department Code"],
                   positionCode: row["Position Code"],
                   jobTitle: row["Job Title"],
                   locationCode: row["Location Code"],
                   startDate: row["Start Date"],
                   status: row["Status"] || 'Active',
                   addressDetail: row["Address Detail"],
                   provinceCode: row["Province Code"],
                   districtCode: row["District Code"],
                   wardCode: row["Ward Code"],
                   isNewAdminSystem: false,
                   address: '' 
               };

               if (!employee.lastName || !employee.firstName || !employee.email) {
                   throw new Error(`Row ${index + 2}: Missing Name or Email`);
               }

               const result = StorageService.saveEmployee(employee);
               if (result.success) successCount++;
               else throw new Error(`Row ${index + 2}: ${result.error}`);

           } catch (e: any) {
               errors.push(e.message);
           }
      });

      setImportResult({ success: successCount, errors });
      loadData();
      
      setTimeout(() => setImportResult(null), 10000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.employeeList.title}</h2>
          <p className="text-sm text-slate-500">{t.employeeList.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={handleDownloadTemplate} className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
             <FileDown className="w-4 h-4 mr-2" />
             {t.common.downloadTemplate}
           </button>
           
           {canCreate && (
             <>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                />
                <button onClick={handleImportClick} className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    <Upload className="w-4 h-4 mr-2" />
                    {t.common.importExcel}
                </button>
             </>
           )}

           <button onClick={handleExport} className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
             <Download className="w-4 h-4 mr-2" />
             {t.common.exportExcel}
           </button>
           
           {canCreate && (
               <button onClick={onAddNew} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">
                 <UserPlus className="w-4 h-4 mr-2" />
                 {t.common.add}
               </button>
           )}
        </div>
      </div>
      
      {/* Import Result Feedback */}
      {importResult && (
          <div className={`p-4 rounded-lg border ${importResult.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex justify-between items-start">
                  <div>
                      <h4 className={`font-bold ${importResult.errors.length > 0 ? 'text-amber-800' : 'text-green-800'}`}>
                          {t.employeeList.importTitle}
                      </h4>
                      <p className="text-sm mt-1">
                          {t.employeeList.importSuccess.replace('{count}', importResult.success.toString())}
                      </p>
                      {importResult.errors.length > 0 && (
                          <div className="mt-2 max-h-32 overflow-y-auto text-xs text-red-600 bg-white p-2 rounded border border-red-100">
                              <p className="font-bold mb-1">Errors:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                  {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                              </ul>
                          </div>
                      )}
                  </div>
                  <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
              </div>
          </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative col-span-1 md:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.employeeList.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">{t.employeeList.allDepartments}</option>
          {departments.map(d => (
            <option key={d.id} value={d.code}>{d.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">{t.employeeList.allStatus}</option>
          <option value="Active">Active</option>
          <option value="OnLeave">On Leave</option>
          <option value="Terminated">Terminated</option>
        </select>
        <select
          value={identityFilter}
          onChange={(e) => setIdentityFilter(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">{t.employeeList.allIdentity}</option>
          <option value="has">{t.employeeList.hasIdentity}</option>
          <option value="missing">{t.employeeList.missingIdentity}</option>
        </select>
      </div>

      {/* Employee Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('employeeCode')}
                >
                  <div className="flex items-center">
                    {t.employeeList.cols.code}
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('lastName')}
                >
                   <div className="flex items-center">
                    {t.employeeList.cols.name}
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t.employeeList.cols.roleDept}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t.employeeList.cols.contact}
                </th>
                 <th 
                  className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('startDate')}
                >
                   <div className="flex items-center">
                    {t.employeeList.cols.startDate}
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.employeeList.cols.status}</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredAndSortedEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  onClick={() => onSelectEmployee(emp.id)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {emp.employeeCode || '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {emp.lastName.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-slate-900">{emp.lastName} {emp.firstName}</div>
                        {emp.identityCard ? (
                             <div className="flex items-center text-[10px] text-green-600 font-medium">
                                 <CheckCircle className="w-3 h-3 mr-0.5" /> ID: {emp.identityCard}
                             </div>
                        ) : (
                             <div className="flex items-center text-[10px] text-amber-500 font-medium">
                                 <AlertCircle className="w-3 h-3 mr-0.5" /> Missing ID
                             </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <div className="flex items-center text-sm font-semibold text-slate-800">
                            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            {getPosName(emp.positionCode)}
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            {getDeptName(emp.departmentCode)}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500 space-y-0.5">
                        <div className="flex items-center hover:text-blue-600 transition-colors">
                            <Phone className="w-3.5 h-3.5 mr-2 opacity-70" /> {emp.phone}
                        </div>
                        <div className="flex items-center hover:text-blue-600 transition-colors">
                             <div className="w-3.5 h-3.5 mr-2 opacity-70 flex items-center justify-center text-[10px] font-bold">@</div> 
                             {emp.email}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5 mr-2 opacity-70" />
                        {new Date(emp.startDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                      emp.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 
                      emp.status === 'OnLeave' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                            <button 
                                onClick={(e) => handleEdit(emp.id, e)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 transition-colors"
                                title={t.common.edit}
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        {canDelete && (
                            <button 
                                onClick={(e) => handleDelete(emp.id, e)}
                                className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                                title={t.common.delete}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedEmployees.length === 0 && (
          <div className="p-12 text-center text-slate-400">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Search className="w-8 h-8 opacity-20" />
             </div>
             <p className="text-lg font-medium text-slate-600">{t.employeeList.noResults}</p>
             <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
        
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs text-slate-500">
                {t.employeeList.showing} <span className="font-bold text-slate-700">{filteredAndSortedEmployees.length}</span> {t.employeeList.records}
            </span>
            <span className="text-xs text-slate-400">
                {t.employeeList.sortedBy} {sortConfig.key} ({sortConfig.direction})
            </span>
        </div>
      </div>
    </div>
  );
};