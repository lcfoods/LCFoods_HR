
import { Employee, Category, ApiResponse, SystemSettings, User, UserRole } from '../types';

const EMPLOYEES_KEY = 'hrm_employees';
const CATEGORIES_KEY = 'hrm_categories';
const SETTINGS_KEY = 'hrm_settings';
const USERS_KEY = 'hrm_users';

// Initial Mock Data with Hierarchy (Translated to Vietnamese)
const INITIAL_CATEGORIES: Category[] = [
  // Companies
  { id: 'c1', code: 'LCF', name: 'Tập đoàn LCFoods', type: 'COMPANY', parentId: null },
  { id: 'c2', code: 'LCF_LOG', name: 'LCFoods Logistics', type: 'COMPANY', parentId: null },

  // Departments (Phòng ban)
  { id: '1', code: 'BOD', name: 'Ban Giám Đốc', type: 'DEPARTMENT', parentId: null },
  { id: '2', code: 'HR', name: 'Phòng Hành chính Nhân sự', type: 'DEPARTMENT', parentId: '1' },
  { id: '3', code: 'IT', name: 'Phòng Công nghệ thông tin', type: 'DEPARTMENT', parentId: '1' },
  { id: '4', code: 'ACC', name: 'Phòng Kế toán', type: 'DEPARTMENT', parentId: '1' },
  
  // Positions (Chức vụ)
  { id: '10', code: 'DIR', name: 'Giám đốc', type: 'POSITION' },
  { id: '11', code: 'MGR', name: 'Trưởng phòng', type: 'POSITION' },
  { id: '12', code: 'DEV', name: 'Lập trình viên cao cấp', type: 'POSITION' },
  { id: '13', code: 'ACC_STAFF', name: 'Kế toán viên', type: 'POSITION' },

  // Locations (Địa điểm)
  { id: '20', code: 'HO', name: 'Trụ sở chính (Hà Nội)', type: 'LOCATION' },
  { id: '21', code: 'HCM', name: 'Chi nhánh HCM', type: 'LOCATION' },

  // Administrative Units (Đơn vị hành chính)
  // Level 1: Tỉnh/Thành
  { id: '100', code: 'HN', name: 'Hà Nội', type: 'ADMIN_UNIT', parentId: null },
  { id: '101', code: 'DN', name: 'Đà Nẵng', type: 'ADMIN_UNIT', parentId: null },
  
  // Level 2: Quận/Huyện (Mô hình 3 cấp)
  { id: '200', code: 'CG', name: 'Q. Cầu Giấy', type: 'ADMIN_UNIT', parentId: '100' },
  { id: '202', code: 'TX', name: 'Q. Thanh Xuân', type: 'ADMIN_UNIT', parentId: '100' },
  
  // Level 3: Phường/Xã (Thuộc Quận - Mô hình 3 cấp)
  { id: '300', code: 'YENHOA', name: 'P. Yên Hòa', type: 'ADMIN_UNIT', parentId: '200' },
  { id: '301', code: 'MAIDICH', name: 'P. Mai Dịch', type: 'ADMIN_UNIT', parentId: '200' },

  // Level 2: Phường/Xã (Trực thuộc Tỉnh/Thành - Mô hình 2 cấp - Hành chính mới)
  { id: '201', code: 'HC', name: 'P. Hòa Cường (Trực thuộc TP)', type: 'ADMIN_UNIT', parentId: '101' },
  { id: '203', code: 'KH', name: 'P. Khuê Mỹ (Trực thuộc TP)', type: 'ADMIN_UNIT', parentId: '101' },
];

const INITIAL_SETTINGS: SystemSettings = {
  googleSheetUrl: '',
  appScriptUrl: ''
};

// Initial Admin User
const INITIAL_USERS: User[] = [
    {
        id: 'admin-001',
        name: 'Quản trị viên',
        email: 'admin@lcfoods.com', 
        password: 'password', 
        role: UserRole.ADMIN,
        companyId: 'c1' 
    },
    {
        id: 'staff-001',
        name: 'Nhân viên HR',
        email: 'staff@lcfoods.com', 
        password: 'password',
        role: UserRole.STAFF,
        companyId: 'c1'
    }
];

