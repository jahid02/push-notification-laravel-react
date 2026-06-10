import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import api from '../api/axios';
import { Save, X, FileText, Image, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editor = useRef(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const joditConfig = {
    readonly: false,
    height: 400,
    theme: 'default',
    style: {
      background: '#ffffff',
      color: '#000000',
    },
    toolbar: true,
    toolbarSticky: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', '|',
      'paragraph', '|',
      'link', 'image', '|',
      'undo', 'redo', '|',
      'source',
    ],
  };

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/posts/${id}`);
        if (response.data?.success) {
          const p = response.data.data.post;
          setTitle(p.title || '');
          setBody(p.body || '');
          setImageUrl(p.image_url || '');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load post for editing.');
        navigate('/posts');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = {};
    if (!title.trim()) validationErrors.title = 'Post title is required.';
    if (!body.trim()) validationErrors.body = 'Post body content is required.';
    if (imageUrl.trim() && !imageUrl.startsWith('http')) {
      validationErrors.image_url = 'Please provide a valid HTTP/HTTPS media URL.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/posts/${id}`, {
        title,
        body,
        image_url: imageUrl || null,
      });
      if (response.data?.success) {
        toast.success('Post updated successfully.');
        navigate('/posts');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        const formatted = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          formatted[key] = err.response.data.errors[key][0];
        });
        setErrors(formatted);
      }
      toast.error(err.response?.data?.message || 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 size={32} className="text-accent-primary animate-spin" />
        <p className="text-text-secondary text-sm">Loading post...</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-glass border border-border-color rounded-2xl p-8 max-w-4xl mx-auto shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-color mb-6 gap-2">
        <h3 className="text-lg font-semibold text-text-primary font-display">Edit Post</h3>
        <span className="text-xs text-text-muted">
          Update post content — subscribers will not be re-notified
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Post Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary" htmlFor="edit-post-title">Post Title</label>
          <div className="relative">
            <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              id="edit-post-title"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
              placeholder="Enter post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>
          {errors.title && <span className="text-xs text-danger font-medium">{errors.title}</span>}
        </div>

        {/* Image URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary" htmlFor="edit-image-url">Image Attachment URL (Optional)</label>
          <div className="relative">
            <Image size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              id="edit-image-url"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={saving}
            />
          </div>
          {errors.image_url && <span className="text-xs text-danger font-medium">{errors.image_url}</span>}
        </div>

        {/* Rich Text Body */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Post Body Content</label>
          <div className="rounded-xl overflow-hidden border border-border-color">
            <JoditEditor
              ref={editor}
              value={body}
              config={joditConfig}
              onBlur={(newContent) => setBody(newContent)}
            />
          </div>
          {errors.body && <span className="text-xs text-danger font-medium">{errors.body}</span>}
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 justify-end mt-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-border-color text-text-primary font-semibold text-sm rounded-xl hover:bg-bg-surface-hover hover:border-border-light transition-all cursor-pointer"
            onClick={() => navigate('/posts')}
            disabled={saving}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white font-semibold text-sm rounded-xl hover:-translate-y-0.5 hover:shadow-lg focus:outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPostPage;
