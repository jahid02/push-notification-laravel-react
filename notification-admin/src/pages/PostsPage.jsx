import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { Plus, Trash2, Pencil, Eye, FileImage, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

const PostsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: itemsPerPage };
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/posts', { params });
      if (response.data?.success) {
        const payload = response.data.data;
        setPosts(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  useEffect(() => { fetchPosts(); }, [currentPage, searchTerm]);

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const response = await api.delete(`/posts/${postId}`);
      if (response.data?.success) {
        toast.success(response.data.message || 'Post deleted successfully.');
        fetchPosts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  const isAdmin = user?.role === 'admin';

  const headers = [
    { key: 'id', label: 'ID', skeletonWidth: '20px' },
    {
      key: 'title',
      label: 'Post Title',
      skeletonWidth: '150px',
      render: (val) => <span className="font-semibold text-text-primary">{val}</span>
    },
    {
      key: 'body',
      label: 'Body Content Preview',
      skeletonWidth: '240px',
      render: (val) => {
        const plain = (val || '').replace(/<[^>]+>/g, '');
        return plain.length > 80 ? `${plain.substring(0, 80)}...` : plain;
      }
    },
    {
      key: 'status',
      label: 'Status',
      skeletonWidth: '70px',
      align: 'center',
      render: (val) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
          val === 'restricted'
            ? 'bg-danger/10 text-danger border-danger/20'
            : 'bg-success/10 text-success border-success/20'
        }`}>
          {val === 'restricted' && <ShieldOff size={10} />}
          {val || 'active'}
        </span>
      )
    },
    {
      key: 'image_url',
      label: 'Media',
      skeletonWidth: '40px',
      align: 'center',
      render: (val) => val ? (
        <a href={val} target="_blank" rel="noreferrer" className="flex justify-center">
          <img src={val} alt="Preview" className="w-9 h-9 object-cover rounded-md border border-border-color" />
        </a>
      ) : (
        <div className="flex justify-center"><FileImage size={18} className="text-text-muted" /></div>
      )
    },
    {
      key: 'author',
      label: 'Author',
      skeletonWidth: '100px',
      render: (val) => val?.name || 'System / Admin'
    },
    {
      key: 'created_at',
      label: 'Publish Date',
      skeletonWidth: '90px',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      skeletonWidth: '80px',
      render: (_, row) => {
        const canEdit   = isAdmin || row.author_id === user?.id;
        const canDelete = isAdmin || row.author_id === user?.id;

        if (!canEdit && !canDelete) {
          return <span className="text-text-muted text-xs font-medium">Restricted</span>;
        }

        return (
          <div className="flex items-center gap-1.5 justify-end">
            {/* Admin: View detail page */}
            {isAdmin && (
              <button
                className="inline-flex items-center justify-center p-2 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-colors cursor-pointer"
                onClick={() => navigate(`/posts/${row.id}`)}
                title="View Post Detail"
              >
                <Eye size={14} />
              </button>
            )}
            {/* Edit button */}
            {canEdit && (
              <button
                className="inline-flex items-center justify-center p-2 rounded-lg bg-warning/10 text-warning border border-warning/20 hover:bg-warning hover:text-white hover:border-warning transition-colors cursor-pointer"
                onClick={() => navigate(`/posts/${row.id}/edit`)}
                title="Edit Post"
              >
                <Pencil size={14} />
              </button>
            )}
            {/* Delete button */}
            {canDelete && (
              <button
                className="inline-flex items-center justify-center p-2 rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white hover:border-danger transition-colors cursor-pointer"
                onClick={() => handleDeletePost(row.id)}
                title="Delete Post"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  const toolbarActions = (
    <button
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white font-semibold text-sm rounded-xl hover:-translate-y-0.5 hover:shadow-lg focus:outline-none transition-all cursor-pointer"
      onClick={() => navigate('/posts/create')}
    >
      <Plus size={16} />
      <span>Create New Post</span>
    </button>
  );

  return (
    <div>
      <DataTable
        headers={headers}
        data={posts}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search posts by title or body..."
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        actions={toolbarActions}
      />
    </div>
  );
};

export default PostsPage;
