import { Employee, Category, ApiResponse, SystemSettings, User, UserRole } from '../types';

const EMPLOYEES_KEY = 'hrm_employees';
const CATEGORIES_KEY = 'hrm_categories';
const SETTINGS_KEY = 'hrm_settings';
const USERS_KEY = 'hrm_users';

// Initial Mock Data with Hierarchy
const INITIAL_CATEGORIES: Category[] = [
  // Companies
  { id: 'c1', code: 'LCF', name: 'LCFoods Corp', type: 'COMPANY', parentId: null },
  { id: 'c2', code: 'LCF_LOG', name: 'LCFoods Logistics', type: 'COMPANY', parentId: null },

  // Departments
  { id: '1', code: 'BOD', name: 'Board of Directors', type: 'DEPARTMENT', parentId: null },
  { id: '2', code: 'HR', name: 'Human Resources', type: 'DEPARTMENT', parentId: '1' },
  { id: '3', code: 'IT', name: 'Information Technology', type: 'DEPARTMENT', parentId: '1' },
  { id: '4', code: 'ACC', name: 'Accounting', type: 'DEPARTMENT', parentId: '1' },
  
  // Positions
  { id: '10', code: 'DIR', name: 'Director', type: 'POSITION' },
  { id: '11', code: 'MGR', name: 'Manager', type: 'POSITION' },
  { id: '12', code: 'DEV', name: 'Senior Developer', type: 'POSITION' },
  { id: '13', code: 'ACC_STAFF', name: 'Accountant', type: 'POSITION' },

  // Locations (Offices)
  { id: '20', code: 'HO', name: 'Head Office (Hanoi)', type: 'LOCATION' },
  { id: '21', code: 'HCM', name: 'HCM Branch', type: 'LOCATION' },

  // Administrative Units (Sample Data for Hierarchy)
  // Level 1: Province
  { id: '100', code: 'HN', name: 'Hà Nội', type: 'ADMIN_UNIT', parentId: null },
  { id: '101', code: 'DN', name: 'Đà Nẵng (New Model)', type: 'ADMIN_UNIT', parentId: null },
  
  // Level 2: District (Standard 3-level model)
  { id: '200', code: 'CG', name: 'Cầu Giấy', type: 'ADMIN_UNIT', parentId: '100' },
  
  // Level 3: Ward
  { id: '300', code: 'YENHOA', name: 'Yên Hòa', type: 'ADMIN_UNIT', parentId: '200' },

  // Level 2: Ward (New 2-level model for specific areas post-2025 if applicable)
  { id: '201', code: 'HC', name: 'Hòa Cường (Ward direct)', type: 'ADMIN_UNIT', parentId: '101' },
];

const INITIAL_SETTINGS: SystemSettings = {
  googleSheetUrl: '',
  appScriptUrl: ''
};

// Initial Admin User
const INITIAL_USERS: User[] = [
    {
        id: 'admin-001',
        name: 'System Admin',
        email: 'admin@lcfoods.com', // Corrected to match UI
        password: 'password', 
        role: UserRole.ADMIN,
        companyId: 'c1' // Assigned to LCFoods Corp
    },
    {
        id: 'staff-001',
        name: 'HR Staff',
        email: 'staff@lcfoods.com', // Corrected to match UI
        password: 'password',
        role: UserRole.STAFF,
        companyId: 'c1'
    }
];

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
      return { success: false, error: 'Failed to save settings.' };
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
      const categories = StorageService.getCategories(); // Gets all, including auto-fixed ones
      if (categories.some(c => c.code === category.code && c.type === category.type && c.id !== category.id)) {
        return { success: false, error: `Code ${category.code} already exists for this type.` };
      }
      
      // Prevent circular dependency if editing
      if (category.parentId && category.parentId === category.id) {
         return { success: false, error: `A category cannot be its own parent.` };
      }

      const existingIndex = categories.findIndex(c => c.id === category.id);
      if (existingIndex >= 0) {
        categories[existingIndex] = category;
      } else {
        categories.push(category);
      }
      
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      return { success: true, data: category };
    } catch (e) {
      return { success: false, error: 'Failed to save category.' };
    }
  },

  deleteCategory: (id: string) => {
    let categories = StorageService.getCategories();
    // Also delete children to maintain integrity
    const deleteRecursive = (parentId: string) => {
      const children = categories.filter(c => c.parentId === parentId);
      children.forEach(child => deleteRecursive(child.id));
      categories = categories.filter(c => c.id !== parentId);
    };
    
    deleteRecursive(id);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
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

  saveEmployee: (employee: Employee): ApiResponse<Employee> => {
    try {
      const employees = StorageService.getEmployees(); // Get all
      // Check duplicate email (globally unique email preferred)
      if (employees.some(e => e.email === employee.email && e.id !== employee.id)) {
        return { success: false, error: 'Email already exists in the system.' };
      }

      const existingIndex = employees.findIndex(e => e.id === employee.id);
      if (existingIndex >= 0) {
        employees[existingIndex] = employee;
      } else {
        employees.push(employee);
      }

      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
      
      // Use configured App Script URL
      const settings = StorageService.getSettings();
      if (settings.appScriptUrl) {
         console.log(`SYNCING TO APP SCRIPT [${settings.appScriptUrl}]`, employee);
         // In a real app: fetch(settings.appScriptUrl, { method: 'POST', body: JSON.stringify(employee) })
      }
      
      return { success: true, data: employee };
    } catch (e) {
      return { success: false, error: 'Failed to save employee data.' };
    }
  },

  // --- User Methods ---
  getUsers: (): User[] => {
      const data = localStorage.getItem(USERS_KEY);
      let users: User[] = data ? JSON.parse(data) : [...INITIAL_USERS];

      // --- MIGRATION LOGIC for user "pass admin error" ---
      // If the storage contains the old email 'admin@company.com' but not 'admin@lcfoods.com', migrate it.
      const oldAdminIndex = users.findIndex(u => u.email === 'admin@company.com');
      const newAdminExists = users.some(u => u.email === 'admin@lcfoods.com');
      
      let changed = false;

      if (oldAdminIndex >= 0 && !newAdminExists) {
          users[oldAdminIndex].email = 'admin@lcfoods.com';
          users[oldAdminIndex].companyId = 'c1'; // Ensure they have a company
          changed = true;
      } else if (!newAdminExists) {
          // If neither exists (maybe deleted?), re-add the default admin
          users.push(INITIAL_USERS[0]);
          changed = true;
      }
      
      // Same check for staff
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
              return { success: false, error: 'Email already exists.' };
          }
          const existingIndex = users.findIndex(u => u.id === user.id);
          if (existingIndex >= 0) {
              // Preserve password if not provided in update
              if (!user.password) {
                  user.password = users[existingIndex].password;
              }
              users[existingIndex] = user;
          } else {
              if (!user.password) return { success: false, error: 'Password is required for new users.'};
              users.push(user);
          }
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          return { success: true, data: user };
      } catch (e) {
          return { success: false, error: 'Failed to save user.' };
      }
  },

  deleteUser: (id: string): ApiResponse<void> => {
      const users = StorageService.getUsers();
      if (users.length <= 1) return { success: false, error: 'Cannot delete the last user.' };
      
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