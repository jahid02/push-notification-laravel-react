import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Users, UserPlus, UserMinus, ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthorsPage = () => {
  const [authors, setAuthors] = useState([]);
  const [subscribedIds, setSubscribedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const params = {
        role: 'author',
        page: currentPage,
        per_page: itemsPerPage,
      };
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/authors', { params });
      if (response.data && response.data.success) {
        const payload = response.data.data;
        setAuthors(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load authors directory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions', { params: { per_page: 100 } });
      if (response.data && response.data.success) {
        const ids = response.data.data.data.map(sub => sub.author_id);
        setSubscribedIds(ids);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchAuthors();
  }, [currentPage, searchTerm]);

  const handleToggleSubscribe = async (authorId, isSubscribed) => {
    setActionLoading(prev => ({ ...prev, [authorId]: true }));
    try {
      if (isSubscribed) {
        const response = await api.post('/subscriptions/unsubscribe', { author_id: authorId });
        if (response.data && response.data.success) {
          toast.success(response.data.message || 'Unsubscribed successfully.');
          setSubscribedIds(prev => prev.filter(id => id !== authorId));
          setAuthors(prev => prev.map(a => a.id === authorId ? { ...a, subscribers_count: Math.max(0, (a.subscribers_count || 0) - 1) } : a));
        }
      } else {
        const response = await api.post('/subscriptions/subscribe', { author_id: authorId });
        if (response.data && response.data.success) {
          toast.success(response.data.message || 'Subscribed successfully.');
          setSubscribedIds(prev => [...prev, authorId]);
          setAuthors(prev => prev.map(a => a.id === authorId ? { ...a, subscribers_count: (a.subscribers_count || 0) + 1 } : a));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update subscription status.');
    } finally {
      setActionLoading(prev => ({ ...prev, [authorId]: false }));
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary font-display">
          Authors Directory
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Browse content creators, check channel subscribers, and subscribe to receive real-time push notification alerts.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-bg-glass border border-border-color rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
            placeholder="Search authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-text-secondary font-medium">
          {totalItems} Available Author Channels
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-bg-glass border border-border-color rounded-2xl p-6 shadow-md flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_1.5s_infinite_linear]"></div>
              </div>
              <div className="h-5 w-2/3 rounded bg-white/5 relative overflow-hidden animate-pulse"></div>
              <div className="h-4 w-1/2 rounded bg-white/5 relative overflow-hidden animate-pulse"></div>
              <div className="h-10 w-full rounded bg-white/5 relative overflow-hidden animate-pulse"></div>
              <div className="h-9 w-full rounded bg-white/5 relative overflow-hidden animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : authors.length === 0 ? (
        <div className="bg-bg-glass border border-border-color rounded-2xl p-12 text-center shadow-md flex flex-col items-center justify-center gap-2">
          <Inbox size={48} className="text-text-muted mb-2" />
          <p className="text-text-secondary font-semibold text-base">No authors found</p>
          <p className="text-text-muted text-xs">
            Try adjusting your search query or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-5">
          {authors.map((author) => {
            const isSubscribed = subscribedIds.includes(author.id);
            const isBtnLoading = !!actionLoading[author.id];

            return (
              <div
                key={author.id}
                className="bg-bg-glass border border-border-color hover:border-accent-primary/25 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col relative group overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="flex flex-col items-center text-center flex-1 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-bold text-white text-lg font-display shadow-md">
                    {getInitials(author.name)}
                  </div>

                  <div>
                    <h4 className="font-bold text-text-primary text-base tracking-tight truncate max-w-full">
                      {author.name}
                    </h4>
                    <p className="text-text-muted text-xs mt-0.5 truncate max-w-full">
                      {author.email}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-border-color rounded-full text-xs font-semibold text-text-secondary">
                    <Users size={12} className="text-accent-secondary" />
                    <span>{author.subscribers_count ?? 0} {author.subscribers_count === 1 ? 'Subscriber' : 'Subscribers'}</span>
                  </div>

                  <p className="text-text-secondary text-xs leading-relaxed line-clamp-2 h-8 overflow-hidden w-full text-center mt-2 px-1">
                    {author.bio || 'This channel has not posted a profile biography yet.'}
                  </p>
                </div>

                <div className="mt-6">
                  {isSubscribed ? (
                    <button
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl border font-bold text-xs cursor-pointer transition-all duration-200 bg-accent-secondary/5 text-accent-secondary border-accent-secondary/15 hover:bg-danger hover:text-white hover:border-danger hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)] group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleToggleSubscribe(author.id, true)}
                      disabled={isBtnLoading}
                    >
                      {isBtnLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <>
                          <span className="group-hover/btn:hidden inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse"></span>
                            Subscribed
                          </span>
                          <span className="hidden group-hover/btn:inline-flex items-center gap-1.5">
                            <UserMinus size={13} />
                            Unsubscribe
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-accent-primary bg-accent-primary text-white font-bold text-xs cursor-pointer transition-all duration-200 hover:bg-accent-primary-hover hover:border-accent-primary-hover hover:shadow-[0_4px_12px_rgba(99,102,241,0.25)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleToggleSubscribe(author.id, false)}
                      disabled={isBtnLoading}
                    >
                      {isBtnLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Subscribe</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-bg-glass border border-border-color rounded-2xl p-4 shadow-sm text-sm text-text-secondary">
          <div>
            Showing <span className="font-semibold text-text-primary">{startEntry}</span> to{' '}
            <span className="font-semibold text-text-primary">{endEntry}</span> of{' '}
            <span className="font-semibold text-text-primary">{totalItems}</span> authors
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
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed ${page === currentPage ? 'bg-accent-primary text-white border-accent-primary hover:bg-accent-primary hover:text-white' : 'border-border-color'
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

export default AuthorsPage;