// Helper to send data to Google Apps Script
const syncToGoogleSheet = async (recordType: 'EMPLOYEE' | 'CATEGORY', operation: 'SAVE' | 'DELETE', data: any, companyId?: string) => {
    try {
        const settings = StorageService.getSettings();
        const categories = StorageService.getCategories();
        
        // Determine Target URL
        let targetUrl = '';
        let targetName = 'Global Settings';

        // 1. Try Company Specific URL (Only for Employees belonging to a company)
        if (recordType === 'EMPLOYEE' && companyId) {
             const company = categories.find(c => c.id === companyId && c.type === 'COMPANY');
             if (company && company.appScriptUrl) {
                 targetUrl = company.appScriptUrl;
                 targetName = `Company (${company.name})`;
             }
        }
        
        // 2. Fallback to Global URL
        if (!targetUrl && settings.appScriptUrl) {
            targetUrl = settings.appScriptUrl;
        }

        if (!targetUrl) {
            return;
        }

        // Prepare Payload
        const payload = {
            recordType: recordType,
            operation: operation,
            data: data
        };

        console.log(`SYNCING [${operation} ${recordType}] TO [${targetName}]:`, payload);

        // Send Request
        // IMPORTANT: We use 'text/plain' to avoid CORS Preflight (OPTIONS) requests which GAS doesn't handle well.
        await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' }, 
            body: JSON.stringify(payload)
        });
        
        console.log("Sync request sent successfully.");

    } catch (e) {
        console.error("Sync failed:", e);
    }
};

