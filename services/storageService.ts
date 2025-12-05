import { Employee, Category, ApiResponse, SystemSettings, User, UserRole, Role, PermissionKey } from '../types';

const EMPLOYEES_KEY = 'hrm_employees';
const CATEGORIES_KEY = 'hrm_categories';
const SETTINGS_KEY = 'hrm_settings';
const USERS_KEY = 'hrm_users';
const ROLES_KEY = 'hrm_roles';

// --- Helper: Robust UUID Generator ---
const generateUUID = (): string => {
    // Explicitly check window.crypto to use the polyfill from index.html if needed
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    // Fallback for environments where window is undefined or crypto is missing
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- Initial Roles Data (UPDATED: Ensure Staff has Category permissions) ---
const INITIAL_ROLES: Role[] = [
    {
        id: 'role_admin',
        code: 'ADMIN',
        name: 'Quản trị viên hệ thống',
        description: 'Toàn quyền truy cập hệ thống',
        isSystem: true,
        permissions: [
            'DASHBOARD', 
            'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_EDIT', 'EMPLOYEE_DELETE',
            'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_EDIT', 'CATEGORY_DELETE',
            'SYSTEM_SETTINGS', 
            'SYSTEM_USERS_VIEW', 'SYSTEM_USERS_MANAGE',
            'SYSTEM_ROLES_VIEW', 'SYSTEM_ROLES_MANAGE'
        ]
    },
    {
        id: 'role_staff',
        code: 'STAFF',
        name: 'Nhân viên nhập liệu',
        description: 'Được xem, thêm mới và sửa dữ liệu. Không được xóa.',
        isSystem: true,
        permissions: [
            'DASHBOARD', 
            'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_EDIT', 
            // Staff can VIEW, CREATE, EDIT categories but NOT DELETE
            'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_EDIT'
        ]
    }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', code: 'LCF', name: 'Tập đoàn LCFoods', type: 'COMPANY', parentId: null },
  { id: 'c2', code: 'LCF_LOG', name: 'LCFoods Logistics', type: 'COMPANY', parentId: null },
  { id: '1', code: 'BOD', name: 'Ban Giám Đốc', type: 'DEPARTMENT', parentId: null, level: 1 },
  { id: '2', code: 'HR', name: 'Phòng Hành chính Nhân sự', type: 'DEPARTMENT', parentId: '1', level: 2 },
  { id: '3', code: 'IT', name: 'Phòng Công nghệ thông tin', type: 'DEPARTMENT', parentId: '1', level: 2 },
  { id: '4', code: 'ACC', name: 'Phòng Kế toán', type: 'DEPARTMENT', parentId: '1', level: 2 },
  { id: '10', code: 'DIR', name: 'Giám đốc', type: 'POSITION' },
  { id: '11', code: 'MGR', name: 'Trưởng phòng', type: 'POSITION' },
  { id: '12', code: 'DEV', name: 'Lập trình viên cao cấp', type: 'POSITION' },
  { id: '13', code: 'ACC_STAFF', name: 'Kế toán viên', type: 'POSITION' },
  { id: '20', code: 'HO', name: 'Trụ sở chính (Hà Nội)', type: 'LOCATION' },
  { id: '21', code: 'HCM', name: 'Chi nhánh HCM', type: 'LOCATION' },
  { id: '100', code: 'HN', name: 'Hà Nội', type: 'ADMIN_UNIT', parentId: null },
  { id: '101', code: 'DN', name: 'Đà Nẵng', type: 'ADMIN_UNIT', parentId: null },
  { id: '200', code: 'CG', name: 'Q. Cầu Giấy', type: 'ADMIN_UNIT', parentId: '100' },
  { id: '300', code: 'YENHOA', name: 'P. Yên Hòa', type: 'ADMIN_UNIT', parentId: '200' },
  { id: '201', code: 'HC', name: 'P. Hòa Cường (Trực thuộc TP)', type: 'ADMIN_UNIT', parentId: '101' },
  // Level 0 Example
  { id: 'L0_CORP', code: 'CORP', name: 'Tập đoàn (Level 0)', type: 'DEPARTMENT', parentId: null, level: 0 },
];

const INITIAL_SETTINGS: SystemSettings = {
  googleSheetUrl: '',
  appScriptUrl: '',
  exportColumns: ['employeeCode', 'id', 'lastName', 'firstName', 'email', 'phone', 'departmentCode', 'positionCode', 'startDate', 'status']
};

const INITIAL_USERS: User[] = [
    {
        id: 'admin-001',
        name: 'Quản trị viên',
        email: 'admin@lcfoods.com', 
        password: 'password', 
        role: UserRole.ADMIN, 
        roleId: 'role_admin', 
        companyId: 'c1' 
    },
    {
        id: 'staff-001',
        name: 'Nhân viên HR',
        email: 'staff@lcfoods.com', 
        password: 'password',
        role: UserRole.STAFF,
        roleId: 'role_staff',
        companyId: 'c1'
    }
];

const syncToGoogleSheet = async (recordType: 'EMPLOYEE' | 'CATEGORY', operation: 'SAVE' | 'DELETE', data: any, companyId?: string) => {
    try {
        const settings = StorageService.getSettings();
        const categories = StorageService.getCategories();
        
        let companySpecificUrl = '';
        let companyName = '';

        // 1. Identify Company Specific Details
        if (recordType === 'EMPLOYEE' && companyId) {
             const company = categories.find(c => c.id === companyId && c.type === 'COMPANY');
             if (company) {
                 companyName = company.name;
                 // Get specific URL if exists
                 if (company.appScriptUrl) {
                     companySpecificUrl = company.appScriptUrl;
                 }
             }
        } else if (recordType === 'CATEGORY' && data.type === 'COMPANY') {
            // If saving a Company Category itself, use its name
            companyName = data.name;
        }

        const globalUrl = settings.appScriptUrl;
        const requests = [];

        // 2. Request A: Sync to Company Specific Sheet (If configured)
        // This preserves the original data structure for the specific sheet
        if (companySpecificUrl) {
            console.log(`SYNCING [${operation} ${recordType}] TO [Company Sheet: ${companyName}]`);
            const companyPayload = {
                recordType: recordType,
                operation: operation,
                data: data
            };
            requests.push(
                fetch(companySpecificUrl, {
                    method: 'POST',
                    mode: 'no-cors', 
                    headers: { 'Content-Type': 'text/plain' }, 
                    body: JSON.stringify(companyPayload)
                })
            );
        }

        // 3. Request B: Sync to Global Master Sheet (ALWAYS)
        // Inject 'sourceCompany' so the Master Sheet knows where data came from
        if (globalUrl) {
            console.log(`SYNCING [${operation} ${recordType}] TO [Global Master Sheet]`);
            
            // Clone data and add sourceCompany field
            const globalData = { 
                ...data, 
                sourceCompany: companyName || 'System/Global' 
            };

            const globalPayload = {
                recordType: recordType,
                operation: operation,
                data: globalData
            };

            requests.push(
                fetch(globalUrl, {
                    method: 'POST',
                    mode: 'no-cors', 
                    headers: { 'Content-Type': 'text/plain' }, 
                    body: JSON.stringify(globalPayload)
                })
            );
        }

        // Execute all sync requests in parallel
        if (requests.length > 0) {
            await Promise.all(requests);
        }

    } catch (e) {
        console.error("Sync failed:", e);
    }
};

export const StorageService = {
  // --- ROLES (Auto-Migration) ---
  getRoles: (): Role[] => {
      const data = localStorage.getItem(ROLES_KEY);
      let roles: Role[] = data ? JSON.parse(data) : INITIAL_ROLES;

      // Force update STAFF role if it's missing Category Permissions (Migration Fix)
      const staffRole = roles.find(r => r.code === 'STAFF');
      const needsUpdate = staffRole && !staffRole.permissions.includes('CATEGORY_CREATE');

      if (needsUpdate) {
          console.log("Auto-Migrating Staff Permissions for Category Management...");
          // Re-merge system roles from INITIAL_ROLES
          roles = INITIAL_ROLES.map(initRole => {
              const existing = roles.find(r => r.code === initRole.code);
              // For System Roles, we enforce the structure from code to apply updates
              if (existing && existing.isSystem) {
                  return { ...existing, permissions: initRole.permissions, description: initRole.description };
              }
              return existing || initRole;
          });
          
          // Keep user-custom roles
          const storedRoles = data ? JSON.parse(data) as Role[] : [];
          const customRoles = storedRoles.filter(r => !r.isSystem);
          roles = [...roles.filter(r => r.isSystem), ...customRoles];
          
          localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
      }

      return roles;
  },

  getRoleById: (id: string): Role | undefined => {
      const roles = StorageService.getRoles();
      return roles.find(r => r.id === id);
  },

  saveRole: (role: Role): ApiResponse<Role> => {
      try {
          const roles = StorageService.getRoles();
          if (roles.some(r => r.code === role.code && r.id !== role.id)) {
              return { success: false, error: 'Mã vai trò đã tồn tại.' };
          }
          const index = roles.findIndex(r => r.id === role.id);
          if (index >= 0) {
              roles[index] = role;
          } else {
              roles.push(role);
          }
          localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
          return { success: true, data: role };
      } catch (e) {
          return { success: false, error: 'Lưu vai trò thất bại.' };
      }
  },

  deleteRole: (id: string): ApiResponse<void> => {
      const roles = StorageService.getRoles();
      const role = roles.find(r => r.id === id);
      if (role?.isSystem) {
          return { success: false, error: 'Không thể xóa vai trò hệ thống.' };
      }
      const newRoles = roles.filter(r => r.id !== id);
      localStorage.setItem(ROLES_KEY, JSON.stringify(newRoles));
      return { success: true };
  },

  // --- EXISTING METHODS ---
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

  getCategories: (type?: Category['type']): Category[] => {
    const data = localStorage.getItem(CATEGORIES_KEY);
    let categories: Category[] = data ? JSON.parse(data) : [...INITIAL_CATEGORIES];
    
    // Auto-Fix: Ensure companies exist
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

  /**
   * Generates a unique employee code based on pattern COMPANY_CODE + YY + Sequence
   */
  generateNextEmployeeCode: (companyId?: string): string => {
      const employees = StorageService.getEmployees();
      let prefix = 'EMP';

      if (companyId) {
          const categories = StorageService.getCategories('COMPANY');
          const company = categories.find(c => c.id === companyId);
          if (company && company.code) {
              prefix = company.code;
          }
      }

      const currentYearShort = new Date().getFullYear().toString().slice(-2);
      const fullPrefix = `${prefix}${currentYearShort}`; // e.g., LCF24

      // Filter existing codes that match current prefix
      const existingCodes = employees
          .map(e => e.employeeCode)
          .filter(c => c && c.startsWith(fullPrefix));

      let maxSeq = 0;
      existingCodes.forEach(c => {
          // Extract the numeric part after prefix
          const numPartStr = c.substring(fullPrefix.length);
          const numPart = parseInt(numPartStr, 10);
          if (!isNaN(numPart) && numPart > maxSeq) {
              maxSeq = numPart;
          }
      });

      // Increment and pad with zeros (e.g., 001, 002... 999)
      const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
      return `${fullPrefix}${nextSeq}`;
  },

  saveEmployee: (employee: Employee): ApiResponse<Employee> => {
    try {
      const employees = StorageService.getEmployees(); 
      
      // Validation: Email
      if (employees.some(e => e.email === employee.email && e.id !== employee.id)) {
        return { success: false, error: 'Email đã tồn tại trong hệ thống.' };
      }
      
      // Validation: Employee Code (If provided)
      if (employee.employeeCode && employees.some(e => e.employeeCode === employee.employeeCode && e.id !== employee.id)) {
          return { success: false, error: `Mã nhân viên '${employee.employeeCode}' đã tồn tại.` };
      }

      // Validation: Identity Card
      if (employee.identityCard && employees.some(e => e.identityCard === employee.identityCard && e.id !== employee.id)) {
          return { success: false, error: `Số CCCD/CMND '${employee.identityCard}' đã tồn tại.` };
      }

      const categories = StorageService.getCategories('ADMIN_UNIT');
      const provName = categories.find(c => c.code === employee.provinceCode)?.name || '';
      const distName = categories.find(c => c.code === employee.districtCode)?.name || '';
      const wardName = categories.find(c => c.code === employee.wardCode)?.name || '';
      
      let fullAddress = employee.addressDetail || '';
      if (wardName) fullAddress += `, ${wardName}`;
      if (distName) fullAddress += `, ${distName}`;
      if (provName) fullAddress += `, ${provName}`;
      
      employee.address = fullAddress;

      const existingIndex = employees.findIndex(e => e.id === employee.id);
      if (existingIndex >= 0) {
        employees[existingIndex] = employee;
      } else {
        employees.push(employee);
      }

      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
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
          if (!empToDelete) return { success: false, error: 'Không tìm thấy nhân viên.' };
          const newEmployees = employees.filter(e => e.id !== id);
          localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(newEmployees));
          syncToGoogleSheet('EMPLOYEE', 'DELETE', { id: empToDelete.id }, empToDelete.companyId);
          return { success: true };
      } catch (e) {
          return { success: false, error: 'Xóa nhân viên thất bại.' };
      }
  },

  getUsers: (): User[] => {
      const data = localStorage.getItem(USERS_KEY);
      let users: User[] = data ? JSON.parse(data) : [...INITIAL_USERS];
      users.forEach(u => {
          if (!u.roleId) {
              u.roleId = u.role === UserRole.ADMIN ? 'role_admin' : 'role_staff';
          }
      });
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
          if (!user.roleId) {
              user.roleId = user.role === UserRole.ADMIN ? 'role_admin' : 'role_staff';
          }
          const { password, ...safeUser } = user;
          return safeUser as User;
      }
      return null;
  },
  
  /**
   * FACTORY RESET: Clears all data and reloads the page.
   */
  resetSystem: () => {
      localStorage.removeItem(EMPLOYEES_KEY);
      localStorage.removeItem(CATEGORIES_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(USERS_KEY);
      localStorage.removeItem(ROLES_KEY);
      window.location.reload();
  },

  // Updated to use SheetJS for Excel export with Auto-Fit columns
  exportCategoriesToExcel: (categories: Category[], type: Category['type']) => {
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
          alert("Excel library is missing.");
          return;
      }

      // 1. Prepare Data
      // Resolve Parent Name if applicable
      const allCategories = StorageService.getCategories(); // Need full list for parent lookup
      const data = categories.map(c => {
          const row: any = {
              'Code': c.code,
              'Name': c.name,
              'Description': c.description || ''
          };

          // Add Level if Department
          if (type === 'DEPARTMENT') {
              row['Level'] = c.level || '';
          }
          
          if (c.parentId) {
              const parent = allCategories.find(p => p.id === c.parentId);
              row['Parent Code'] = parent ? parent.code : c.parentId;
              row['Parent Name'] = parent ? parent.name : '';
          } else {
             // For consistency
             if (type === 'DEPARTMENT' || type === 'ADMIN_UNIT') {
                 row['Parent Code'] = '';
                 row['Parent Name'] = '';
             }
          }
          
          if (type === 'COMPANY') {
              row['Endpoint URL'] = c.appScriptUrl || '';
              row['Sheet URL'] = c.googleSheetUrl || '';
          }

          return row;
      });

      // 2. Create Sheet
      const ws = XLSX.utils.json_to_sheet(data);

      // 3. Auto-Calculate Column Widths
      if (data.length > 0) {
          const keys = Object.keys(data[0]);
          const wscols = keys.map(key => {
              // Start with header length
              let maxLen = key.length;
              // Check all data rows for this column
              data.forEach(row => {
                  const val = row[key] ? String(row[key]) : '';
                  if (val.length > maxLen) maxLen = val.length;
              });
              // Add some padding, cap at 50 chars
              return { wch: Math.min(maxLen + 2, 50) };
          });
          ws['!cols'] = wscols;
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "List");
      XLSX.writeFile(wb, `${type}_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
};