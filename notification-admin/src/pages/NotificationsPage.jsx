import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, 
  History, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  // Navigation Tabs — 'send' tab only available for admin
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'send'
  
  // Logs Table States
  const [notifications, setNotifications] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Selected Notification Detail Panel/Modal
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Send Custom Notification Form States
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [target, setTarget] = useState('all'); // all, subscribers, specific_users
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Search Users directory (for target = specific_users)
  const [usersDirectory, setUsersDirectory] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load notifications logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
      };
      const response = await api.get('/notifications', { params });
      if (response.data && response.data.success) {
        const payload = response.data.data;
        setNotifications(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notification dispatch logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Load users directory for multi-select
  const fetchUsersForSelect = async () => {
    setLoadingUsers(true);
    try {
      const params = { per_page: 50 };
      if (searchUserQuery) params.search = searchUserQuery;
      
      const response = await api.get('/users', { params });
      if (response.data && response.data.success) {
        const list = response.data.data.data || [];
        setUsersDirectory(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    if (target === 'specific_users') {
      fetchUsersForSelect();
    }
  }, [target, searchUserQuery]);

  const handleToggleUserSelect = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSending(true);

    const errors = {};
    if (!title.trim()) errors.title = 'Title is required.';
    if (!body.trim()) errors.body = 'Message body content is required.';
    if (imageUrl.trim() && !imageUrl.startsWith('http')) {
      errors.image_url = 'Please enter a valid HTTP/HTTPS URL.';
    }
    if (target === 'specific_users' && selectedUserIds.length === 0) {
      errors.user_ids = 'Please select at least one recipient user.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSending(false);
      return;
    }

    try {
      const payload = {
        title,
        body,
        image_url: imageUrl || null,
        target,
        user_ids: target === 'specific_users' ? selectedUserIds : undefined,
      };

      const response = await api.post('/notifications', payload);
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Custom push notification dispatched to queue!');
        setTitle('');
        setBody('');
        setImageUrl('');
        setTarget('all');
        setSelectedUserIds([]);
        setActiveTab('logs');
      }
    } catch (err) {
      console.error(err);
      if (err.errors) {
        const formatted = {};
        Object.keys(err.errors).forEach(key => {
          formatted[key] = err.errors[key][0];
        });
        setFormErrors(formatted);
      }
      toast.error(err.message || 'Failed to dispatch custom notification.');
    } finally {
      setSending(false);
    }
  };

  const headers = [
    { key: 'id', label: '#SL', skeletonWidth: '40px', render: (_, _row, rowIndex) => <span className="text-text-muted font-medium">{(currentPage - 1) * itemsPerPage + rowIndex + 1}</span> },
    { 
      key: 'title', 
      label: 'Notification Title', 
      skeletonWidth: '150px',
      render: (val) => <span className="font-semibold text-text-primary">{val}</span>
    },
    { 
      key: 'target', 
      label: 'Target Group', 
      skeletonWidth: '80px',
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${
          val === 'all' 
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
            : val === 'subscribers' 
            ? 'bg-success-bg text-success border-success/20' 
            : 'bg-warning-bg text-warning border-warning/20'
        }`}>
          {val}
        </span>
      )
    },
    { 
      key: 'success_count', 
      label: 'Sent', 
      align: 'center', 
      skeletonWidth: '30px',
      render: (val) => <span className="text-success font-semibold">{val}</span>
    },
    { 
      key: 'failure_count', 
      label: 'Failed', 
      align: 'center', 
      skeletonWidth: '30px',
      render: (val) => <span className={`font-semibold ${val > 0 ? 'text-danger' : 'text-text-muted'}`}>{val}</span>
    },
    { 
      key: 'success_rate', 
      label: 'Success Rate', 
      skeletonWidth: '50px',
      render: (_, row) => {
        const total = (row.success_count ?? 0) + (row.failure_count ?? 0);
        const rate = total > 0 ? Math.round((row.success_count / total) * 100) : 100;
        return (
          <div className="flex items-center gap-2">
            <div className="w-9 h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${rate >= 90 ? 'bg-success' : 'bg-warning'}`} 
                style={{ width: `${rate}%` }}
              ></div>
            </div>
            <span>{rate}%</span>
          </div>
        );
      }
    },
    { 
      key: 'sender', 
      label: 'Sender', 
      skeletonWidth: '80px',
      render: (val) => val?.name || 'System / Admin' 
    },
    { 
      key: 'created_at', 
      label: 'Dispatched At', 
      skeletonWidth: '100px',
      render: (val) => new Date(val).toLocaleString() 
    },
    {
      key: 'actions',
      label: 'Details',
      align: 'right',
      skeletonWidth: '30px',
      render: (_, row) => (
        <button
          className="inline-flex items-center justify-center p-2 rounded-lg bg-white/[0.03] border border-border-color text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light"
          onClick={() => setSelectedNotification(row)}
          title="View Delivery Details"
        >
          <Eye size={14} />
        </button>
      )
    }
  ];

  return (
    <div>
      {/* Dynamic Tab Switcher */}
      <div className="flex gap-4 mb-6 border-b border-border-color pb-2">
        <button
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-150 ${
            activeTab === 'logs' 
              ? 'bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white shadow-md shadow-accent-primary/20' 
              : 'bg-white/[0.05] border border-border-color text-text-primary hover:bg-bg-surface-hover hover:border-border-light'
          }`}
          onClick={() => {
            setActiveTab('logs');
            setSelectedNotification(null);
          }}
        >
          <History size={16} />
          <span>Broadcast Log History</span>
        </button>
        {/* Only admins can dispatch custom push */}
        {isAdmin && (
        <button
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-150 ${
            activeTab === 'send' 
              ? 'bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white shadow-md shadow-accent-primary/20' 
              : 'bg-white/[0.05] border border-border-color text-text-primary hover:bg-bg-surface-hover hover:border-border-light'
          }`}
          onClick={() => {
            setActiveTab('send');
            setSelectedNotification(null);
          }}
        >
          <Send size={16} />
          <span>Dispatch Custom Push</span>
        </button>
        )}
      </div>

      {activeTab === 'logs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all duration-300">
          
          {/* Main Table view */}
          <div className={selectedNotification ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <DataTable
              headers={headers}
              data={notifications}
              loading={loadingLogs}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Details Sidebar Pane */}
          {selectedNotification && (
            <div className="lg:col-span-4 bg-bg-glass border border-border-color rounded-2xl p-6 h-fit animate-fadeIn space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-color mb-1">
                <h4 className="text-base font-semibold text-text-primary font-display">Delivery Details</h4>
                <button 
                  className="px-2 py-1 bg-white/[0.05] border border-border-color text-text-primary text-xs font-semibold rounded-lg hover:bg-bg-surface-hover hover:border-border-light transition-colors"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs font-medium text-text-secondary block">Title</label>
                  <div className="font-semibold text-text-primary mt-1">
                    {selectedNotification.title}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block">Message Body</label>
                  <p className="text-text-secondary mt-1 leading-relaxed bg-white/[0.01] border border-border-color p-3 rounded-xl">
                    {selectedNotification.body}
                  </p>
                </div>

                {selectedNotification.image_url && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">Image Attachment</label>
                    <img 
                      src={selectedNotification.image_url} 
                      alt="Attachment" 
                      className="w-full h-36 object-cover rounded-xl border border-border-color" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 border-t border-border-color pt-4">
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.02] border border-border-color">
                    <span className="text-xs text-text-muted">Sent Success</span>
                    <span className="text-xl font-bold text-success flex items-center gap-1">
                      <CheckCircle2 size={16} /> {selectedNotification.success_count}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.02] border border-border-color">
                    <span className="text-xs text-text-muted">Sent Failed</span>
                    <span className={`text-xl font-bold flex items-center gap-1 ${
                      selectedNotification.failure_count > 0 ? 'text-danger' : 'text-text-muted'
                    }`}>
                      <AlertCircle size={16} /> {selectedNotification.failure_count}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-medium text-text-secondary block">Sender Name</label>
                  <div className="text-text-primary mt-1">
                    {selectedNotification.sender?.name || 'System / Admin'}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Send Notification Form Panel */
        <div className="bg-bg-glass border border-border-color rounded-2xl p-8 max-w-3xl mx-auto shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-color mb-6 gap-2">
            <h3 className="text-lg font-semibold text-text-primary font-display">Broadcast Custom Push Notification</h3>
            <span className="text-xs text-text-muted">
              Direct FCM broadcast console bypasses automatic model triggers
            </span>
          </div>

          <form onSubmit={handleSendNotification} className="flex flex-col gap-5">
            
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary" htmlFor="push-title">Push Subject Title</label>
              <input
                id="push-title"
                type="text"
                className="w-full px-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                placeholder="Alert: Security patch updates or hot topic alerts..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={sending}
              />
              {formErrors.title && (
                <span className="text-xs text-danger font-medium">{formErrors.title}</span>
              )}
            </div>

            {/* Media Attachment URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary" htmlFor="push-image">Push Image Icon URL (Optional)</label>
              <input
                id="push-image"
                type="text"
                className="w-full px-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                placeholder="https://example.com/assets/banner.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={sending}
              />
              {formErrors.image_url && (
                <span className="text-xs text-danger font-medium">{formErrors.image_url}</span>
              )}
            </div>

            {/* Target Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary" htmlFor="push-target">Audience Distribution Target</label>
              <select
                id="push-target"
                className="w-full px-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)] cursor-pointer pr-10 appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_24_24%22_stroke=%22%239ca3af%22%3E%3Cpath_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%222%22_d=%22M19_9l-7_7-7-7%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[size:1.25rem]"
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value);
                  setSelectedUserIds([]);
                }}
                disabled={sending}
              >
                <option value="all" className="bg-bg-surface">Broadcast globally (all users)</option>
                <option value="subscribers" className="bg-bg-surface">Broadcasting to channel subscribers only</option>
                <option value="specific_users" className="bg-bg-surface">Target specific users (multi-selection)</option>
              </select>
            </div>

            {/* Target User List (visible only when specific_users is selected) */}
            {target === 'specific_users' && (
              <div className="bg-black/20 p-4 border border-dashed border-border-color rounded-xl space-y-3">
                <label className="text-sm font-medium text-text-secondary flex justify-between items-center">
                  <span>Select Recipient Users ({selectedUserIds.length} chosen)</span>
                  {formErrors.user_ids && (
                    <span className="text-xs text-danger font-medium">{formErrors.user_ids}</span>
                  )}
                </label>
                
                {/* Search select tool */}
                <div className="relative w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-border-color rounded-lg text-text-primary text-xs outline-none focus:border-accent-primary"
                    placeholder="Search users to filter lists..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    disabled={sending}
                  />
                </div>

                <div className="max-h-[180px] overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {loadingUsers && usersDirectory.length === 0 ? (
                    <div className="text-xs text-text-muted p-2">Filtering directory...</div>
                  ) : usersDirectory.length === 0 ? (
                    <div className="text-xs text-text-muted p-2">No users match filter.</div>
                  ) : (
                    usersDirectory.map(user => {
                      const isSelected = selectedUserIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => !sending && handleToggleUserSelect(user.id)}
                          className={`flex items-center gap-3 px-3 py-2 bg-transparent border rounded-lg cursor-pointer transition-all duration-150 ${
                            isSelected 
                              ? 'bg-accent-primary/8 border-border-glow' 
                              : 'border-border-color hover:bg-white/[0.02]'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-accent-primary" />
                          ) : (
                            <Square size={16} className="text-text-muted" />
                          )}
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-text-primary">{user.name}</span>
                            <span className="text-text-muted text-[10px]">{user.email} | Role: {user.role}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Message Body */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary" htmlFor="push-body">Message Body Text</label>
              <textarea
                id="push-body"
                className="w-full px-4 py-3 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)] min-h-[120px] resize-y"
                placeholder="Alert description details..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending}
              />
              {formErrors.body && (
                <span className="text-xs text-danger font-medium">{formErrors.body}</span>
              )}
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                className="px-4 py-2.5 bg-white/[0.05] border border-border-color text-text-primary font-semibold text-sm rounded-xl hover:bg-bg-surface-hover hover:border-border-light transition-all cursor-pointer"
                disabled={sending}
                onClick={() => {
                  setActiveTab('logs');
                  setTitle('');
                  setBody('');
                  setImageUrl('');
                  setTarget('all');
                  setSelectedUserIds([]);
                }}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white font-semibold text-sm rounded-xl hover:-translate-y-0.5 hover:shadow-lg focus:outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={sending}
              >
                <Send size={16} />
                <span>{sending ? 'Sending Push Campaigns...' : 'Dispatch Now'}</span>
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
