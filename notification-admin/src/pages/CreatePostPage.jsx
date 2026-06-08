import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import api from '../api/axios';
import { Send, X, FileText, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const editor = useRef(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const joditConfig = {
    readonly: false,
    height: 400,
    theme: 'default',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const validationErrors = {};
    if (!title.trim()) validationErrors.title = 'Post title is required.';
    if (!body.trim()) validationErrors.body = 'Post body content is required.';
    if (imageUrl.trim() && !imageUrl.startsWith('http')) {
      validationErrors.image_url = 'Please provide a valid HTTP/HTTPS media URL.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title,
        body,
        image_url: imageUrl || null,
      };

      const response = await api.post('/posts', payload);
      if (response.data?.success) {
        toast.success('Post created! Subscribers will be notified.');
        navigate('/posts');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        const formattedErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          formattedErrors[key] = err.response.data.errors[key][0];
        });
        setErrors(formattedErrors);
      }
      toast.error(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-glass border border-border-color rounded-2xl p-8 max-w-4xl mx-auto shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-color mb-6 gap-2">
        <h3 className="text-lg font-semibold text-text-primary font-display">Create New Post</h3>
        <span className="text-xs text-text-muted">
          Publishing will trigger FCM push notifications to all your subscribers
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Post Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary" htmlFor="post-title">Post Title</label>
          <div className="relative">
            <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              id="post-title"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
              placeholder="Enter a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.title && <span className="text-xs text-danger font-medium">{errors.title}</span>}
        </div>

        {/* Image URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary" htmlFor="image-url">Image Attachment URL (Optional)</label>
          <div className="relative">
            <Image size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              id="image-url"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all duration-150 focus:border-accent-primary focus:bg-white/[0.05] focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={loading}
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
            disabled={loading}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white font-semibold text-sm rounded-xl hover:-translate-y-0.5 hover:shadow-lg focus:outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <Send size={16} />
            <span>{loading ? 'Publishing...' : 'Publish Post'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;
