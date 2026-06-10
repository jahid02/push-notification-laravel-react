import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Menu, User, ShieldAlert, Bell } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';;
import api from '../api/axios';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { permission, requestAndRegister } = usePushNotifications();
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Auto-request push permissions on landing if default
  useEffect(() => {
    if (user && permission === 'default') {
      requestAndRegister();
    }
  }, [user, permission]);

  // Fetch in-app unread notifications count
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data && response.data.success) {
        setUnreadCount(response.data.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    // Check periodically
    const interval = setInterval(fetchUnreadCount, 30000);

    // Event listener to sync unread count when reading notifications
    window.addEventListener('sync-notifications', fetchUnreadCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sync-notifications', fetchUnreadCount);
    };
  }, [user]);

  // Maps path to a header title
  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Console Dashboard';
    if (pathname === '/users') return 'User Directory & Roles';
    if (pathname === '/subscribers') return 'Channel Subscribers';
    if (pathname === '/posts') return 'Posts & Automatic Dispatch';
    if (pathname === '/posts/create') return 'Create & Broadcast Post';
    if (pathname.startsWith('/posts/') && pathname.endsWith('/edit')) return 'Edit Post';
    if (pathname === '/notifications') return 'Custom Push Dispatcher';
    if (pathname === '/failed-jobs') return 'Queue System Control';
    if (pathname === '/device-tokens') return 'Registered Device Tokens';
    if (pathname === '/profile') return 'My Operator Profile';
    if (pathname === '/inbox') return 'Notification Inbox';
    return 'Administration Console';
  };

  return (
    <div className="flex min-h-screen w-full bg-bg-main relative overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* Top Header */}
        <header className="h-[70px] px-4 md:px-8 flex items-center justify-between bg-bg-glass backdrop-blur-md border-b border-border-color sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="bg-none border-none text-text-primary mr-1 cursor-pointer flex items-center md:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-text-primary font-display truncate">
              {getPageTitle(location.pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Inbox Bell */}
            <button
              onClick={() => navigate('/inbox')}
              title="View Notification Inbox"
              className="p-2.5 rounded-full border border-border-color bg-white/[0.03] hover:bg-bg-surface-hover hover:border-border-light transition-all duration-200 cursor-pointer flex items-center justify-center text-text-muted hover:text-text-primary hover:shadow-glow relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Widget */}
            <div className="flex items-center gap-3 p-1.5 md:p-2 px-3 rounded-full bg-white/[0.03] border border-border-color">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border-color flex items-center justify-center bg-gradient-to-br from-accent-primary to-accent-secondary font-bold text-white text-sm font-display shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />
                )}
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-sm font-semibold text-text-primary leading-tight">
                  {user?.name || 'Guest User'}
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1 capitalize">
                  {user?.role === 'admin' && (
                    <ShieldAlert size={10} className="text-accent-secondary" />
                  )}
                  {user?.role || 'Guest'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 p-5 md:p-8 max-w-[1400px] w-full mx-auto box-border animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
