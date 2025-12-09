
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeDetail } from './components/EmployeeDetail';
import { CategoryManager } from './components/CategoryManager';
import { SmartAssistant } from './components/SmartAssistant';
import { Settings } from './components/Settings';
import { UserManager } from './components/UserManager';
import { RoleManager } from './components/RoleManager'; 
import { Dashboard } from './components/Dashboard';
import { TrainingModule } from './components/TrainingModule'; // Import Training
import { User, Category, PermissionKey } from './types';
import { StorageService } from './services/storageService';
import { Building, AlertCircle, Briefcase, Lock } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { t } = useLanguage();
  
  const [loginError, setLoginError] = useState('');
  const [loginCompanyId, setLoginCompanyId] = useState<string>('');

  const [companies, setCompanies] = useState<Category[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>('');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const loadedCompanies = StorageService.getCategories('COMPANY');
    setCompanies(loadedCompanies);
    if (loadedCompanies.length > 0 && !loginCompanyId) {
        setLoginCompanyId(loadedCompanies[0].id);
    }
  }, []);

  useEffect(() => {
    if (user && companies.length > 0) {
        if (!currentCompanyId) {
             if (user.companyId) {
                 setCurrentCompanyId(user.companyId);
             } else {
                 setCurrentCompanyId(companies[0].id);
             }
        }
    }
  }, [user]); 

  // --- PERMISSION CHECK HELPER ---
  const userPermissions = useMemo(() => {
      if (!user?.roleId) return [];
      const role = StorageService.getRoleById(user.roleId);
      return role ? role.permissions : [];
  }, [user]);

  const hasPermission = (key: PermissionKey) => userPermissions.includes(key);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const form = e.target as HTMLFormElement;
    // Updated: Input can be email or username
    const identifier = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    const authenticatedUser = StorageService.authenticate(identifier, password);

    if (authenticatedUser) {
        // Validate Company Access
        if (authenticatedUser.companyId && authenticatedUser.companyId !== loginCompanyId) {
            setLoginError(t.auth.noAccess);
            return;
        }

        setUser(authenticatedUser);
        setCurrentCompanyId(loginCompanyId); 
        setCurrentPage('dashboard');
    } else {
        setLoginError(t.auth.invalid);
    }
  };

  const renderContent = () => {
    if (!currentCompanyId) {
        return <div className="p-8 text-center text-slate-500">{t.common.loading}</div>;
    }

    const AccessDenied = () => (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <Lock className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-slate-600">Access Denied</h3>
            <p>You do not have permission to view this page.</p>
        </div>
    );

    switch (currentPage) {
      case 'dashboard':
        return hasPermission('DASHBOARD') ? <Dashboard currentCompanyId={currentCompanyId} /> : <AccessDenied />;
      
      case 'employee-list':
        return hasPermission('EMPLOYEE_VIEW') ? ( 
          <EmployeeList 
            currentCompanyId={currentCompanyId} 
            onAddNew={() => {
                setEditingEmployeeId(null);
                setCurrentPage('employees');
            }} 
            onSelectEmployee={(id) => {
                setSelectedEmployeeId(id);
                setCurrentPage('employee-detail');
            }}
            onEditEmployee={(id) => {
                setEditingEmployeeId(id);
                setCurrentPage('employees');
            }}
            user={user!} 
          />
        ) : <AccessDenied />;
      
      case 'employee-detail':
        return hasPermission('EMPLOYEE_VIEW') ? (
            <EmployeeDetail 
                employeeId={selectedEmployeeId || ''} 
                onBack={() => {
                    setSelectedEmployeeId(null);
                    setCurrentPage('employee-list');
                }} 
            />
        ) : <AccessDenied />;
      
      case 'employees':
        return hasPermission('EMPLOYEE_CREATE') || hasPermission('EMPLOYEE_EDIT') ? (
            <EmployeeForm 
                currentCompanyId={currentCompanyId} 
                editingEmployeeId={editingEmployeeId}
                onCancel={() => {
                    setEditingEmployeeId(null);
                    setCurrentPage('employee-list');
                }}
                onSaveSuccess={() => {
                    setEditingEmployeeId(null);
                    setCurrentPage('employee-list');
                }}
            />
        ) : <AccessDenied />;
      
      case 'companies':
         return hasPermission('CATEGORY_VIEW') 
          ? <CategoryManager type="COMPANY" title={t.sidebar.companies} user={user!} /> 
          : <AccessDenied />;
      case 'departments':
        return hasPermission('CATEGORY_VIEW') 
          ? <CategoryManager type="DEPARTMENT" title={t.sidebar.departments} isHierarchical={true} user={user!} />
          : <AccessDenied />;
      case 'positions':
        return hasPermission('CATEGORY_VIEW') 
          ? <CategoryManager type="POSITION" title={t.sidebar.positions} user={user!} />
          : <AccessDenied />;
      case 'locations':
        return hasPermission('CATEGORY_VIEW') 
          ? <CategoryManager type="LOCATION" title={t.sidebar.locations} user={user!} />
          : <AccessDenied />;
      case 'admin-units':
        return hasPermission('CATEGORY_VIEW') 
          ? <CategoryManager type="ADMIN_UNIT" title={t.sidebar.adminUnits} isHierarchical={true} user={user!} />
          : <AccessDenied />;
      
      case 'training':
        return hasPermission('TRAINING_VIEW') 
            ? <TrainingModule currentUser={user!} companyId={currentCompanyId} />
            : <AccessDenied />;

      case 'settings':
        return hasPermission('SYSTEM_SETTINGS') ? <Settings /> : <AccessDenied />;
      case 'users':
        return hasPermission('SYSTEM_USERS_VIEW') ? <UserManager currentUser={user!} /> : <AccessDenied />;
      case 'roles':
        return hasPermission('SYSTEM_ROLES_VIEW') ? <RoleManager /> : <AccessDenied />;
      
      default:
        return <Dashboard currentCompanyId={currentCompanyId} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center text-blue-600">
            <Building className="w-12 h-12" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Thông Tin Nhân Sự
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            {t.auth.title}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                  {t.auth.selectCompany}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    id="company"
                    name="company"
                    value={loginCompanyId}
                    onChange={(e) => setLoginCompanyId(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                  >
                     {companies.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  {t.auth.email}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="text" 
                    autoComplete="username"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    defaultValue="admin"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  {t.auth.password}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    defaultValue="password"
                  />
                </div>
              </div>

              {loginError && (
                  <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {loginError}
                  </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={companies.length === 0}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {companies.length === 0 ? t.auth.loadingSystem : t.auth.signIn}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout
      user={user}
      companies={companies}
      currentCompanyId={currentCompanyId}
      onCompanyChange={setCurrentCompanyId}
      onLogout={() => setUser(null)}
      currentPage={currentPage}
      onNavigate={(page) => {
          setCurrentPage(page);
          if (page !== 'employee-detail') setSelectedEmployeeId(null);
      }}
      onOpenAssistant={() => setIsAssistantOpen(true)}
    >
      {renderContent()}
      <SmartAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
