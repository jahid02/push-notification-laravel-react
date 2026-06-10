import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { User, Shield, Key, FileText, Image as ImageIcon, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('details');

  // Tab 1: Profile Details States
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [updatingDetails, setUpdatingDetails] = useState(false);

  // Tab 2: Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Initialize values
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Avatar file size must be less than 2MB.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name field is required.');
      return;
    }

    setUpdatingDetails(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio || '');
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await api.post('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        updateUser(response.data.data.user);
        toast.success(response.data.message || 'Profile details updated successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setUpdatingDetails(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await api.post('/auth/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getInitials = (n) => {
    if (!n) return 'O';
    return n.split(' ').map(item => item.charAt(0)).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Title section */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary font-display">
          My Account Profile
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Manage your operator identity details, bio, avatar, and security passwords.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Side: Summary Card */}
        <div className="md:col-span-1 bg-bg-glass border border-border-color rounded-2xl p-5 flex flex-col items-center text-center shadow-md h-fit">
          <div className="relative group w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-accent-primary/20 shadow-sm flex items-center justify-center bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 text-accent-primary font-bold text-2xl font-display">
            {avatarPreview ? (
              <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.name)
            )}
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-semibold cursor-pointer transition-opacity duration-200">
              <Camera size={16} className="mb-0.5" />
              <span>Change</span>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <h3 className="font-bold text-base text-text-primary truncate w-full">{user?.name}</h3>
          <span className="text-xs text-text-muted mt-0.5">{user?.email}</span>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent-primary-glow text-accent-primary-hover border border-accent-primary/10">
            <Shield size={12} />
            <span>{user?.role}</span>
          </div>

          <div className="w-full border-t border-border-color mt-5 pt-4 text-left text-xs text-text-secondary space-y-2">
            <div>
              <span className="text-text-muted">Bio:</span>
              <p className="mt-1 italic line-clamp-3 leading-relaxed">
                {user?.bio || 'No profile bio added yet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Settings Form & Tabs */}
        <div className="md:col-span-3 bg-bg-glass border border-border-color rounded-2xl shadow-md overflow-hidden flex flex-col">
          {/* Tab Headers */}
          <div className="flex border-b border-border-color bg-white/[0.01]">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'border-accent-primary text-accent-primary bg-accent-primary-glow/20'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/30'
              }`}
            >
              <User size={15} />
              <span>Profile Details</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'border-accent-primary text-accent-primary bg-accent-primary-glow/20'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/30'
              }`}
            >
              <Key size={15} />
              <span>Change Password</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 flex-1">
            {activeTab === 'details' ? (
              <form onSubmit={handleUpdateDetails} className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Full Operator Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all focus:border-accent-primary focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Email (Read-Only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Registered Email Address (Locked)</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2.5 bg-white/[0.01] border border-border-color rounded-xl text-text-muted text-sm cursor-not-allowed"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>

                  {/* Biography */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Biography / Channel Description</label>
                    <textarea
                      className="w-full px-4 py-3 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all focus:border-accent-primary focus:shadow-[0_0_10px_rgba(139,92,246,0.15)] min-h-[120px] resize-y leading-relaxed"
                      placeholder="Describe your channel, specialty, or roles..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>

                  {/* Avatar file selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Profile Image (Avatar)</label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 bg-white/[0.05] border border-border-color hover:bg-bg-surface-hover hover:border-border-light text-text-primary text-xs font-semibold rounded-xl cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm">
                        <ImageIcon size={14} />
                        <span>Browse Image...</span>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      </label>
                      {avatarFile && (
                        <span className="text-xs text-accent-secondary truncate font-medium max-w-xs">
                          {avatarFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-color pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingDetails}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white font-semibold text-sm rounded-xl hover:-translate-y-0.5 hover:shadow-lg focus:outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {updatingDetails ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Updating Profile...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all focus:border-accent-primary focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all focus:border-accent-primary focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-border-color rounded-xl text-text-primary text-sm outline-none transition-all focus:border-accent-primary focus:shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => confirmPassword !== undefined && setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-border-color pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white font-semibold text-sm rounded-xl hover:-translate-y-0.5 hover:shadow-lg focus:outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
