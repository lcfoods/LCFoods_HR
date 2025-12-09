
import { Employee, Category, ApiResponse, SystemSettings, User, UserRole, Role, PermissionKey, Course, CourseProgress, Section, Lesson } from '../types';

const EMPLOYEES_KEY = 'hrm_employees';
const CATEGORIES_KEY = 'hrm_categories';
const SETTINGS_KEY = 'hrm_settings';
const USERS_KEY = 'hrm_users';
const ROLES_KEY = 'hrm_roles';
const COURSES_KEY = 'hrm_courses_v2'; // Changed key to avoid conflict with old format
const COURSE_PROGRESS_KEY = 'hrm_progress_v2';

// --- Helper: Robust UUID Generator ---
const generateUUID = (): string => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- Seed Data for Gitiho Style ---
const SEED_COURSES: Course[] = [
    {
        id: 'course_excel_01',
        title: 'Tuyệt đỉnh Excel - Trở thành bậc thầy báo cáo',
        description: 'Khóa học giúp bạn làm chủ Excel từ cơ bản đến nâng cao. Thành thạo các hàm VLOOKUP, SUMIFS, Pivot Table và vẽ biểu đồ báo cáo chuyên nghiệp.',
        instructor: 'Nguyễn Thành Bằng (MOS Master)',
        level: 'Intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1543286386-713df548e9cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        companyId: 'c1',
        createdAt: new Date().toISOString(),
        totalDurationMinutes: 155, // Updated duration (145 + 10)
        sections: [
            {
                id: 'sec_1',
                title: 'Phần 1: Làm quen với giao diện và thao tác cơ bản',
                lessons: [
                    { id: 'l_1_1', title: 'Giới thiệu khóa học', type: 'VIDEO', durationMinutes: 5, contentUrl: 'https://www.youtube.com/embed/RdTozKPY_4Q' },
                    { id: 'l_1_2', title: 'Các phím tắt "thần thánh" trong Excel', type: 'VIDEO', durationMinutes: 10, contentUrl: 'https://www.youtube.com/embed/example' }
                ]
            },
            {
                id: 'sec_2',
                title: 'Phần 2: Các hàm xử lý dữ liệu',
                lessons: [
                    { id: 'l_2_1', title: 'Hàm điều kiện IF và IF lồng nhau', type: 'VIDEO', durationMinutes: 15, contentUrl: 'https://www.youtube.com/embed/example' },
                    { id: 'l_2_2', title: 'Tra cứu dữ liệu với VLOOKUP', type: 'VIDEO', durationMinutes: 20, contentUrl: 'https://www.youtube.com/embed/example' },
                    { id: 'l_2_3', title: 'Xử lý dữ liệu với Pivot Table', type: 'VIDEO', durationMinutes: 25, contentUrl: 'https://www.youtube.com/embed/example_pivot' },
                    { 
                        id: 'l_2_quiz', 
                        title: 'Bài kiểm tra trắc nghiệm phần Hàm', 
                        type: 'QUIZ', 
                        durationMinutes: 10,
                        questions: [
                            { id: 'q1', text: 'Hàm VLOOKUP dùng để làm gì?', options: ['Tính tổng', 'Tìm kiếm theo cột', 'Đếm số lượng', 'Vẽ biểu đồ'], correctIndex: 1 },
                            { id: 'q2', text: 'Tham số cuối cùng của VLOOKUP (Range_lookup) thường là số mấy để tìm chính xác?', options: ['1', '0', '-1', '2'], correctIndex: 1 }
                        ]
                    },
                    {
                        id: 'l_2_quiz_en',
                        title: 'Quiz on VLOOKUP and IF functions',
                        type: 'QUIZ',
                        durationMinutes: 10,
                        questions: [
                            { id: 'q_en_1', text: 'What is the primary use of VLOOKUP?', options: ['Data Sorting', 'Data Lookup', 'Data Aggregation', 'Data Visualization'], correctIndex: 1 },
                            { id: 'q_en_2', text: 'Which function is used for conditional logic?', options: ['SUM', 'AVERAGE', 'IF', 'VLOOKUP'], correctIndex: 2 }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'course_comm_01',
        title: 'Kỹ năng giao tiếp và ứng xử nơi công sở',
        description: 'Nghệ thuật giao tiếp khéo léo, xử lý xung đột và xây dựng mối quan hệ tốt đẹp với đồng nghiệp và cấp trên.',
        instructor: 'TS. Lê Thẩm Dương',
        level: 'Beginner',
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        companyId: 'c1',
        createdAt: new Date().toISOString(),
        totalDurationMinutes: 90,
        sections: [
             {
                id: 'sec_comm_1',
                title: 'Chương 1: Tư duy trong giao tiếp',
                lessons: [
                    { id: 'l_c_1', title: 'Tại sao bạn giao tiếp thất bại?', type: 'VIDEO', durationMinutes: 12, contentUrl: 'https://www.youtube.com/embed/example' }
                ]
             }
        ]
    }
];

const INITIAL_ROLES: Role[] = [
    {
        id: 'role_admin',
        code: 'ADMIN',
        name: 'Quản trị viên hệ thống',
        permissions: ['DASHBOARD', 'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_EDIT', 'EMPLOYEE_DELETE', 'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_EDIT', 'CATEGORY_DELETE', 'SYSTEM_SETTINGS', 'SYSTEM_USERS_VIEW', 'SYSTEM_USERS_MANAGE', 'SYSTEM_ROLES_VIEW', 'SYSTEM_ROLES_MANAGE', 'TRAINING_VIEW', 'TRAINING_MANAGE'],
        isSystem: true
    },
    {
        id: 'role_staff',
        code: 'STAFF',
        name: 'Nhân viên',
        permissions: ['DASHBOARD', 'EMPLOYEE_VIEW', 'CATEGORY_VIEW', 'TRAINING_VIEW'],
        isSystem: true
    }
];

// ... (Existing Categories, Users, Settings - Keeping minimal for brevity as they haven't changed much) ...
// Restoring critical constants for full file integrity
const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', code: 'LCF', name: 'Tập đoàn LCFoods', type: 'COMPANY' },
  { id: '1', code: 'HR', name: 'Phòng Nhân sự', type: 'DEPARTMENT' }
];
const INITIAL_SETTINGS: SystemSettings = { googleSheetUrl: '', appScriptUrl: '' };
const INITIAL_USERS: User[] = [
    { id: 'admin-001', username: 'admin', email: 'admin@lcfoods.com', name: 'Admin', role: UserRole.ADMIN, roleId: 'role_admin', password: 'password', companyId: 'c1' },
    { id: 'staff-001', username: 'staff', email: 'staff@lcfoods.com', name: 'Staff', role: UserRole.STAFF, roleId: 'role_staff', password: 'password', companyId: 'c1' }
];

export const StorageService = {
  // ... (Previous methods: getRoles, saveRole, deleteRole, getSettings, saveSettings, getCategories, saveCategory, deleteCategory, getEmployees, etc.) ...
  // RE-IMPLEMENTING CRITICAL METHODS TO ENSURE NO DATA LOSS
  
  getRoles: (): Role[] => {
      const data = localStorage.getItem(ROLES_KEY);
      return data ? JSON.parse(data) : INITIAL_ROLES;
  },
  getRoleById: (id: string) => StorageService.getRoles().find(r => r.id === id),
  saveRole: (role: Role): ApiResponse<Role> => {
      try {
        const roles = StorageService.getRoles();
        const idx = roles.findIndex(r => r.id === role.id);
        if (idx >= 0) roles[idx] = role; else roles.push(role);
        localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
        return { success: true, data: role };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },
  deleteRole: (id: string): ApiResponse<void> => {
      try {
        const roles = StorageService.getRoles().filter(r => r.id !== id);
        localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },
  
  getSettings: () => {
       const data = localStorage.getItem(SETTINGS_KEY);
       return data ? JSON.parse(data) : INITIAL_SETTINGS;
  },
  saveSettings: (s: SystemSettings): ApiResponse<SystemSettings> => {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
        return { success: true, data: s };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },

  getCategories: (type?: Category['type']) => {
      const data = localStorage.getItem(CATEGORIES_KEY);
      let cats: Category[] = data ? JSON.parse(data) : INITIAL_CATEGORIES;
      if (type) cats = cats.filter(c => c.type === type);
      return cats;
  },
  saveCategory: (c: Category): ApiResponse<Category> => {
      try {
        const cats = StorageService.getCategories();
        const idx = cats.findIndex(x => x.id === c.id);
        if (idx >= 0) cats[idx] = c; else cats.push(c);
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
        return { success: true, data: c };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },
  deleteCategory: (id: string): ApiResponse<void> => {
      try {
        const cats = StorageService.getCategories().filter(c => c.id !== id);
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },

  getEmployees: (companyId?: string) => {
      const data = localStorage.getItem(EMPLOYEES_KEY);
      let emps: Employee[] = data ? JSON.parse(data) : [];
      if (companyId) emps = emps.filter(e => e.companyId === companyId);
      return emps;
  },
  getEmployeeById: (id: string) => StorageService.getEmployees().find(e => e.id === id),
  saveEmployee: (e: Employee): ApiResponse<Employee> => {
      try {
        const emps = StorageService.getEmployees();
        const idx = emps.findIndex(x => x.id === e.id);
        if (idx >= 0) emps[idx] = e; else emps.push(e);
        localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(emps));
        return { success: true, data: e };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },
  deleteEmployee: (id: string): ApiResponse<void> => {
      try {
        const emps = StorageService.getEmployees().filter(e => e.id !== id);
        localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(emps));
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },
  generateNextEmployeeCode: (companyId?: string) => {
      return `EMP${Math.floor(Math.random() * 10000)}`;
  },

  getUsers: () => {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : INITIAL_USERS;
  },
  saveUser: (u: User): ApiResponse<User> => {
      try {
        const users = StorageService.getUsers();
        const idx = users.findIndex(x => x.id === u.id);
        if (idx >= 0) users[idx] = u; else users.push(u);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return { success: true, data: u };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },
  deleteUser: (id: string): ApiResponse<void> => {
      try {
        const users = StorageService.getUsers().filter(u => u.id !== id);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
  },
  authenticate: (identifier: string, pass: string) => {
      const users = StorageService.getUsers();
      return users.find(u => (u.email === identifier || u.username === identifier) && u.password === pass) || null;
  },
  resetSystem: () => {
      localStorage.clear();
      window.location.reload();
  },
  exportCategoriesToExcel: (categories: Category[], type: Category['type']) => { 
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        alert("Excel library not available. Please ensure XLSX is loaded.");
        return;
      }
      
      const ws = XLSX.utils.json_to_sheet(categories);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Categories");
      XLSX.writeFile(wb, `Categories_${type}.xlsx`);
  },

  // --- UPDATED TRAINING MODULE METHODS (Gitiho Model) ---
  getCourses: (companyId?: string): Course[] => {
      const data = localStorage.getItem(COURSES_KEY);
      let courses: Course[] = data ? JSON.parse(data) : [];
      
      // Seed data if empty
      if (courses.length === 0) {
          courses = SEED_COURSES;
          localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
      }

      if (companyId) {
          courses = courses.filter(c => !c.companyId || c.companyId === companyId);
      }
      return courses;
  },

  getCourseById: (id: string): Course | undefined => {
      const courses = StorageService.getCourses();
      return courses.find(c => c.id === id);
  },

  saveCourse: (course: Course): ApiResponse<Course> => {
      try {
          let courses = StorageService.getCourses();
          const existingIndex = courses.findIndex(c => c.id === course.id);
          if (existingIndex >= 0) {
              courses[existingIndex] = course;
          } else {
              courses.push(course);
          }
          localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
          return { success: true, data: course };
      } catch (e) {
          return { success: false, error: 'Failed to save course.' };
      }
  },

  deleteCourse: (id: string): ApiResponse<void> => {
      let courses = StorageService.getCourses();
      courses = courses.filter(c => c.id !== id);
      localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
      return { success: true };
  },

  // Enhanced Progress Tracking
  getProgress: (userId: string, courseId: string): CourseProgress | undefined => {
      const data = localStorage.getItem(COURSE_PROGRESS_KEY);
      const progressList: CourseProgress[] = data ? JSON.parse(data) : [];
      return progressList.find(p => p.userId === userId && p.courseId === courseId);
  },

  // Update progress for a specific lesson
  updateLessonProgress: (userId: string, courseId: string, lessonId: string, score?: number): void => {
      const data = localStorage.getItem(COURSE_PROGRESS_KEY);
      let progressList: CourseProgress[] = data ? JSON.parse(data) : [];
      
      let progress = progressList.find(p => p.userId === userId && p.courseId === courseId);
      
      if (!progress) {
          progress = {
              userId,
              courseId,
              status: 'In Progress',
              completedLessonIds: [],
              quizScores: {},
              lastAccessedLessonId: lessonId
          };
          progressList.push(progress);
      }

      // Update Last Accessed
      progress.lastAccessedLessonId = lessonId;
      
      // Mark as completed if not already
      if (!progress.completedLessonIds.includes(lessonId)) {
          progress.completedLessonIds.push(lessonId);
      }

      // Update Score if Quiz
      if (score !== undefined) {
          progress.quizScores[lessonId] = score;
      }

      // Check Course Completion
      const course = StorageService.getCourseById(courseId);
      if (course) {
          const totalLessons = course.sections.reduce((acc, sec) => acc + sec.lessons.length, 0);
          if (progress.completedLessonIds.length >= totalLessons) {
              progress.status = 'Completed';
              progress.completedAt = new Date().toISOString();
          }
      }

      localStorage.setItem(COURSE_PROGRESS_KEY, JSON.stringify(progressList));
  },
  
  enrollUser: (userId: string, courseId: string) => {
      // Just initialize empty progress
       const data = localStorage.getItem(COURSE_PROGRESS_KEY);
       let progressList: CourseProgress[] = data ? JSON.parse(data) : [];
       if (!progressList.find(p => p.userId === userId && p.courseId === courseId)) {
           progressList.push({
               userId,
               courseId,
               status: 'In Progress',
               completedLessonIds: [],
               quizScores: {},
               lastAccessedLessonId: ''
           });
           localStorage.setItem(COURSE_PROGRESS_KEY, JSON.stringify(progressList));
       }
  }
};
