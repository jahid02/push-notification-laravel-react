import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import { 
  Users, 
  FileText, 
  Send, 
  AlertTriangle, 
  UserCheck, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard');
      if (response.data && response.data.success) {
        setStatsData(response.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const role = statsData?.role || user?.role || 'reader';
  const stats = statsData?.stats || {};
  const recentNotifications = statsData?.recent_notifications || [];

  // ──── ADMIN VIEW ────
  const renderAdminDashboard = () => {
    const devices = stats.devices_by_platform || { web: 0, android: 0, ios: 0 };
    const delivery = stats.delivery || { sent: 0, failed: 0, success_rate: 100 };

    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary font-display">
            Welcome back, System Administrator!
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Here is a global overview of the FCM push notification pipeline.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatsCard
            title="Total Authors"
            value={stats.total_authors ?? 0}
            icon={Users}
            color="primary"
            loading={loading}
          />
          <StatsCard
            title="Total Readers"
            value={stats.total_readers ?? 0}
            icon={Users}
            color="secondary"
            loading={loading}
          />
          <StatsCard
            title="Total Posts"
            value={stats.total_posts ?? 0}
            icon={FileText}
            color="warning"
            loading={loading}
          />
          <StatsCard
            title="Registered Devices"
            value={stats.total_devices ?? 0}
            icon={Smartphone}
            color="secondary"
            loading={loading}
          />
          <StatsCard
            title="Delivery Success"
            value={`${delivery.success_rate}%`}
            icon={CheckCircle2}
            color="success"
            trend={`${delivery.sent} sent, ${delivery.failed} failed`}
            trendUp={delivery.success_rate >= 90}
            trendLabel="total attempts"
            loading={loading}
          />
          <StatsCard
            title="Failed Queue Jobs"
            value={stats.queue_failed_jobs ?? 0}
            icon={AlertTriangle}
            color="danger"
            trend={stats.queue_failed_jobs > 0 ? "Action required" : "Healthy pipeline"}
            trendUp={stats.queue_failed_jobs === 0}
            trendLabel=""
            loading={loading}
          />
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Device Platform Breakdown */}
          <div className="xl:col-span-4 bg-bg-glass border border-border-color rounded-2xl p-6 shadow-md h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-border-color mb-5">
              <h3 className="text-base font-semibold text-text-primary font-display">Device Platform Segmentation</h3>
              <Activity size={18} className="text-accent-secondary" />
            </div>
            
            {loading ? (
              <div className="space-y-4">
                <div className="h-10 bg-white/5 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-white/5 rounded-lg animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-5">
                {[
                  { name: 'Android OS Mobile', count: devices.android ?? 0, pctColor: 'bg-success', icon: '🤖' },
                  { name: 'iOS Apple Devices', count: devices.ios ?? 0, pctColor: 'bg-accent-primary', icon: '🍎' },
                  { name: 'Web Browsers (Push)', count: devices.web ?? 0, pctColor: 'bg-accent-secondary', icon: '🌐' },
                ].map((item, index) => {
                  const total = stats.total_devices || 1;
                  const pct = Math.round((item.count / total) * 100) || 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-primary flex items-center gap-2">
                          <span>{item.icon}</span> {item.name}
                        </span>
                        <span className="font-semibold text-text-primary">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full ${item.pctColor} rounded-full`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Broadcasts */}
          <div className="xl:col-span-8 bg-bg-glass border border-border-color rounded-2xl p-6 shadow-md overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border-color mb-5">
              <h3 className="text-base font-semibold text-text-primary font-display">Recent Push Broadcast Logs</h3>
              <Clock size={18} className="text-accent-primary" />
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-border-color bg-bg-glass/30">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white/[0.01]">
                    <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider">Title / Subject</th>
                    <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider">Target</th>
                    <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider">Sender</th>
                    <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider text-center">Sent</th>
                    <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider text-center">Failed</th>
                    <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider text-center">Rate</th>
                    <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider">Broadcast Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border-color last:border-b-0">
                        <td colSpan="7" className="p-4">
                          <div className="h-4 bg-white/5 rounded-sm animate-pulse w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : recentNotifications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center p-8 text-text-muted text-sm">
                        No push logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentNotifications.map((n) => {
                      const total = (n.success_count ?? 0) + (n.failure_count ?? 0);
                      const rate = total > 0 ? Math.round((n.success_count / total) * 100) : 100;
                      return (
                        <tr key={n.id} className="border-b border-border-color last:border-b-0 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-semibold text-text-primary max-w-[200px] truncate">{n.title}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              n.target === 'all' 
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                : n.target === 'subscribers' 
                                ? 'bg-success-bg text-success border-success/20' 
                                : 'bg-warning-bg text-warning border-warning/20'
                            } capitalize`}>
                              {n.target || '—'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-text-secondary">{n.sender?.name || 'System / Admin'}</td>
                          <td className="p-4 text-center text-success font-semibold">{n.success_count}</td>
                          <td className={`p-4 text-center font-semibold ${n.failure_count > 0 ? 'text-danger' : 'text-text-muted'}`}>
                            {n.failure_count}
                          </td>
                          <td className="p-4 text-center text-sm font-medium text-text-primary">{rate}%</td>
                          <td className="p-4 text-xs text-text-muted">
                            {new Date(n.created_at).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ──── AUTHOR VIEW ────
  const renderAuthorDashboard = () => {
    const delivery = stats.delivery || { sent: 0, failed: 0, success_rate: 100 };

    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary font-display">
            Welcome back, {user?.name || 'Content Creator'}!
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Publish posts and broadcast automatic push updates to your subscribers.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="My Published Posts"
            value={stats.total_posts ?? 0}
            icon={FileText}
            color="primary"
            loading={loading}
          />
          <StatsCard
            title="My Channel Subscribers"
            value={stats.total_subscribers ?? 0}
            icon={UserCheck}
            color="success"
            loading={loading}
          />
          <StatsCard
            title="Campaigns Triggered"
            value={stats.total_notifications ?? 0}
            icon={Send}
            color="secondary"
            loading={loading}
          />
          <StatsCard
            title="Delivery Success Rate"
            value={`${delivery.success_rate}%`}
            icon={CheckCircle2}
            color="warning"
            trend={`${delivery.sent} sent, ${delivery.failed} failed`}
            trendUp={delivery.success_rate >= 90}
            trendLabel="total attempts"
            loading={loading}
          />
        </div>

        {/* Recent Notifications Table */}
        <div className="bg-bg-glass border border-border-color rounded-2xl p-6 shadow-md overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-border-color mb-5">
            <h3 className="text-base font-semibold text-text-primary font-display">My Recent Dispatch Actions</h3>
            <Clock size={18} className="text-accent-primary" />
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-border-color bg-bg-glass/30">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider">Title / Subject</th>
                  <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider">Target</th>
                  <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider text-center">Sent</th>
                  <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider text-center">Failed</th>
                  <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider text-center">Success Rate</th>
                  <th className="p-4 text-xs font-semibold uppercase text-text-secondary border-b border-border-color tracking-wider">Broadcast Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border-color last:border-b-0">
                      <td colSpan="6" className="p-4">
                        <div className="h-4 bg-white/5 rounded-sm animate-pulse w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : recentNotifications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-text-muted text-sm">
                      No notifications broadcasted yet. Create a post to notify subscribers!
                    </td>
                  </tr>
                ) : (
                  recentNotifications.map((n) => {
                    const total = (n.success_count ?? 0) + (n.failure_count ?? 0);
                    const rate = total > 0 ? Math.round((n.success_count / total) * 100) : 100;
                    return (
                      <tr key={n.id} className="border-b border-border-color last:border-b-0 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-semibold text-text-primary max-w-[250px] truncate">{n.title}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            n.target === 'all' 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                              : n.target === 'subscribers' 
                              ? 'bg-success-bg text-success border-success/20' 
                              : 'bg-warning-bg text-warning border-warning/20'
                          } capitalize`}>
                            {n.target || '—'}
                          </span>
                        </td>
                        <td className="p-4 text-center text-success font-semibold">{n.success_count}</td>
                        <td className={`p-4 text-center font-semibold ${n.failure_count > 0 ? 'text-danger' : 'text-text-muted'}`}>
                          {n.failure_count}
                        </td>
                        <td className="p-4 text-center text-sm font-medium text-text-primary">{rate}%</td>
                        <td className="p-4 text-xs text-text-muted">
                          {new Date(n.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ──── READER VIEW ────
  const renderReaderDashboard = () => {
    const readerStats = statsData || { subscribed_authors: 0, registered_devices: 0 };

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary font-display">
            Welcome to AetherNotify, {user?.name || 'User'}!
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Your account is currently set to the <span className="font-semibold text-accent-primary-hover">Reader</span> role.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          <StatsCard
            title="Subscribed Authors"
            value={readerStats.subscribed_authors ?? 0}
            icon={UserCheck}
            color="primary"
            loading={loading}
          />
          <StatsCard
            title="My Registered Devices"
            value={readerStats.registered_devices ?? 0}
            icon={Smartphone}
            color="success"
            loading={loading}
          />
        </div>

        <div className="bg-bg-glass border border-border-color rounded-2xl p-6 shadow-md max-w-2xl">
          <h3 className="text-lg font-semibold text-text-primary font-display mb-3">Push Notifications Console Access</h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            Readers receive push notifications on registered devices when subscribed authors publish content. 
            Administrative controls (managing posts, broadcasting custom messages, and configuring queue settings) 
            are restricted to <span className="font-medium text-text-primary">Authors</span> and <span className="font-medium text-text-primary">Administrators</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-bg text-warning border border-warning/20">
              Reader View
            </span>
            <span className="text-xs text-text-muted">
              Contact your system administrator if you require content writer privileges.
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !statsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-10 h-10 border-3 border-white/5 border-t-accent-primary rounded-full animate-spin"></div>
        <p className="text-text-secondary text-sm">Loading console insights...</p>
      </div>
    );
  }

  if (role === 'admin') return renderAdminDashboard();
  if (role === 'author') return renderAuthorDashboard();
  return renderReaderDashboard();
};

export default DashboardPage;
