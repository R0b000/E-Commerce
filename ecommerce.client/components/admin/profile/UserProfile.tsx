import React, { useState, useEffect, useRef } from 'react';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  LockOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SaveOutlined,
  KeyOutlined,
  SearchOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  IdcardOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  LoadingOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Tooltip, Upload, Modal, Progress } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from 'auth-client/hooks/useAuth';
import { authAPIService } from 'auth-client/services/AuthAPIService';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { useToast } from '../../../context/ToastContext';

export type ActiveTab = 'overview' | 'personal' | 'security' | 'contact' | 'legal';

export const UserProfile: React.FC = () => {
  const { user, refreshUser, formattedExpiry } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  // Active View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile Information State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Update State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Agreement State
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [fullScreenDocOpen, setFullScreenDocOpen] = useState(false);

  // Populate data when user context is loaded
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setAgreementAccepted(Boolean(user.agreementAccepted));
    }
  }, [user]);

  // Handle Photo Cloudinary Upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    setUploadProgress(0);
    try {
      const res = await ecommerceService.uploadImage(file, 'HimalayaOnlineShop', (percent) => {
        setUploadProgress(percent);
      });
      if (res.success && res.data?.url) {
        setAvatarUrl(res.data.url);
        showToast('Avatar uploaded to Cloudinary! Click "Save Profile Changes" to persist.', 'success');
      } else {
        showToast(res.messages?.[0] || 'Image upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to upload avatar to Cloudinary', 'error');
    } finally {
      setUploadingAvatar(false);
      setUploadProgress(0);
    }
    return false;
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
  };

  // Submit Profile & Bio Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await authAPIService.updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        bio: bio.trim(),
        avatarUrl,
      });

      if (res.success) {
        showToast('Profile and Bio updated successfully', 'success');
        await refreshUser();
      } else {
        showToast(res.messages?.[0] || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await authAPIService.changePassword(currentPassword, newPassword);
      if (res.success) {
        showToast('Password changed successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await refreshUser();
      } else {
        showToast(res.messages?.[0] || 'Failed to change password', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Submit Agreement Acceptance
  const handleToggleAgreement = async (accepted: boolean) => {
    setSavingAgreement(true);
    try {
      const res = await authAPIService.updateUserProfile({
        agreementAccepted: accepted,
      });
      if (res.success) {
        setAgreementAccepted(accepted);
        showToast(accepted ? 'Platform agreement accepted' : 'Agreement status updated', 'success');
        await refreshUser();
      }
    } catch {
      showToast('Failed to update agreement status', 'error');
    } finally {
      setSavingAgreement(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User Profile';
  const avatarInitial = (firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  // Search filter list
  const allSettings = [
    { id: 'personal', title: 'Personal Details & Bio', desc: 'Update profile picture, display name, and bio', icon: <UserOutlined /> },
    { id: 'security', title: 'Password & Security', desc: 'Change password, view session credentials', icon: <LockOutlined /> },
    { id: 'contact', title: 'Address & Contact', desc: 'Phone numbers and shipping/delivery address', icon: <EnvironmentOutlined /> },
    { id: 'legal', title: 'Legal Agreements & Terms', desc: 'Review and sign platform agreements', icon: <FileTextOutlined /> },
  ];

  const filteredSettings = allSettings.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clean Borderless Light Theme Palette
  const fbBg = 'bg-[#f8fafc]';
  const fbPanel = 'bg-white shadow-xs';
  const fbSubPanel = 'bg-slate-100/70';
  const fbTextPrimary = 'text-slate-900';
  const fbTextSecondary = 'text-slate-500';
  const fbHover = 'hover:bg-slate-100/80';

  // Action Badge Color Helper
  const getActionTagColor = (action: string = '') => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN')) return 'cyan';
    if (act.includes('PASSWORD')) return 'gold';
    if (act.includes('CREATE') || act.includes('POST')) return 'blue';
    if (act.includes('UPDATE') || act.includes('PUT') || act.includes('PATCH')) return 'purple';
    if (act.includes('DELETE')) return 'volcano';
    return 'default';
  };

  return (
    <div className={`w-full h-full rounded-2xl overflow-hidden ${fbBg} shadow-sm font-['Poppins','Inter',sans-serif] flex flex-col`}>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* =========================================================================
            LEFT SIDEBAR: Settings & Privacy Navigation Hub (Independent Scrollbar)
           ========================================================================= */}
        <aside className={`w-full md:w-80 shrink-0 ${fbPanel} flex flex-col h-full overflow-hidden`}>
          {/* Top Fixed Header with Search in Left Sidebar */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h1 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                Settings & privacy
              </h1>
            </div>

            {/* Search Settings Pill */}
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full ${fbSubPanel} transition focus-within:ring-2 focus-within:ring-[#0096c7]/40`}>
              <SearchOutlined className={`text-xs ${fbTextSecondary}`} />
              <input
                type="text"
                placeholder="Search settings"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-transparent border-0 outline-none text-xs font-normal ${fbTextPrimary} placeholder:${fbTextSecondary} focus:ring-0`}
              />
            </div>
          </div>

          {/* Left Menu Items: Scrollable Navigation List (Zero Extra Outer Padding) */}
          <div className="flex-1 overflow-y-auto px-2 py-2 profile-menu-scroll space-y-3">

            {/* Search Match Results */}
            {searchQuery.trim() && (
              <div className="mb-4 space-y-1">
                <div className={`text-[12px] font-semibold uppercase tracking-wider ${fbTextSecondary} px-2`}>
                  Matching Settings
                </div>
                {filteredSettings.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveTab(s.id as ActiveTab);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left cursor-pointer transition ${
                      activeTab === s.id ? `${fbSubPanel} font-bold text-[#0096c7]` : `${fbHover} ${fbTextPrimary}`
                    }`}
                  >
                    <span className="text-xs text-[#0096c7]">{s.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{s.title}</div>
                      <div className={`text-[11px] ${fbTextSecondary} truncate`}>{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Section: Tools and resources */}
            <div className="mb-4">
              <div className={`text-[12px] font-semibold uppercase tracking-wider ${fbTextSecondary} px-2 mb-1`}>
                Tools and resources
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition ${
                    activeTab === 'personal'
                      ? `${fbSubPanel} font-bold text-[#0096c7]`
                      : `${fbHover} ${fbTextPrimary}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs">
                      <UserOutlined />
                    </span>
                    <span className="text-[13px] font-semibold">Profile Details & Bio</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition ${
                    activeTab === 'security'
                      ? `${fbSubPanel} font-bold text-[#0096c7]`
                      : `${fbHover} ${fbTextPrimary}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xs">
                      <LockOutlined />
                    </span>
                    <span className="text-[13px] font-semibold">Password & Security</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition ${
                    activeTab === 'contact'
                      ? `${fbSubPanel} font-bold text-[#0096c7]`
                      : `${fbHover} ${fbTextPrimary}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center text-xs">
                      <EnvironmentOutlined />
                    </span>
                    <span className="text-[13px] font-semibold">Address & Contact</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('legal')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition ${
                    activeTab === 'legal'
                      ? `${fbSubPanel} font-bold text-[#0096c7]`
                      : `${fbHover} ${fbTextPrimary}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">
                      <FileTextOutlined />
                    </span>
                    <span className="text-[13px] font-semibold">Legal Agreements</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* =========================================================================
            RIGHT MAIN CONTENT AREA: Hub Panels & Editors (Independent Scrollbar)
           ========================================================================= */}
        <main className={`flex-1 p-3 overflow-y-auto ${fbBg} profile-content-scroll h-full`}>
          {/* Header Bar with Back navigation */}
          {activeTab !== 'overview' && (
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0096c7] hover:underline cursor-pointer"
              >
                <ArrowLeftOutlined className="text-[10px]" />
                <span>Back to Overview</span>
              </button>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 1: OVERVIEW HUB (Profile summary, stats, quick access & recent logs)
             ------------------------------------------------------------------- */}
          {activeTab === 'overview' && (
            <div className="w-full space-y-6">
              {/* User Profile Identity Banner */}
              <div className={`p-6 rounded-2xl ${fbPanel} shadow-xs relative overflow-hidden border border-slate-100/80`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-tr from-[#0096c7] to-cyan-400 text-white flex items-center justify-center font-bold text-2xl shrink-0 border-2 border-[#0096c7]/50 shadow-md">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className={`text-base font-bold ${fbTextPrimary}`}>{displayName}</h2>
                        <Tag color="cyan" className="font-semibold text-[10px] uppercase rounded-full">
                          {user?.role || 'ADMINISTRATOR'}
                        </Tag>
                        <Tag color="green" className="font-semibold text-[10px] rounded-full">
                          <CheckCircleOutlined /> ACTIVE
                        </Tag>
                      </div>
                      <p className={`text-xs ${fbTextSecondary} mt-0.5`}>{user?.email}</p>
                      {bio && (
                        <p className={`text-xs text-slate-700 italic mt-1.5 line-clamp-2 max-w-2xl bg-slate-100/70 px-2.5 py-1 rounded-lg`}>
                          "{bio}"
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('personal')}
                    className="px-4 py-2 rounded-xl bg-[#0096c7] hover:bg-[#0077b6] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm shrink-0"
                  >
                    <UserOutlined />
                    <span>Edit Profile & Bio</span>
                  </button>
                </div>
              </div>

              {/* Quick Setting Navigation Cards (Full Width 4-Column Responsive Grid) */}
              <div>
                <h3 className={`text-[14px] font-semibold ${fbTextPrimary} tracking-tight mb-3`}>
                  Quick account shortcuts
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Personal Details & Bio */}
                  <div
                    onClick={() => setActiveTab('personal')}
                    className={`${fbPanel} hover:bg-slate-50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-between min-h-[150px] group border border-slate-100/80`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                      <UserOutlined />
                    </div>
                    <div>
                      <div className={`text-[14px] font-semibold ${fbTextPrimary} group-hover:text-[#0096c7] transition-colors`}>
                        Profile & Bio
                      </div>
                      <p className={`text-[13px] ${fbTextSecondary} mt-1 leading-normal`}>
                        Update display name, avatar photograph, and administrative bio.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Password & Security */}
                  <div
                    onClick={() => setActiveTab('security')}
                    className={`${fbPanel} hover:bg-slate-50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-between min-h-[150px] group border border-slate-100/80`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                      <LockOutlined />
                    </div>
                    <div>
                      <div className={`text-[14px] font-semibold ${fbTextPrimary} group-hover:text-[#0096c7] transition-colors`}>
                        Password & Security
                      </div>
                      <p className={`text-[13px] ${fbTextSecondary} mt-1 leading-normal`}>
                        Change credentials and view active session credentials.
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Address & Contact */}
                  <div
                    onClick={() => setActiveTab('contact')}
                    className={`${fbPanel} hover:bg-slate-50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-between min-h-[150px] group border border-slate-100/80`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                      <EnvironmentOutlined />
                    </div>
                    <div>
                      <div className={`text-[14px] font-semibold ${fbTextPrimary} group-hover:text-[#0096c7] transition-colors`}>
                        Address & Contact
                      </div>
                      <p className={`text-[13px] ${fbTextSecondary} mt-1 leading-normal`}>
                        Manage emergency contact details and physical address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Section: Administrative Role & Scope Panel */}
              <div className="w-full">
                <div className="space-y-4">
                  <div className={`p-5 rounded-2xl ${fbPanel} border border-slate-100/80`}>
                    <h3 className={`text-[14px] font-semibold ${fbTextPrimary} mb-3 flex items-center gap-2`}>
                      <SafetyCertificateOutlined className="text-emerald-500" />
                      <span>Administrative Role & Scope</span>
                    </h3>

                    <div className="space-y-2.5 text-[13px]">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                        <span className={`${fbTextSecondary} font-semibold`}>Assigned Role</span>
                        <Tag color="cyan" className="font-semibold text-[11px] uppercase m-0">
                          {user?.role || 'ADMINISTRATOR'}
                        </Tag>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                        <span className={`${fbTextSecondary} font-semibold`}>Access Scope</span>
                        <span className={`font-semibold text-[13px] ${fbTextPrimary}`}>
                          {user?.role === 'admin'
                            ? 'Full System Administrator'
                            : user?.role === 'support'
                            ? 'Customer Care & Support'
                            : user?.role === 'manager'
                            ? 'Store Operations Manager'
                            : 'Staff Account'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                        <span className={`${fbTextSecondary} font-semibold`}>Session Status</span>
                        <span className="font-mono text-emerald-600 font-semibold text-[13px] flex items-center gap-1">
                          <CheckCircleOutlined className="text-[11px]" /> Active (24h)
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Link
                        to="/admin/security"
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <KeyOutlined className="text-purple-500 text-xs" />
                        <span>Security & Passkeys Manager</span>
                      </Link>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl ${fbPanel} border border-slate-100/80`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center text-sm shrink-0">
                        <InfoCircleOutlined />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${fbTextPrimary}`}>Admin & Support Hub</div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          This portal profile is dedicated to administrators, customer care representatives, and store managers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 2: PROFILE & BIO (Photo Upload, Names, Bio, Live Preview)
             ------------------------------------------------------------------- */}
          {activeTab === 'personal' && (
            <div className="w-full space-y-6">
              <div>
                <h2 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                  Personal Profile & Biography
                </h2>
                <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                  Manage your display name, public profile photograph, and personal bio visible to administrators and team members.
                </p>
              </div>

              {/* Photo Upload Section */}
              <div className={`p-5 rounded-2xl ${fbPanel} space-y-4`}>
                <div className={`text-xs font-bold ${fbTextPrimary}`}>Profile Photograph</div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-[#0096c7] to-cyan-400 text-white flex items-center justify-center text-2xl font-bold shrink-0 border-2 border-[#0096c7]/50 shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      avatarInitial
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Upload
                        beforeUpload={(file) => {
                          handleAvatarUpload(file);
                          return false;
                        }}
                        showUploadList={false}
                        accept="image/*"
                        disabled={uploadingAvatar}
                      >
                        <button
                          type="button"
                          disabled={uploadingAvatar}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0096c7] hover:bg-[#0077b6] text-white text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          {uploadingAvatar ? <LoadingOutlined spin className="text-xs" /> : <UploadOutlined className="text-xs" />}
                          <span>
                            {uploadingAvatar
                              ? uploadProgress === 100
                                ? 'Processing on Cloudinary...'
                                : `Uploading ${uploadProgress}%...`
                              : 'Upload New Photo'}
                          </span>
                        </button>
                      </Upload>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className={`px-3 py-1.5 rounded-lg ${fbSubPanel} hover:bg-rose-500/20 hover:text-rose-400 text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${fbTextPrimary}`}
                        >
                          <DeleteOutlined className="text-xs text-rose-400" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {uploadingAvatar && (
                      <div className="w-full max-w-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#0096c7]">
                          <span>Upload Progress</span>
                          <span>{uploadProgress === 100 ? 'Processing on Cloudinary...' : `${uploadProgress}%`}</span>
                        </div>
                        <Progress
                          percent={uploadProgress}
                          size="small"
                          strokeColor={{
                            '0%': '#0096c7',
                            '100%': '#00b4d8',
                          }}
                          showInfo={false}
                        />
                      </div>
                    )}
                    <p className={`text-[10px] ${fbTextSecondary}`}>
                      Directly uploads to Cloudinary folder <code className="text-[10px] bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">HimalayaOnlineShop</code>. Click &quot;Save Profile Changes&quot; below to save.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details & Bio Form */}
              <form onSubmit={handleSaveProfile} className={`p-5 rounded-2xl ${fbPanel} space-y-5`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Bijaya"
                      required
                      className={`w-full px-3 py-2 rounded-xl border-0 ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:ring-1 focus:ring-[#0096c7]/50 transition`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Shrestha"
                      required
                      className={`w-full px-3 py-2 rounded-xl border-0 ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:ring-1 focus:ring-[#0096c7]/50 transition`}
                    />
                  </div>
                </div>

                {/* Personal Bio */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-[11px] font-semibold ${fbTextSecondary}`}>
                      Personal Bio
                    </label>
                    <span className={`text-[10px] ${bio.length > 400 ? 'text-amber-400 font-bold' : fbTextSecondary}`}>
                      {bio.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other shoppers and artisans about yourself, your passion for Himalayan handicrafts, or your merchant background..."
                    className={`w-full px-3 py-2.5 rounded-xl border-0 ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:ring-1 focus:ring-[#0096c7]/50 transition resize-none leading-relaxed`}
                  />
                  
                  {/* Quick Bio Tag suggestions */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] ${fbTextSecondary}`}>Add bio snippet:</span>
                    {[
                      'Handcrafted Artisan Supporter',
                      'Verified Merchant',
                      'Himalayan Organic Enthusiast',
                      'Store Administrator',
                    ].map((snippet) => (
                      <button
                        key={snippet}
                        type="button"
                        onClick={() => setBio((prev) => (prev ? `${prev} • ${snippet}` : snippet))}
                        className={`text-[10px] px-2 py-0.5 rounded-full ${fbSubPanel} hover:bg-[#0096c7]/20 hover:text-[#0096c7] ${fbTextSecondary} transition cursor-pointer`}
                      >
                        + {snippet}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Profile Card Preview */}
                <div className={`p-4 rounded-xl ${fbSubPanel} space-y-2`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${fbTextSecondary} flex items-center gap-1`}>
                    <InfoCircleOutlined className="text-[#0096c7]" />
                    <span>Live Public Profile Preview</span>
                  </div>
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#0096c7] to-cyan-400 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${fbTextPrimary}`}>
                          {firstName || 'First'} {lastName || 'Last'}
                        </span>
                        <Tag color="cyan" className="text-[9px] px-1.5 py-0 leading-tight m-0 font-medium rounded-full">
                          {user?.role?.toUpperCase() || 'USER'}
                        </Tag>
                      </div>
                      <p className={`text-[11px] ${fbTextSecondary} mt-1 leading-relaxed italic`}>
                        {bio || 'No public bio provided yet. Write something above to introduce yourself!'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-[#0096c7] hover:bg-[#0077b6] text-white font-semibold text-xs inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {savingProfile ? <Spin size="small" /> : <SaveOutlined />}
                    <span>{savingProfile ? 'Saving Changes...' : 'Save Profile & Bio'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 3: PASSWORD & SECURITY
             ------------------------------------------------------------------- */}
          {activeTab === 'security' && (
            <div className="w-full space-y-6">
              <div>
                <h2 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                  Password & Security Settings
                </h2>
                <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                  Choose a robust password to safeguard your account against unauthorized logins.
                </p>
              </div>

              {/* Active Session Info */}
              <div className={`p-4 rounded-xl ${fbSubPanel} flex items-center justify-between text-xs`}>
                <div>
                  <span className={fbTextSecondary}>Active Session Expiration: </span>
                  <strong className={`${fbTextPrimary} font-mono ml-1`}>
                    {formattedExpiry || (user?.tokenExpiresAt ? new Date(user.tokenExpiresAt).toLocaleString() : '24h active')}
                  </strong>
                </div>
                <Tag color="success" className="font-semibold text-[10px] m-0">ACTIVE</Tag>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className={`p-5 rounded-2xl ${fbPanel} space-y-4`}>
                <div>
                  <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                      className={`w-full px-3 py-2 pr-10 rounded-xl border-0 ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:ring-1 focus:ring-[#0096c7]/50 transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${fbTextSecondary} hover:${fbTextPrimary}`}
                    >
                      {showCurrentPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className={`w-full px-3 py-2 pr-10 rounded-xl border-0 ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:ring-1 focus:ring-[#0096c7]/50 transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${fbTextSecondary} hover:${fbTextPrimary}`}
                    >
                      {showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      className={`w-full px-3 py-2 pr-10 rounded-xl border-0 ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:ring-1 focus:ring-[#0096c7]/50 transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${fbTextSecondary} hover:${fbTextPrimary}`}
                    >
                      {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Hints */}
                <div className={`p-3 rounded-xl ${fbSubPanel} space-y-1.5 text-[11px]`}>
                  <div className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-emerald-400 font-semibold' : fbTextSecondary}`}>
                    <CheckOutlined className="text-[10px]" /> Minimum 6 characters
                  </div>
                  <div className={`flex items-center gap-2 ${newPassword && newPassword === confirmPassword ? 'text-emerald-400 font-semibold' : fbTextSecondary}`}>
                    <CheckOutlined className="text-[10px]" /> Passwords match
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    to="/admin/security"
                    className="text-xs text-[#0096c7] font-semibold hover:underline inline-flex items-center gap-1.5"
                  >
                    <KeyOutlined />
                    <span>Manage FIDO2 Passkeys</span>
                  </Link>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-2.5 rounded-xl bg-[#0096c7] hover:bg-[#0077b6] text-white font-semibold text-xs inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {changingPassword ? <Spin size="small" /> : <LockOutlined />}
                    <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 5: CONTACT & ADDRESS
             ------------------------------------------------------------------- */}
          {activeTab === 'contact' && (
            <div className="w-full space-y-6">
              <div>
                <h2 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                  Contact & Shipping Address
                </h2>
                <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                  Used for delivery coordination, courier notifications, and emergency account recovery.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className={`p-5 rounded-2xl ${fbPanel} space-y-4`}>
                <div>
                  <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                    Email Address (Account Identity)
                  </label>
                  <div className={`w-full px-3 py-2 rounded-xl ${fbSubPanel} text-xs ${fbTextSecondary} flex items-center justify-between`}>
                    <span>{user?.email || 'user@store.com'}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircleOutlined /> Primary Login
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+977 980-0000000"
                    className={`w-full px-3 py-2 rounded-xl border-0 ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:ring-1 focus:ring-[#0096c7]/50 transition`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                    Primary Physical / Delivery Address
                  </label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, Ward No, Municipality, City, Country..."
                    className={`w-full px-3 py-2 rounded-xl border-0 ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:ring-1 focus:ring-[#0096c7]/50 transition resize-none`}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-[#0096c7] hover:bg-[#0077b6] text-white font-semibold text-xs inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {savingProfile ? <Spin size="small" /> : <SaveOutlined />}
                    <span>{savingProfile ? 'Saving Address...' : 'Save Contact Details'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 6: LEGAL AGREEMENTS & TERMS
             ------------------------------------------------------------------- */}
          {activeTab === 'legal' && (
            <div className="w-full space-y-6">
              <div>
                <h2 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                  Platform Legal Agreements & Terms
                </h2>
                <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                  Compliance obligations, fair trade terms, and privacy policies governing the marketplace.
                </p>
              </div>

              {/* Legal Document Preview Modal */}
              <Modal
                open={fullScreenDocOpen}
                onCancel={() => setFullScreenDocOpen(false)}
                width={720}
                centered
                styles={{
                  body: {
                    maxHeight: 'calc(80vh - 120px)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px 20px',
                    backgroundColor: '#f8fafc',
                  },
                }}
                title={
                  <div className="flex items-center justify-between pr-8">
                    <div className="flex items-center gap-2">
                      <FileTextOutlined className="text-[#0096c7]" />
                      <span className="font-bold text-sm text-slate-800">
                        Himalaya Marketplace Terms of Service & Merchant Conduct
                      </span>
                    </div>
                  </div>
                }
                footer={
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 py-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreementAccepted}
                        onChange={(e) => handleToggleAgreement(e.target.checked)}
                        disabled={savingAgreement}
                        className="w-4 h-4 rounded text-[#0096c7] focus:outline-none accent-[#0096c7] cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        I have read, acknowledge, and agree to the Platform Terms & Conduct
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFullScreenDocOpen(false)}
                      className="px-4 py-2 bg-[#0096c7] text-white text-xs font-bold rounded-xl hover:bg-[#0077b6] transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                }
              >
                <div className="flex-1 overflow-y-auto p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm font-mono text-xs leading-relaxed text-slate-700 space-y-6">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 mb-2">1. PARTIES & SCOPE OF SERVICE</h4>
                    <p>
                      By accessing or transacting on the Himalaya E-Commerce Platform, you agree to comply with all ethical fair-trade sourcing guidelines, authentic artisan heritage preservation standards, and applicable consumer protection statutes.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 mb-2">2. ARTISAN INTEGRITY & FAIR SOURCING</h4>
                    <p>
                      All platform administrators, care agents, and merchants uphold the highest integrity for handcrafted artifacts, organic herbs, and hand-woven textiles. Misattribution of origin or counterfeit goods will incur immediate revocation of platform privileges.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 mb-2">3. PRIVACY & DATA SAFEGUARDS</h4>
                    <p>
                      Personal identity credentials, biometric FIDO2 passkeys, and contact coordinates are encrypted under strict role-based access protocols. Customer contact information must not be stored, exported, or reused outside authorized fulfillment transactions.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 mb-2">4. DISPUTE RESOLUTION & SETTLEMENT</h4>
                    <p>
                      All payments are held in escrow until mutual delivery acknowledgment. Disputed items are reviewed by the arbitration committee under the Nepal Commercial Fair Practices Act.
                    </p>
                  </div>
                </div>
              </Modal>

              {/* Terms Reader Card */}
              <div className={`p-5 rounded-2xl ${fbPanel} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-bold ${fbTextPrimary}`}>
                    Himalaya Marketplace Terms of Service & Merchant Conduct
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullScreenDocOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#0096c7] font-semibold hover:underline cursor-pointer"
                  >
                    <EyeOutlined />
                    <span>Read Full Document</span>
                  </button>
                </div>

                <div
                  className={`p-4 rounded-xl ${fbSubPanel} font-mono text-[11px] leading-relaxed ${fbTextSecondary} space-y-3`}
                >
                  <div>
                    <p className="font-bold mb-1 text-slate-800">1. PARTIES & SCOPE OF SERVICE</p>
                    <p>
                      By accessing or transacting on the Himalaya E-Commerce Platform, you agree to comply with all ethical fair-trade sourcing guidelines, authentic artisan heritage preservation standards, and applicable consumer protection statutes.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold mb-1 text-slate-800">2. ARTISAN INTEGRITY & FAIR SOURCING</p>
                    <p>
                      All platform administrators, care agents, and merchants uphold the highest integrity for handcrafted artifacts, organic herbs, and hand-woven textiles. Misattribution of origin or counterfeit goods will incur immediate revocation of platform privileges.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold mb-1 text-slate-800">3. PRIVACY & DATA SAFEGUARDS</p>
                    <p>
                      Personal identity credentials, biometric FIDO2 passkeys, and contact coordinates are encrypted under strict role-based access protocols. Customer contact information must not be stored, exported, or reused outside authorized fulfillment transactions.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold mb-1 text-slate-800">4. DISPUTE RESOLUTION & SETTLEMENT</p>
                    <p>
                      All payments are held in escrow until mutual delivery acknowledgment. Disputed items are reviewed by the arbitration committee under the Nepal Commercial Fair Practices Act.
                    </p>
                  </div>
                </div>

                {/* Acceptance Checkbox & Save */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreementAccepted}
                      onChange={(e) => handleToggleAgreement(e.target.checked)}
                      disabled={savingAgreement}
                      className="w-4 h-4 rounded text-[#0096c7] focus:outline-none accent-[#0096c7] cursor-pointer"
                    />
                    <span className={`text-xs font-semibold ${fbTextPrimary}`}>
                      I have read, acknowledge, and agree to the Platform Terms & Conduct
                    </span>
                  </label>

                  {savingAgreement && (
                    <span className="text-[11px] text-[#0096c7] flex items-center gap-1.5">
                      <Spin size="small" /> Updating agreement...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
