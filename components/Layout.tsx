
import React, { useState, useMemo } from 'react';
import { User, Category, PermissionKey } from '../types';
import { StorageService } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  Sparkles, 
  Building2,
  Briefcase,
  MapPin,
  LayoutDashboard,
  Landmark,
  Shield,
  Building,
  UserPlus,
  BookUser,
  Lock,
  X,
  ShieldCheck,
  Check,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  companies: Category[];
  currentCompanyId: string;
  onCompanyChange: (id: string) => void;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenAssistant: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  companies,
  currentCompanyId,
  onLogout, 
  currentPage, 
  onNavigate,
  onOpenAssistant
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Get Permissions based on user.roleId
  const permissions = useMemo(() => {
      if (!user.roleId) return [];
      const role = StorageService.getRoleById(user.roleId);
      return role ? role.permissions : [];
  }, [user]);

  const roleName = useMemo(() => {
      if (!user.roleId) return user.role;
      const role = StorageService.getRoleById(user.roleId);
      return role ? role.name : user.role;
  }, [user]);

  // Check if Full Admin (Has critical system permissions)
  const isFullAdmin = useMemo(() => {
      const criticalKeys: PermissionKey[] = [
          'SYSTEM_SETTINGS', 
          'SYSTEM_USERS_MANAGE', 
          'SYSTEM_ROLES_MANAGE',
          'EMPLOYEE_DELETE'
      ];
      return criticalKeys.every(key => permissions.includes(key));
  }, [permissions]);

  const hasPermission = (key: PermissionKey) => permissions.includes(key);

  const NavItem = ({ page, icon: Icon, label, permKey }: { page: string; icon: any; label: string; permKey?: PermissionKey }) => {
    // If permKey is provided, check permission. If not provided, assume allowed (or check logic elsewhere)
    if (permKey && !hasPermission(permKey)) return null;

    return (
      <button
        onClick={() => {
          onNavigate(page);
          setIsMobileMenuOpen(false);
        }}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors ${
          currentPage === page 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        {label}
      </button>
    );
  };

  const currentCompanyName = companies.find(c => c.id === currentCompanyId)?.name || "Unknown Company";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="px-4 py-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight whitespace-nowrap">Thông Tin Nhân Sự</span>
                </div>
                
                {/* Fixed Company Display (Locked) */}
                <div className="bg-slate-800 rounded-md px-3 py-2 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Current Workspace</div>
                    <div className="text-sm font-medium text-white flex items-center truncate" title={currentCompanyName}>
                        <Briefcase className="w-3.5 h-3.5 mr-2 text-blue-400 shrink-0" />
                        {currentCompanyName}
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase">{t.sidebar.main}</div>
            <NavItem page="dashboard" icon={LayoutDashboard} label={t.sidebar.dashboard} permKey="DASHBOARD" />
            <NavItem page="employee-list" icon={BookUser} label={t.sidebar.employeeDirectory} permKey="EMPLOYEE_VIEW" />
            <NavItem page="employees" icon={UserPlus} label={t.sidebar.newEntry} permKey="EMPLOYEE_CREATE" />
            
            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase">{t.sidebar.categories}</div>
            <NavItem page="companies" icon={Building} label={t.sidebar.companies} permKey="CATEGORY_VIEW" />
            <NavItem page="departments" icon={Building2} label={t.sidebar.departments} permKey="CATEGORY_VIEW" />
            <NavItem page="positions" icon={Briefcase} label={t.sidebar.positions} permKey="CATEGORY_VIEW" />
            <NavItem page="locations" icon={MapPin} label={t.sidebar.locations} permKey="CATEGORY_VIEW" />
            <NavItem page="admin-units" icon={Landmark} label={t.sidebar.adminUnits} permKey="CATEGORY_VIEW" />

            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase">E-Learning</div>
            <NavItem page="training" icon={GraduationCap} label={t.sidebar.training} permKey="TRAINING_VIEW" />

            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase">{t.sidebar.system}</div>
            <NavItem page="settings" icon={SettingsIcon} label={t.sidebar.configuration} permKey="SYSTEM_SETTINGS" />
            <NavItem page="users" icon={Shield} label={t.sidebar.userManagement} permKey="SYSTEM_USERS_VIEW" />
            <NavItem page="roles" icon={Lock} label={t.sidebar.roleManagement} permKey="SYSTEM_ROLES_VIEW" />
            </nav>

            <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div 
                className="flex items-center mb-4 space-x-3 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors group"
                onClick={() => setIsProfileOpen(true)}
                title="Click to view permissions"
            >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold relative">
                    {user.name.charAt(0)}
                    {isFullAdmin && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                             <Check className="w-2 h-2 text-white" />
                        </span>
                    )}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate w-32 group-hover:text-blue-400 transition-colors">
                        {roleName}
                    </p>
                </div>
            </div>
            <button 
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-red-400 rounded-md hover:bg-slate-800 transition-colors"
            >
                <LogOut className="w-4 h-4 mr-2" />
                {t.sidebar.signOut}
            </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-500">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button
                    onClick={() => setLanguage('vn')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        language === 'vn' 
                        ? 'bg-white text-blue-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    VN
                </button>
                <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        language === 'en' 
                        ? 'bg-white text-blue-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    EN
                </button>
            </div>

            <button 
              onClick={onOpenAssistant}
              className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t.sidebar.askAi}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Profile & Permissions Modal */}
      {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white relative">
                      <button 
                        onClick={() => setIsProfileOpen(false)} 
                        className="absolute top-4 right-4 text-white/60 hover:text-white"
                      >
                          <X className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white border-4 border-white/10">
                              {user.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="text-xl font-bold">{user.name}</h3>
                              <p className="text-blue-200 text-sm flex items-center gap-1.5 mt-0.5">
                                  <Shield className="w-3.5 h-3.5" />
                                  {roleName}
                              </p>
                              <div className="mt-2 text-xs bg-slate-700/50 inline-flex items-center px-2 py-1 rounded text-slate-300">
                                  {user.email}
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-6">
                      <div className="mb-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Access Level Status</h4>
                          {isFullAdmin ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                  <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />
                                  <div>
                                      <div className="font-bold text-green-800">Full System Administrator</div>
                                      <p className="text-sm text-green-700 mt-1">
                                          Tài khoản này có toàn quyền quản lý hệ thống, bao gồm cấu hình, người dùng và phân quyền.
                                      </p>
                                  </div>
                              </div>
                          ) : (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                                  <div>
                                      <div className="font-bold text-amber-800">Restricted Access</div>
                                      <p className="text-sm text-amber-700 mt-1">
                                          Tài khoản này bị giới hạn quyền truy cập. Bạn chỉ có thể truy cập các chức năng được liệt kê bên dưới.
                                      </p>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                              <span>Active Permissions</span>
                              <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{permissions.length} keys</span>
                          </h4>
                          <div className="bg-slate-50 rounded-lg border border-slate-100 p-1 max-h-48 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-1">
                                  {permissions.map(perm => (
                                      <div key={perm} className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-slate-600 hover:bg-white rounded transition-colors">
                                          <Check className="w-3 h-3 text-blue-500 shrink-0" />
                                          {perm}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                      <button 
                          onClick={() => setIsProfileOpen(false)}
                          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
