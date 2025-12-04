
export enum UserRole {
  ADMIN = 'ADMIN', // Legacy
  STAFF = 'STAFF'
}    

export type PermissionKey = 
  // Dashboard
  | 'DASHBOARD'
  
  // Employee
  | 'EMPLOYEE_VIEW'
  | 'EMPLOYEE_CREATE'
  | 'EMPLOYEE_EDIT'
  | 'EMPLOYEE_DELETE'
  
  // Categories (General or Specific)
  | 'CATEGORY_VIEW'
  | 'CATEGORY_CREATE'
  | 'CATEGORY_EDIT'
  | 'CATEGORY_DELETE'
  
  // System
  | 'SYSTEM_SETTINGS'
  | 'SYSTEM_USERS_VIEW'
  | 'SYSTEM_USERS_MANAGE' // Create/Edit/Delete
  | 'SYSTEM_ROLES_VIEW'
  | 'SYSTEM_ROLES_MANAGE'; // Create/Edit/Delete

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions: PermissionKey[];
  isSystem?: boolean; 
}

export interface User {
  id: string; 
  email: string;
  name: string;
  role: UserRole; 
  roleId?: string; 
  password?: string;
  avatar?: string;
  companyId?: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'DEPARTMENT' | 'POSITION' | 'LOCATION' | 'ADMIN_UNIT' | 'COMPANY';
  parentId?: string | null; 
  level?: number; // New Field: Cấp bậc (1: Khối, 2: Phòng, 3: Đội/Nhóm...)
  status?: 'Active' | 'Dissolved'; // New Field: Trạng thái hoạt động
  appScriptUrl?: string;
  googleSheetUrl?: string;
}

export interface SystemSettings {
  googleSheetUrl: string;
  appScriptUrl: string;
  exportColumns?: string[]; // List of keys to export to Excel
}

export interface Employee {
  id: string;
  employeeCode: string; // Mã nhân viên
  identityCard?: string; // CCCD/CMND
  identityIssueDate?: string; // New Field: Ngày cấp
  identityPlace?: string; // New Field: Nơi cấp
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  addressDetail: string; 
  provinceCode: string;  
  districtCode: string;  
  wardCode: string;      
  isNewAdminSystem: boolean; 
  address?: string; 
  jobTitle?: string;
  departmentCode: string;
  positionCode: string;
  locationCode: string;
  startDate: string;
  status: 'Active' | 'OnLeave' | 'Terminated';
  notes?: string;
  companyId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}
