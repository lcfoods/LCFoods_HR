
import React, { useState } from 'react';
import { User, UserRole, Category } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, 
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
  Globe
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
  const { language, setLanguage, t } = useLanguage();

  const NavItem = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => (
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
                    <span className="text-lg font-bold tracking-tight whitespace-nowrap">LCFoods Group</span>
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
            <NavItem page="dashboard" icon={LayoutDashboard} label={t.sidebar.dashboard} />
            <NavItem page="employee-list" icon={BookUser} label={t.sidebar.employeeDirectory} />
            <NavItem page="employees" icon={UserPlus} label={t.sidebar.newEntry} />
            
            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase">{t.sidebar.categories}</div>
            {user.role === UserRole.ADMIN && (
                 <NavItem page="companies" icon={Building} label={t.sidebar.companies} />
            )}
            <NavItem page="departments" icon={Building2} label={t.sidebar.departments} />
            <NavItem page="positions" icon={Briefcase} label={t.sidebar.positions} />
            <NavItem page="locations" icon={MapPin} label={t.sidebar.locations} />
            <NavItem page="admin-units" icon={Landmark} label={t.sidebar.adminUnits} />

            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase">{t.sidebar.system}</div>
            <NavItem page="settings" icon={SettingsIcon} label={t.sidebar.configuration} />
            {user.role === UserRole.ADMIN && (
                <NavItem page="users" icon={Shield} label={t.sidebar.userManagement} />
            )}
            </nav>

            <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center mb-4 space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                {user.name.charAt(0)}
                </div>
                <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-400">{user.role}</p>
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
    </div>
  );
};
