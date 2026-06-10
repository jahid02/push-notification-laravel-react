import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';

const SubscribersPage = () => {
  const { user } = useAuth();
  
  // State for Admin author selection
  const [authors, setAuthors] = useState([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState('');

  // Subscribers Table state
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  const isAdmin = user?.role === 'admin';

  const fetchAuthors = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'author', per_page: 50 } });
      if (response.data && response.data.success) {
        const list = response.data.data.data || [];
        setAuthors(list);
        if (list.length > 0) {
          setSelectedAuthorId(list[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve author directory.');
    }
  };

  const fetchSubscribers = async (authorId) => {
    if (!authorId) return;
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage
      };
      const response = await api.get(`/users/${authorId}/subscribers`, { params });
      if (response.data && response.data.success) {
        const payload = response.data.data;
        setSubscribers(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscriber list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAuthors();
    } else if (user?.id) {
      setSelectedAuthorId(user.id);
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    if (selectedAuthorId) {
      fetchSubscribers(selectedAuthorId);
    }
  }, [selectedAuthorId, currentPage]);

  const headers = [
    {
      key: 'sl',
      label: '#SL',
      skeletonWidth: '30px',
      render: (_, _row, rowIndex) => (
        <span className="text-text-muted font-medium">
          {(currentPage - 1) * itemsPerPage + rowIndex + 1}
        </span>
      )
    },
    { 
      key: 'reader_name',
      label: 'Reader Name', 
      skeletonWidth: '150px',
      render: (val) => <span className="font-semibold text-text-primary">{val || '—'}</span>
    },
    {
      key: 'reader_email',
      label: 'Email Address',
      skeletonWidth: '180px',
      render: (val) => <span className="text-text-secondary">{val || '—'}</span>
    },
    { 
      key: 'subscribed_at', 
      label: 'Subscription Date', 
      skeletonWidth: '140px',
      render: (val) => val ? new Date(val).toLocaleString() : 'N/A'
    }
  ];

  // Flatten subscription rows: extract reader info into top-level keys for DataTable
  const tableData = subscribers.map(sub => ({
    id:           sub.id,
    sl:           null,                        // unused — #SL uses rowIndex
    reader_name:  sub.reader?.name  ?? '—',
    reader_email: sub.reader?.email ?? '—',
    subscribed_at: sub.created_at,
  }));

  const authorFilterToolbar = isAdmin && authors.length > 0 ? (
    <div className="flex items-center gap-3">
      <label className="text-text-secondary text-xs font-medium">Select Author Channel:</label>
      <select
        value={selectedAuthorId}
        className="px-3 py-1.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-xs outline-none transition-all focus:border-accent-primary cursor-pointer"
        onChange={(e) => {
          setSelectedAuthorId(e.target.value);
          setCurrentPage(1);
        }}
      >
        {authors.map(a => (
          <option key={a.id} value={a.id} className="bg-bg-surface">{a.name} ({a.email})</option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="text-text-secondary text-sm">
        {isAdmin 
          ? 'Inspect active push subscribers for selected author channels.'
          : 'List of readers registered to receive push alerts when you publish new content.'
        }
      </div>

      <DataTable
        headers={headers}
        data={tableData}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        actions={authorFilterToolbar}
      />
    </div>
  );
};

export default SubscribersPage;