export const StorageService = {
  // --- Settings Methods ---
  getSettings: (): SystemSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : INITIAL_SETTINGS;
  },

  saveSettings: (settings: SystemSettings): ApiResponse<SystemSettings> => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return { success: true, data: settings };
    } catch (e) {
      return { success: false, error: 'Lưu cấu hình thất bại.' };
    }
  },

  // --- Category Methods ---
  getCategories: (type?: Category['type']): Category[] => {
    const data = localStorage.getItem(CATEGORIES_KEY);
    let categories: Category[] = data ? JSON.parse(data) : [...INITIAL_CATEGORIES];
    
    // Auto-Fix: Ensure companies exist if data is old
    if (type === 'COMPANY' || !type) {
         const hasCompanies = categories.some(c => c.type === 'COMPANY');
         if (!hasCompanies) {
             const defaultCompanies = INITIAL_CATEGORIES.filter(c => c.type === 'COMPANY');
             categories = [...categories, ...defaultCompanies];
             localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
         }
    }

    if (type) {
      categories = categories.filter(c => c.type === type);
    }
    return categories;
  },

  saveCategory: (category: Category): ApiResponse<Category> => {
    try {
      const categories = StorageService.getCategories(); 
      if (categories.some(c => c.code === category.code && c.type === category.type && c.id !== category.id)) {
        return { success: false, error: `Mã ${category.code} đã tồn tại trong danh mục này.` };
      }
      
      if (category.parentId && category.parentId === category.id) {
         return { success: false, error: `Danh mục không thể là cha của chính nó.` };
      }

      const existingIndex = categories.findIndex(c => c.id === category.id);
      if (existingIndex >= 0) {
        categories[existingIndex] = category;
      } else {
        categories.push(category);
      }
      
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));

      // SYNC CATEGORY TO GOOGLE SHEET
      syncToGoogleSheet('CATEGORY', 'SAVE', category);

      return { success: true, data: category };
    } catch (e) {
      return { success: false, error: 'Lưu danh mục thất bại.' };
    }
  },

  deleteCategory: (id: string) => {
    let categories = StorageService.getCategories();
    
    const categoryToDelete = categories.find(c => c.id === id);

    const deleteRecursive = (parentId: string) => {
      const children = categories.filter(c => c.parentId === parentId);
      children.forEach(child => deleteRecursive(child.id));
      categories = categories.filter(c => c.id !== parentId);
    };
    
    deleteRecursive(id);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));

    if (categoryToDelete) {
        syncToGoogleSheet('CATEGORY', 'DELETE', { id: categoryToDelete.id, type: categoryToDelete.type });
    }
  },

  // --- Employee Methods ---
  getEmployees: (companyId?: string): Employee[] => {
    const data = localStorage.getItem(EMPLOYEES_KEY);
    let employees: Employee[] = data ? JSON.parse(data) : [];
    if (companyId) {
      employees = employees.filter(e => e.companyId === companyId);
    }
    return employees;
  },

  getEmployeeById: (id: string): Employee | undefined => {
    const data = localStorage.getItem(EMPLOYEES_KEY);
    const employees: Employee[] = data ? JSON.parse(data) : [];
    return employees.find(e => e.id === id);
  },

  saveEmployee: (employee: Employee): ApiResponse<Employee> => {
    try {
      const employees = StorageService.getEmployees(); // Get all
      if (employees.some(e => e.email === employee.email && e.id !== employee.id)) {
        return { success: false, error: 'Email đã tồn tại trong hệ thống.' };
      }

      // --- COMPUTE FULL ADDRESS STRING FOR LEGACY/DISPLAY ---
      const categories = StorageService.getCategories('ADMIN_UNIT');
      const provName = categories.find(c => c.code === employee.provinceCode)?.name || '';
      const distName = categories.find(c => c.code === employee.districtCode)?.name || '';
      const wardName = categories.find(c => c.code === employee.wardCode)?.name || '';
      
      let fullAddress = employee.addressDetail || '';
      if (wardName) fullAddress += `, ${wardName}`;
      if (distName) fullAddress += `, ${distName}`;
      if (provName) fullAddress += `, ${provName}`;
      
      // Update the address display string
      employee.address = fullAddress;
      // ----------------------------------------------------

      const existingIndex = employees.findIndex(e => e.id === employee.id);
      if (existingIndex >= 0) {
        employees[existingIndex] = employee;
      } else {
        employees.push(employee);
      }

      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
      
      // SYNC EMPLOYEE TO GOOGLE SHEET
      syncToGoogleSheet('EMPLOYEE', 'SAVE', employee, employee.companyId);
      
      return { success: true, data: employee };
    } catch (e) {
      return { success: false, error: 'Lưu hồ sơ thất bại.' };
    }
  },

  deleteEmployee: (id: string): ApiResponse<void> => {
      try {
          const employees = StorageService.getEmployees();
          const empToDelete = employees.find(e => e.id === id);
          
          if (!empToDelete) {
              return { success: false, error: 'Không tìm thấy nhân viên.' };
          }

          const newEmployees = employees.filter(e => e.id !== id);
          localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(newEmployees));

          // SYNC DELETE
          syncToGoogleSheet('EMPLOYEE', 'DELETE', { id: empToDelete.id }, empToDelete.companyId);

          return { success: true };
      } catch (e) {
          return { success: false, error: 'Xóa nhân viên thất bại.' };
      }
  },

  // --- User Methods ---
  getUsers: (): User[] => {
      const data = localStorage.getItem(USERS_KEY);
      let users: User[] = data ? JSON.parse(data) : [...INITIAL_USERS];

      // Migration Logic
      const oldAdminIndex = users.findIndex(u => u.email === 'admin@company.com');
      const newAdminExists = users.some(u => u.email === 'admin@lcfoods.com');
      let changed = false;

      if (oldAdminIndex >= 0 && !newAdminExists) {
          users[oldAdminIndex].email = 'admin@lcfoods.com';
          users[oldAdminIndex].companyId = 'c1'; 
          changed = true;
      } else if (!newAdminExists) {
          users.push(INITIAL_USERS[0]);
          changed = true;
      }
      
      const oldStaffIndex = users.findIndex(u => u.email === 'staff@company.com');
      const newStaffExists = users.some(u => u.email === 'staff@lcfoods.com');
      
      if (oldStaffIndex >= 0 && !newStaffExists) {
          users[oldStaffIndex].email = 'staff@lcfoods.com';
          users[oldStaffIndex].companyId = 'c1';
          changed = true;
      }

      if (changed) {
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      return users;
  },

  saveUser: (user: User): ApiResponse<User> => {
      try {
          const users = StorageService.getUsers();
          if (users.some(u => u.email === user.email && u.id !== user.id)) {
              return { success: false, error: 'Email đã tồn tại.' };
          }
          const existingIndex = users.findIndex(u => u.id === user.id);
          if (existingIndex >= 0) {
              if (!user.password) {
                  user.password = users[existingIndex].password;
              }
              users[existingIndex] = user;
          } else {
              if (!user.password) return { success: false, error: 'Mật khẩu là bắt buộc.'};
              users.push(user);
          }
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          return { success: true, data: user };
      } catch (e) {
          return { success: false, error: 'Lưu người dùng thất bại.' };
      }
  },

  deleteUser: (id: string): ApiResponse<void> => {
      const users = StorageService.getUsers();
      if (users.length <= 1) return { success: false, error: 'Không thể xóa người dùng cuối cùng.' };
      
      const newUsers = users.filter(u => u.id !== id);
      localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
      return { success: true };
  },

  authenticate: (email: string, password: string): User | null => {
      const users = StorageService.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
          const { password, ...safeUser } = user;
          return safeUser as User;
      }
      return null;
  },

  // --- Utility ---
  downloadTemplate: (type: Category['type']) => {
    const headers = ['Code', 'Name', 'Description', 'ParentCode'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\nCODE01,Example Name,Description here,PARENT_CODE_IF_ANY";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type.toLowerCase()}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
