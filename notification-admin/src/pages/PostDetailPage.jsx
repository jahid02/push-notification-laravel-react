import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import {
  ArrowLeft, Calendar, User, FileText, Loader2,
  AlertTriangle, ShieldOff, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin restriction form
  const [showRestrict, setShowRestrict] = useState(false);
  const [restrictReason, setRestrictReason] = useState('');
  const [restricting, setRestricting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/posts/${id}`);
      if (response.data?.success) {
        setPost(response.data.data.post);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load post.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
  };

  const handleRestrict = async () => {
    setRestricting(true);
    try {
      const response = await api.post(`/posts/${id}/restrict`, {
        status: 'restricted',
        restriction_reason: restrictReason,
      });
      if (response.data?.success) {
        toast.success('Post restricted successfully.');
        setPost(response.data.data.post);
        setShowRestrict(false);
        setRestrictReason('');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to restrict post.');
    } finally {
      setRestricting(false);
    }
  };

  const handleLift = async () => {
    setRestricting(true);
    try {
      const response = await api.post(`/posts/${id}/restrict`, {
        status: 'active',
      });
      if (response.data?.success) {
        toast.success('Restriction lifted.');
        setPost(response.data.data.post);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to lift restriction.');
    } finally {
      setRestricting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 size={36} className="text-accent-primary animate-spin" />
        <p className="text-text-secondary text-sm">Loading article...</p>
      </div>
    );
  }

  if (!post) return null;

  const isRestricted = post.status === 'restricted';

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-text-secondary text-sm hover:text-text-primary transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* Restriction Banner (for all roles if restricted) */}
      {isRestricted && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger">
          <ShieldOff size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">This post has been restricted by an administrator.</p>
            {post.restriction_reason && (
              <p className="text-xs mt-1 text-danger/80">{post.restriction_reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Article Card */}
      <div className="bg-bg-glass border border-border-color rounded-2xl shadow-lg overflow-hidden">
        {/* Cover Image */}
        {post.image_url && (
          <div className="w-full h-56 md:h-72 overflow-hidden">
            <img
              src={post.image_url}
              alt="Article cover"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        <div className="p-6 md:p-8 space-y-6">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-text-primary leading-tight">
            {post.title}
          </h1>

          {/* Author & Date row */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-white/[0.02] border border-border-color rounded-xl text-xs text-text-secondary">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-bold text-white font-display text-sm shadow-sm">
                {getInitials(post.author?.name)}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-text-primary">{post.author?.name || 'Deleted Author'}</span>
                <span className="text-[10px] text-text-muted">{post.author?.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-text-muted">
              <Calendar size={13} className="text-accent-secondary" />
              <span>{new Date(post.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Body — supports rich HTML from jodit-react */}
          <div
            className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed"
            style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </div>
      </div>

      {/* Admin Restriction Controls */}
      {isAdmin && (
        <div className="bg-bg-glass border border-border-color rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-accent-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Admin Controls</h3>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isRestricted
                ? 'bg-danger/10 text-danger border-danger/20'
                : 'bg-success/10 text-success border-success/20'
            }`}>
              {isRestricted ? 'Restricted' : 'Active'}
            </span>
          </div>

          {isRestricted ? (
            <button
              onClick={handleLift}
              disabled={restricting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 text-success text-sm font-semibold rounded-xl hover:bg-success hover:text-white hover:border-success transition-all cursor-pointer disabled:opacity-60"
            >
              <Shield size={15} />
              {restricting ? 'Processing...' : 'Lift Restriction'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowRestrict(!showRestrict)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-danger/10 border border-danger/20 text-danger text-sm font-semibold rounded-xl hover:bg-danger hover:text-white hover:border-danger transition-all cursor-pointer"
              >
                <ShieldOff size={15} />
                Restrict Post
              </button>

              {showRestrict && (
                <div className="space-y-3 border-t border-border-color pt-4">
                  <label className="text-xs font-medium text-text-secondary block">
                    Restriction Reason (shown to author)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all focus:border-accent-primary focus:shadow-[0_0_10px_rgba(139,92,246,0.15)] min-h-[90px] resize-y"
                    placeholder="Describe why this post is being restricted..."
                    value={restrictReason}
                    onChange={(e) => setRestrictReason(e.target.value)}
                    disabled={restricting}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRestrict}
                      disabled={restricting || !restrictReason.trim()}
                      className="px-4 py-2 bg-danger text-white text-sm font-semibold rounded-xl hover:bg-danger/80 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {restricting ? 'Restricting...' : 'Confirm Restrict'}
                    </button>
                    <button
                      onClick={() => { setShowRestrict(false); setRestrictReason(''); }}
                      className="px-4 py-2 bg-white/[0.05] border border-border-color text-text-primary text-sm font-semibold rounded-xl hover:bg-bg-surface-hover transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostDetailPage;
