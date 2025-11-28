import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Employee, Category } from '../types';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, UserPlus, Mail, Phone, Calendar, Building2, Briefcase } from 'lucide-react';

interface EmployeeListProps {
  currentCompanyId: string;
  onAddNew: () => void;
  onSelectEmployee: (id: string) => void;
}

type SortKey = keyof Employee;

export const EmployeeList: React.FC<EmployeeListProps> = ({ currentCompanyId, onAddNew, onSelectEmployee }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Category[]>([]);
  const [positions, setPositions] = useState<Category[]>([]);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'startDate',
    direction: 'desc'
  });

  useEffect(() => {
    loadData();
  }, [currentCompanyId]);

  const loadData = () => {
    setEmployees(StorageService.getEmployees(currentCompanyId));
    setDepartments(StorageService.getCategories('DEPARTMENT'));
    setPositions(StorageService.getCategories('POSITION'));
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
    // 1. Filter
    let result = employees.filter(emp => {
      const matchesSearch = 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = deptFilter ? emp.departmentCode === deptFilter : true;
      const matchesStatus = statusFilter ? emp.status === statusFilter : true;

      return matchesSearch && matchesDept && matchesStatus;
    });

    // 2. Sort
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [employees, searchTerm, deptFilter, statusFilter, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-400 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600 ml-1" /> 
      : <ArrowDown className="w-4 h-4 text-blue-600 ml-1" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employee Directory</h2>
          <p className="text-sm text-slate-500">View, search, and manage employee records.</p>
        </div>
        <button 
          onClick={onAddNew}
          className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add New Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
             <div className="relative w-full md:w-48">
                <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select 
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.code}>{d.name}</option>)}
                </select>
            </div>

            <div className="relative w-full md:w-40">
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="OnLeave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                </select>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('lastName')}>
                        <div className="flex items-center">Name <SortIcon columnKey="lastName" /></div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('departmentCode')}>
                         <div className="flex items-center">Role & Dept <SortIcon columnKey="departmentCode" /></div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                         Contact
                    </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('startDate')}>
                         <div className="flex items-center">Start Date <SortIcon columnKey="startDate" /></div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                         <div className="flex items-center">Status <SortIcon columnKey="status" /></div>
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {filteredAndSortedEmployees.length > 0 ? (
                    filteredAndSortedEmployees.map((emp) => (
                    <tr 
                        key={emp.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => onSelectEmployee(emp.id)}
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900">{emp.lastName} {emp.firstName}</div>
                                    <div className="text-xs text-slate-500">{emp.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-900 flex items-center gap-1">
                                    <Briefcase className="w-3 h-3 text-slate-400" />
                                    {getPosName(emp.positionCode)}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Building2 className="w-3 h-3 text-slate-400" />
                                    {getDeptName(emp.departmentCode)}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                                {emp.phone && (
                                    <div className="flex items-center text-xs text-slate-600">
                                        <Phone className="w-3 h-3 mr-1.5 text-slate-400" />
                                        {emp.phone}
                                    </div>
                                )}
                                <div className="flex items-center text-xs text-slate-600">
                                    <Mail className="w-3 h-3 mr-1.5 text-slate-400" />
                                    <span className="truncate max-w-[150px]">{emp.email}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-slate-600">
                                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                {new Date(emp.startDate).toLocaleDateString()}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                emp.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                emp.status === 'OnLeave' ? 'bg-amber-100 text-amber-800' : 
                                'bg-slate-100 text-slate-800'
                            }`}>
                                {emp.status}
                            </span>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No employees found matching your filters.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>Showing {filteredAndSortedEmployees.length} record(s)</span>
            {filteredAndSortedEmployees.length > 0 && <span>Sorted by {String(sortConfig.key)} ({sortConfig.direction})</span>}
        </div>
      </div>
    </div>
  );
};