import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FileText, 
  Send, 
  AlertTriangle, 
  LogOut, 
  Bell,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  // Check role permissions
  const isAdmin = user?.role === 'admin';
  const isAuthor = user?.role === 'author';
  const isStaff = isAdmin || isAuthor;

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      show: true,
    },
    // ── Reader links ──
    {
      name: 'Authors Directory',
      path: '/authors',
      icon: Users,
      show: user?.role === 'reader',
    },
    {
      name: 'Posts Feed',
      path: '/feed',
      icon: FileText,
      show: user?.role === 'reader',
    },
    {
      name: 'Inbox',
      path: '/inbox',
      icon: Bell,
      show: user?.role === 'reader',
    },
    // ── Author links ──
    {
      name: 'Subscribers',
      path: '/subscribers',
      icon: UserCheck,
      show: isAuthor,
    },
    {
      name: 'Posts Manager',
      path: '/posts',
      icon: FileText,
      show: isStaff,
    },
    {
      name: 'Notification Logs',
      path: '/notifications',
      icon: Bell,
      show: isAuthor,
    },
    // ── Admin links ──
    {
      name: 'Users Directory',
      path: '/users',
      icon: Users,
      show: isAdmin,
    },
    {
      name: 'Custom Push',
      path: '/notifications',
      icon: Send,
      show: isAdmin,
    },
    {
      name: 'Failed Queue Jobs',
      path: '/failed-jobs',
      icon: AlertTriangle,
      show: isAdmin,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[45] md:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}

      <aside className={`w-[260px] bg-bg-glass backdrop-blur-xl border-r border-border-color flex flex-col h-screen z-50 shrink-0 transition-transform duration-300 md:translate-x-0 fixed md:static left-0 top-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="h-[70px] flex items-center px-6 gap-3 border-b border-border-color">
          <Bell className="text-accent-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" size={24} />
          <span className="font-display text-xl font-extrabold bg-gradient-to-r from-text-primary to-accent-primary-hover bg-clip-text text-transparent tracking-tight">
            AetherNotify
          </span>
          
          {/* Mobile close button */}
          <button 
            onClick={toggleSidebar} 
            className="ml-auto bg-none border-none text-text-secondary cursor-pointer md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5 overflow-y-auto">
          {navigationItems
            .filter(item => item.show)
            .map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => isOpen && toggleSidebar()}
                  className={({ isActive }) => 
                    `flex items-center gap-3.5 px-4 py-3 text-text-secondary rounded-xl text-sm font-medium border border-transparent transition-all duration-150 hover:text-text-primary hover:bg-bg-surface-hover hover:border-border-color ${
                      isActive ? 'text-text-primary bg-bg-glass-active border-border-glow shadow-[inset_0_0_12px_rgba(139,92,246,0.08)]' : ''
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon 
                        size={18} 
                        className={isActive ? 'text-accent-primary drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]' : ''} 
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-border-color flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-border-color">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-bold text-white text-sm font-display">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary max-w-[140px] truncate">
                {user?.name || 'Guest User'}
              </span>
              <span className="text-xs text-text-muted capitalize">
                {user?.role || 'Visitor'}
              </span>
            </div>
          </div>

          <button 
            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-danger/5 border border-danger/10 text-danger font-semibold text-sm cursor-pointer transition-all duration-150 hover:bg-danger hover:text-white hover:border-danger hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)]" 
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
