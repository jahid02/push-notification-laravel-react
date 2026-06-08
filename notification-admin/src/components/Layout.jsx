import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Menu, User, ShieldAlert, Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'react-hot-toast';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { permission, token, loading, requestAndRegister, unregister } = usePushNotifications();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
            {/* Notification Status Bell */}
            <div className="relative">
              {loading ? (
                <button
                  disabled
                  className="p-2.5 rounded-full border border-border-color bg-white/[0.03] flex items-center justify-center text-accent-primary"
                >
                  <Loader2 size={18} className="animate-spin" />
                </button>
              ) : permission === 'granted' && token ? (
                <button
                  onClick={() => {
                    if (window.confirm('Do you want to unsubscribe from desktop push notifications?')) {
                      unregister();
                    }
                  }}
                  title="Notifications Subscribed (Click to unsubscribe)"
                  className="p-2.5 rounded-full border border-accent-secondary/20 bg-accent-secondary/5 hover:bg-accent-secondary/10 transition-all duration-200 cursor-pointer flex items-center justify-center text-accent-secondary hover:text-accent-secondary-hover shadow-[0_0_12px_rgba(13,148,136,0.15)] group relative"
                >
                  <BellRing size={18} className="group-hover:scale-110 transition-transform duration-200" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-secondary"></span>
                  </span>
                </button>
              ) : permission === 'denied' ? (
                <button
                  onClick={() => {
                    toast.error(
                      'Notifications are blocked. Please click the site settings lock icon in your browser URL bar and set Notifications to "Allow".',
                      { duration: 5000 }
                    );
                  }}
                  title="Notifications Blocked. Click for instructions to reset."
                  className="p-2.5 rounded-full border border-danger/20 bg-danger/5 hover:bg-danger/10 transition-all duration-200 cursor-pointer flex items-center justify-center text-danger hover:text-danger/90 group"
                >
                  <BellOff size={18} className="group-hover:scale-110 transition-transform duration-200" />
                </button>
              ) : (
                <button
                  onClick={requestAndRegister}
                  title="Enable Push Notifications"
                  className="p-2.5 rounded-full border border-border-color bg-white/[0.03] hover:bg-bg-surface-hover hover:border-border-light transition-all duration-200 cursor-pointer flex items-center justify-center text-text-muted hover:text-text-primary hover:shadow-glow group relative animate-pulse"
                >
                  <Bell size={18} className="group-hover:scale-110 transition-transform duration-200" />
                  <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-primary"></span>
                  </span>
                </button>
              )}
            </div>

            {/* User Profile Widget */}
            <div className="flex items-center gap-3 p-1.5 md:p-2 px-3 rounded-full bg-white/[0.03] border border-border-color">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-bold text-white text-sm font-display">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
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
