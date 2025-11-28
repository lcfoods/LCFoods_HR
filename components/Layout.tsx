import React, { useState } from 'react';
import { User, UserRole, Category } from '../types';
import { 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  Sparkles, 
  Building2,
  Briefcase,
  MapPin,
  LayoutDashboard,
  Landmark,
  Shield,
  Building,
  UserPlus,
  BookUser
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
  onCompanyChange,
  onLogout, 
  currentPage, 
  onNavigate,
  onOpenAssistant
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="px-4 py-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight whitespace-nowrap">LCFoods Group</span>
                </div>
                
                {/* Company Selector */}
                <div className="relative">
                    <select
                        value={currentCompanyId}
                        onChange={(e) => onCompanyChange(e.target.value)}
                        disabled={user.role !== UserRole.ADMIN}
                        className={`w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer ${user.role !== UserRole.ADMIN ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {user.role === UserRole.ADMIN && (
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    )}
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase">Main</div>
            <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem page="employee-list" icon={BookUser} label="Employee Directory" />
            <NavItem page="employees" icon={UserPlus} label="New Entry" />
            
            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase">Categories</div>
            {user.role === UserRole.ADMIN && (
                 <NavItem page="companies" icon={Building} label="Companies" />
            )}
            <NavItem page="departments" icon={Building2} label="Departments" />
            <NavItem page="positions" icon={Briefcase} label="Positions" />
            <NavItem page="locations" icon={MapPin} label="Locations" />
            <NavItem page="admin-units" icon={Landmark} label="Admin Units" />

            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase">System</div>
            <NavItem page="settings" icon={SettingsIcon} label="Configuration" />
            {user.role === UserRole.ADMIN && (
                <NavItem page="users" icon={Shield} label="User Management" />
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
                Sign Out
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
            <button 
              onClick={onOpenAssistant}
              className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ask AI Assistant
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
