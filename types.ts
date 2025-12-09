
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
  | 'SYSTEM_ROLES_MANAGE'
  
  // Training
  | 'TRAINING_VIEW'
  | 'TRAINING_MANAGE';

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
  username?: string; // New: Allow login by username
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

// --- Training Interfaces (Gitiho Style) ---

export interface Question {
  id: string;
  text: string;
  options: string[]; // List of answers
  correctIndex: number; // Index of the correct answer (0-3)
}

export interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'QUIZ' | 'READING';
  contentUrl?: string; // YouTube Embed or MP4
  textContent?: string; // For READING type
  durationMinutes: number;
  questions?: Question[]; // For QUIZ type
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  instructor?: string; // New: Instructor Name
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  sections: Section[]; // Hierarchical content
  totalDurationMinutes: number;
  companyId?: string; 
  createdAt: string;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  completedLessonIds: string[]; // Track individual lessons
  lastAccessedLessonId?: string; // Resume where left off
  quizScores: Record<string, number>; // lessonId -> score
  completedAt?: string;
}
