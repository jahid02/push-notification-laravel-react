import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedRole) params.role = selectedRole;

      const response = await api.get('/users', { params });
      if (response.data && response.data.success) {
        const payload = response.data.data;
        setUsers(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, selectedRole]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await api.put(`/users/${userId}/role`, { role: newRole });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'User role updated successfully.');
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you absolutely sure you want to delete this user? This cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/users/${userId}`);
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'User deleted successfully.');
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  // Table columns definition
  const headers = [
    { key: 'id', label: 'ID', skeletonWidth: '20px' },
    { key: 'name', label: 'Full Name', skeletonWidth: '120px', render: (val) => (
      <span className="font-semibold text-text-primary">{val}</span>
    )},
    { key: 'email', label: 'Email Address', skeletonWidth: '160px' },
    { 
      key: 'role', 
      label: 'Role Status', 
      skeletonWidth: '80px',
      render: (role, row) => {
        if (!isAdmin || row.id === currentUser?.id) {
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${
              role === 'admin' 
                ? 'bg-danger/10 text-danger border-danger/20' 
                : role === 'author' 
                ? 'bg-warning-bg text-warning border-warning/20' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              {role}
            </span>
          );
        }
        return (
          <select
            value={role}
            className="w-[110px] px-2 py-1 bg-white/[0.03] border border-border-color rounded-lg text-text-primary text-xs outline-none focus:border-accent-primary transition-all cursor-pointer"
            onChange={(e) => handleRoleChange(row.id, e.target.value)}
          >
            <option value="reader" className="bg-bg-surface">Reader</option>
            <option value="author" className="bg-bg-surface">Author</option>
            <option value="admin" className="bg-bg-surface">Admin</option>
          </select>
        );
      }
    },
    { 
      key: 'created_at', 
      label: 'Joined Date', 
      skeletonWidth: '100px',
      render: (val) => new Date(val).toLocaleDateString() 
    },
  ];

  if (isAdmin) {
    headers.push({
      key: 'actions',
      label: 'Actions',
      align: 'right',
      skeletonWidth: '40px',
      render: (_, row) => {
        if (row.id === currentUser?.id) return <span className="text-text-muted text-xs font-medium">Active Self</span>;
        
        return (
          <button
            className="inline-flex items-center justify-center p-2 rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white hover:border-danger transition-colors cursor-pointer"
            onClick={() => handleDeleteUser(row.id)}
            title="Delete User"
          >
            <Trash2 size={14} />
          </button>
        );
      }
    });
  }

  // Top header elements (Role filter selector)
  const filterToolbar = (
    <div className="flex items-center gap-3">
      <label className="text-text-secondary text-xs font-medium">Filter Role:</label>
      <select
        value={selectedRole}
        className="px-3 py-1.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-xs outline-none transition-all focus:border-accent-primary cursor-pointer"
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="" className="bg-bg-surface">All Roles</option>
        <option value="admin" className="bg-bg-surface">Admins</option>
        <option value="author" className="bg-bg-surface">Authors</option>
        <option value="reader" className="bg-bg-surface">Readers</option>
      </select>
    </div>
  );

  return (
    <div>
      <DataTable
        headers={headers}
        data={users}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name or email..."
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        actions={filterToolbar}
      />
    </div>
  );
};

export default UsersPage;
