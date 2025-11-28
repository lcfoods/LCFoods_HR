import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeDetail } from './components/EmployeeDetail';
import { CategoryManager } from './components/CategoryManager';
import { SmartAssistant } from './components/SmartAssistant';
import { Settings } from './components/Settings';
import { UserManager } from './components/UserManager';
import { Dashboard } from './components/Dashboard';
import { User, UserRole, Category } from './types';
import { StorageService } from './services/storageService';
import { Building, AlertCircle, Briefcase } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  // Login State
  const [loginError, setLoginError] = useState('');
  const [loginCompanyId, setLoginCompanyId] = useState<string>('');

  // Multi-Company State
  const [companies, setCompanies] = useState<Category[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>('');

  // Selected Employee for Details View
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Load companies on mount (Available for both Login and App)
  useEffect(() => {
    const loadedCompanies = StorageService.getCategories('COMPANY');
    setCompanies(loadedCompanies);
    
    // Default login selection
    if (loadedCompanies.length > 0 && !loginCompanyId) {
        setLoginCompanyId(loadedCompanies[0].id);
    }
  }, []);

  // Update App context when User changes
  useEffect(() => {
    if (user && companies.length > 0) {
        // If the user just logged in, currentCompanyId is already set by handleLogin
        // This effect ensures we handle direct company switching rules if needed later
        if (!currentCompanyId) {
             if (user.role === UserRole.STAFF && user.companyId) {
                 setCurrentCompanyId(user.companyId);
             } else {
                 setCurrentCompanyId(companies[0].id);
             }
        }
    }
  }, [user]); 

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    // 1. Authenticate Credentials
    const authenticatedUser = StorageService.authenticate(email, password);

    if (authenticatedUser) {
        // 2. Validate Company Access
        // Admin can access any company. Staff must match their assigned companyId.
        if (authenticatedUser.role !== UserRole.ADMIN && authenticatedUser.companyId !== loginCompanyId) {
            setLoginError('You do not have access to the selected company.');
            return;
        }

        // 3. Success
        setUser(authenticatedUser);
        setCurrentCompanyId(loginCompanyId); // Set the session context to the selected company
        setCurrentPage('dashboard');
    } else {
        setLoginError('Invalid email or password.');
    }
  };

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setCurrentPage('employee-detail');
  };

  const renderContent = () => {
    // If no company selected yet, show loading or empty
    if (!currentCompanyId) {
        return <div className="p-8 text-center text-slate-500">Loading companies... or no companies defined.</div>;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard currentCompanyId={currentCompanyId} />;
      case 'employee-list':
        return (
          <EmployeeList 
            currentCompanyId={currentCompanyId} 
            onAddNew={() => setCurrentPage('employees')} 
            onSelectEmployee={handleSelectEmployee}
          />
        );
      case 'employee-detail':
        return (
            <EmployeeDetail 
                employeeId={selectedEmployeeId || ''} 
                onBack={() => {
                    setSelectedEmployeeId(null);
                    setCurrentPage('employee-list');
                }} 
            />
        );
      case 'employees':
        return <EmployeeForm currentCompanyId={currentCompanyId} />;
      case 'companies':
         return user?.role === UserRole.ADMIN 
          ? <CategoryManager type="COMPANY" title="Companies" /> 
          : <div className="text-center py-10 text-red-500">Access Denied</div>;
      case 'departments':
        return <CategoryManager type="DEPARTMENT" title="Departments" isHierarchical={true} />;
      case 'positions':
        return <CategoryManager type="POSITION" title="Positions" />;
      case 'locations':
        return <CategoryManager type="LOCATION" title="Office Locations" />;
      case 'admin-units':
        return <CategoryManager type="ADMIN_UNIT" title="Administrative Units" isHierarchical={true} />;
      case 'settings':
        return <Settings />;
      case 'users':
        return user?.role === UserRole.ADMIN ? <UserManager /> : <div className="text-center py-10 text-red-500">Access Denied</div>;
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
            LCFoods Group
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            HR Management System
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              
              {/* Company Selection */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                  Select Company
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
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    defaultValue="admin@lcfoods.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
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
                  {companies.length === 0 ? 'Loading System...' : 'Sign in'}
                </button>
              </div>
            </form>
            <div className="mt-6">
               <div className="relative">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-slate-300" />
                 </div>
                 <div className="relative flex justify-center text-sm">
                   <span className="px-2 bg-white text-slate-500">Demo Credentials</span>
                 </div>
               </div>
               <div className="mt-2 grid grid-cols-1 gap-2 text-center text-xs text-slate-400">
                  <p>Admin: admin@lcfoods.com / password</p>
                  <p>Staff: staff@lcfoods.com / password</p>
               </div>
            </div>
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