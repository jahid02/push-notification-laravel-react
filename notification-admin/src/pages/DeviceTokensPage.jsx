import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { Smartphone, Trash2, Monitor, TabletSmartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const PlatformBadge = ({ platform }) => {
  const cfg = {
    web:     { Icon: Monitor,          label: 'Web',     cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    android: { Icon: Smartphone,       label: 'Android', cls: 'bg-success/10 text-success border-success/20' },
    ios:     { Icon: TabletSmartphone, label: 'iOS',     cls: 'bg-warning-bg text-warning border-warning/20' },
  };
  const entry = cfg[platform] || { Icon: Smartphone, label: platform || 'Unknown', cls: 'bg-white/[0.05] text-text-muted border-border-color' };
  const { Icon, label, cls } = entry;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
};

const DeviceTokensPage = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: itemsPerPage };
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/device-tokens', { params });
      if (response.data?.success) {
        const payload = response.data.data;
        setTokens(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load device tokens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  useEffect(() => { fetchTokens(); }, [currentPage, searchTerm]);

  const handleDelete = async (tokenId) => {
    if (!confirm('Remove this device from the notification send list? It will no longer receive push notifications.')) return;
    try {
      const response = await api.delete(`/device-tokens/${tokenId}`);
      if (response.data?.success) {
        toast.success(response.data.message || 'Device removed successfully.');
        fetchTokens();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove device token.');
    }
  };

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
      key: 'user_name',
      label: 'User Name',
      skeletonWidth: '130px',
      render: (val) => <span className="font-semibold text-text-primary">{val || '—'}</span>
    },
    {
      key: 'user_email',
      label: 'Email',
      skeletonWidth: '170px',
      render: (val) => <span className="text-text-secondary text-xs">{val || '—'}</span>
    },
    {
      key: 'platform',
      label: 'Platform',
      skeletonWidth: '80px',
      render: (val) => <PlatformBadge platform={val} />
    },
    {
      key: 'device_name',
      label: 'Device Name',
      skeletonWidth: '120px',
      render: (val) => val || <span className="text-text-muted text-xs italic">Unknown</span>
    },
    {
      key: 'last_used_at',
      label: 'Last Used',
      skeletonWidth: '110px',
      render: (val) => val
        ? new Date(val).toLocaleString()
        : <span className="text-text-muted text-xs italic">Never</span>
    },
    {
      key: 'created_at',
      label: 'Registered At',
      skeletonWidth: '110px',
      render: (val) => new Date(val).toLocaleString()
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      skeletonWidth: '50px',
      render: (_, row) => (
        <button
          className="inline-flex items-center justify-center p-2 rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white hover:border-danger transition-colors cursor-pointer"
          onClick={() => handleDelete(row.id)}
          title="Remove device from notification list"
        >
          <Trash2 size={14} />
        </button>
      )
    }
  ];

  // Flatten tokens: extract user.name / user.email into top-level keys for DataTable
  const tableData = tokens.map(t => ({
    ...t,
    user_name:  t.user?.name  || '',
    user_email: t.user?.email || '',
  }));

  return (
    <div className="space-y-4">
      <div className="text-text-secondary text-sm">
        All registered FCM device tokens in the system. Removing a device will stop it from receiving push notifications.
      </div>

      <DataTable
        headers={headers}
        data={tableData}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by user name, email or device..."
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default DeviceTokensPage;
