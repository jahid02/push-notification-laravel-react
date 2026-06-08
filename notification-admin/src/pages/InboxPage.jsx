import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Bell, ChevronLeft, ChevronRight, Inbox, Calendar, ArrowRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const InboxPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
      };

      const response = await api.get('/notifications/inbox', { params });
      if (response.data && response.data.success) {
        const payload = response.data.data;
        setNotifications(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notification inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const handleNotificationClick = (recipientRecord) => {
    const notification = recipientRecord.notification;
    if (notification && notification.post_id) {
      // Navigate directly to the post detail page
      navigate(`/feed/${notification.post_id}`);
    } else {
      toast.success('System broadcast read.');
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate initials for sender avatar
  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header section */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary font-display">
          Notification Inbox
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          View alerts and push notifications delivered to your active user devices.
        </p>
      </div>

      {/* Inbox List container */}
      {loading ? (
        // Loading state
        <div className="bg-bg-glass border border-border-color rounded-2xl p-6 shadow-md space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-border-color last:border-none">
              <div className="w-10 h-10 rounded-full bg-white/5 relative overflow-hidden shrink-0 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded bg-white/5 relative overflow-hidden animate-pulse"></div>
                <div className="h-3 w-1/2 rounded bg-white/5 relative overflow-hidden animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        // Empty state
        <div className="bg-bg-glass border border-border-color rounded-2xl p-12 text-center shadow-md flex flex-col items-center justify-center gap-2">
          <Inbox size={48} className="text-text-muted mb-2" />
          <p className="text-text-secondary font-semibold text-base">Your inbox is clean</p>
          <p className="text-text-muted text-xs">
            No notifications have been broadcasted to your profile yet.
          </p>
        </div>
      ) : (
        // Inbox list
        <div className="bg-bg-glass border border-border-color rounded-2xl shadow-md overflow-hidden divide-y divide-border-color">
          {notifications.map((record) => {
            const notification = record.notification || {};
            const senderName = notification.sender?.name || 'System Broadcast';
            const hasPost = !!notification.post_id;
            
            return (
              <div
                key={record.id}
                onClick={() => handleNotificationClick(record)}
                className={`p-5 flex items-start gap-4 transition-all duration-150 cursor-pointer ${
                  hasPost 
                    ? 'hover:bg-bg-surface-hover/80 hover:shadow-[inset_3px_0_0_0_var(--accent-primary)]' 
                    : 'hover:bg-bg-surface-hover/50'
                }`}
              >
                {/* Sender Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-border-color flex items-center justify-center font-bold text-accent-secondary text-xs font-display shrink-0 shadow-sm">
                  {getInitials(senderName)}
                </div>

                {/* Notification Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-sm text-text-primary truncate">
                      {notification.title}
                    </span>
                    <span className="text-[10px] text-text-muted font-medium shrink-0 flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(record.created_at || record.sent_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                    {notification.body}
                  </p>

                  {/* Attachment Metadata Badge */}
                  {hasPost && (
                    <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent-primary-glow text-accent-primary-hover border border-accent-primary/10">
                      <FileText size={10} />
                      <span>Article Attached — Click to read</span>
                      <ArrowRight size={10} className="ml-0.5 animate-[pulse_1.5s_infinite]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-bg-glass border border-border-color rounded-2xl p-4 shadow-sm text-sm text-text-secondary">
          <div>
            Showing <span className="font-semibold text-text-primary">{startEntry}</span> to{' '}
            <span className="font-semibold text-text-primary">{endEntry}</span> of{' '}
            <span className="font-semibold text-text-primary">{totalItems}</span> alerts
          </div>
          
          <div className="flex items-center gap-1">
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-border-color text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed ${
                  page === currentPage ? 'bg-accent-primary text-white border-accent-primary hover:bg-accent-primary hover:text-white' : 'border-border-color'
                }`}
                disabled={page === '...'}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-border-color text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
