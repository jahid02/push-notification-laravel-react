import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Search, ChevronLeft, ChevronRight, Inbox, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const FeedPage = () => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribedOnly, setSubscribedOnly] = useState(false);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        subscribed: subscribedOnly ? 1 : 0,
      };
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/feed', { params });
      if (response.data?.success) {
        const payload = response.data.data;
        setPosts(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load posts feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, subscribedOnly]);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchTerm, subscribedOnly]);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalItems);

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header section */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary font-display">
          Posts Feed
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Stay updated with articles, tutorials, and columns published by your authors.
        </p>
      </div>

      {/* Toolbar - Search & Feed Toggles */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-bg-glass border border-border-color rounded-2xl p-4 shadow-sm">
        {/* Toggle tabs */}
        <div className="flex bg-white/[0.04] p-1 rounded-xl border border-border-color max-w-sm w-full">
          <button
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              !subscribedOnly ? 'bg-accent-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setSubscribedOnly(false)}
          >
            All Published
          </button>
          <button
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              subscribedOnly ? 'bg-accent-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setSubscribedOnly(true)}
          >
            Subscribed Feed
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
            placeholder="Search feed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Feed Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-bg-glass border border-border-color rounded-2xl p-6 shadow-md flex flex-col space-y-4">
              <div className="h-4 w-1/4 rounded bg-white/5 animate-pulse"></div>
              <div className="h-6 w-3/4 rounded bg-white/5 animate-pulse"></div>
              <div className="h-16 w-full rounded bg-white/5 animate-pulse"></div>
              <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse"></div>
              <div className="h-10 w-full rounded bg-white/5 animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-bg-glass border border-border-color rounded-2xl p-12 text-center shadow-md flex flex-col items-center justify-center gap-2 mt-2">
          <Inbox size={48} className="text-text-muted mb-2" />
          <p className="text-text-secondary font-semibold text-base">No posts found</p>
          <p className="text-text-muted text-xs">
            {subscribedOnly
              ? 'You have not subscribed to any author channels yet or they have not published.'
              : 'No posts are currently published in the system.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-bg-glass border border-border-color hover:border-accent-primary/25 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {post.image_url && (
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}

              {/* Restriction indicator */}
              {post.status === 'restricted' && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-danger/10 text-danger border border-danger/20">
                  Restricted
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  <Calendar size={12} className="text-accent-secondary" />
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>

                <h3 className="font-bold text-text-primary text-base tracking-tight line-clamp-1 group-hover:text-accent-primary transition-colors">
                  {post.title}
                </h3>

                {/* Strip HTML tags for preview snippet */}
                <p className="text-text-secondary text-xs leading-relaxed line-clamp-3">
                  {post.body?.replace(/<[^>]+>/g, '') || ''}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-border-color flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-bold text-white text-[10px] font-display shrink-0">
                    {getInitials(post.author?.name)}
                  </div>
                  <span className="text-xs font-semibold text-text-secondary truncate">
                    {post.author?.name || 'Deleted Author'}
                  </span>
                </div>

                {/* Navigate to full page instead of modal */}
                <button
                  onClick={() => navigate(`/feed/${post.id}`)}
                  className="py-1.5 px-3.5 bg-white/[0.03] border border-border-color rounded-xl text-[10px] font-bold text-text-primary cursor-pointer hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-all duration-150 active:scale-[0.98]"
                >
                  Read Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-bg-glass border border-border-color rounded-2xl p-4 shadow-sm text-sm text-text-secondary">
          <div>
            Showing <span className="font-semibold text-text-primary">{startEntry}</span> to{' '}
            <span className="font-semibold text-text-primary">{endEntry}</span> of{' '}
            <span className="font-semibold text-text-primary">{totalItems}</span> posts
          </div>

          <div className="flex items-center gap-1">
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-border-color text-text-secondary cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
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
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
