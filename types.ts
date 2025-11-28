
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string; // Added ID for management
  email: string;
  name: string;
  role: UserRole;
  password?: string; // Optional for session user, required for stored user
  avatar?: string;
  companyId?: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'DEPARTMENT' | 'POSITION' | 'LOCATION' | 'ADMIN_UNIT' | 'COMPANY';
  parentId?: string | null; // For hierarchical data (Departments, Admin Units)
  appScriptUrl?: string;
  googleSheetUrl?: string;
}

export interface SystemSettings {
  googleSheetUrl: string;
  appScriptUrl: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  
  // New Address Fields
  addressDetail: string; // Số nhà, đường
  provinceCode: string;  // Mã Tỉnh/Thành
  districtCode: string;  // Mã Quận/Huyện (Optional nếu là cơ chế mới)
  wardCode: string;      // Mã Phường/Xã
  isNewAdminSystem: boolean; // True = 2 cấp, False = 3 cấp
  address?: string; // Computed full address for display/legacy

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
