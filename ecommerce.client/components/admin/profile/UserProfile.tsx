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
  ShopOutlined,
  SearchOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  SunOutlined,
  MoonOutlined,
  IdcardOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Tag, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from 'auth-client/hooks/useAuth';
import { authAPIService } from 'auth-client/services/AuthAPIService';
import { useToast } from '../../../context/ToastContext';

type ActiveTab = 'overview' | 'personal' | 'security' | 'contact' | 'legal';

export const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

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
  const [agreementExpanded, setAgreementExpanded] = useState(false);

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

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        showToast('Profile image staged. Click "Save Changes" to apply.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Profile Information Changes
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
        showToast('Profile updated successfully', 'success');
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

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User Profile';
  const avatarInitial = (firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  // Search filter list
  const allSettings = [
    { id: 'personal', title: 'Personal Details & Bio', desc: 'Update profile picture, name, and bio', icon: <UserOutlined /> },
    { id: 'security', title: 'Password & Security', desc: 'Change password and account credentials', icon: <LockOutlined /> },
    { id: 'contact', title: 'Address & Contact', desc: 'Phone numbers and shipping address', icon: <EnvironmentOutlined /> },
    { id: 'legal', title: 'Legal Agreements & Terms', desc: 'Review and sign platform agreements', icon: <FileTextOutlined /> },
  ];

  const filteredSettings = allSettings.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Facebook Dark Theme Palette
  const fbBg = isDarkMode ? 'bg-[#18191a]' : 'bg-[#f0f2f5]';
  const fbPanel = isDarkMode ? 'bg-[#242526]' : 'bg-white';
  const fbSubPanel = isDarkMode ? 'bg-[#3a3b3c]' : 'bg-slate-100';
  const fbBorder = isDarkMode ? 'border-[#393a3b]' : 'border-slate-200';
  const fbTextPrimary = isDarkMode ? 'text-[#e4e6eb]' : 'text-slate-900';
  const fbTextSecondary = isDarkMode ? 'text-[#b0b3b8]' : 'text-slate-500';
  const fbHover = isDarkMode ? 'hover:bg-[#3a3b3c]' : 'hover:bg-slate-100';

  return (
    <div className={`w-full rounded-2xl overflow-hidden border ${fbBorder} ${fbBg} shadow-xl font-['Poppins','Inter',sans-serif] transition-colors duration-200`}>
      <div className="flex flex-col md:flex-row min-h-[720px]">
        {/* =========================================================================
            LEFT SIDEBAR: Settings & privacy (Identical to Facebook Layout)
           ========================================================================= */}
        <aside className={`w-full md:w-80 shrink-0 ${fbPanel} border-b md:border-b-0 md:border-r ${fbBorder} p-4 flex flex-col justify-between`}>
          <div>
            {/* Top Header & Search */}
            <div className="flex items-center justify-between mb-3">
              <h1 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                Settings & privacy
              </h1>
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${fbSubPanel} ${fbTextPrimary} hover:opacity-80 transition cursor-pointer`}
              >
                {isDarkMode ? <SunOutlined className="text-amber-400 text-xs" /> : <MoonOutlined className="text-slate-700 text-xs" />}
              </button>
            </div>

            {/* Search Settings Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${fbSubPanel} mb-4 transition focus-within:ring-2 focus-within:ring-[#0096c7]/40`}>
              <SearchOutlined className={`text-xs ${fbTextSecondary}`} />
              <input
                type="text"
                placeholder="Search settings"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-transparent border-0 outline-none text-xs font-normal ${fbTextPrimary} placeholder:${fbTextSecondary} focus:ring-0`}
              />
            </div>

            {/* Search Match Results if query present */}
            {searchQuery.trim() && (
              <div className="mb-4 space-y-1">
                <div className={`text-[11px] font-semibold uppercase tracking-wider ${fbTextSecondary} px-2`}>
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
                      <div className="text-xs font-semibold truncate">{s.title}</div>
                      <div className={`text-[10px] ${fbTextSecondary} truncate`}>{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Section: Your account (Facebook "Meta Account" style) */}
            <div className="mb-4">
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${fbTextSecondary} px-2 mb-1.5`}>
                Your account
              </div>

              {/* Meta Account Profile Badge */}
              <div
                onClick={() => setActiveTab('overview')}
                className={`p-3 rounded-2xl ${fbSubPanel} border border-transparent hover:border-[#0096c7]/30 transition cursor-pointer flex items-start gap-3`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#0096c7] to-cyan-400 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${fbTextPrimary} truncate`}>{displayName}</span>
                    <Tag color="cyan" className="text-[9px] px-1.5 py-0 leading-tight m-0 font-medium rounded-full">
                      {user?.role?.toUpperCase() || 'USER'}
                    </Tag>
                  </div>
                  <p className={`text-[10px] ${fbTextSecondary} line-clamp-2 mt-0.5 leading-snug`}>
                    Password, security, personal details, cross-profile experiences, verification
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Tools and resources */}
            <div className="mb-4">
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${fbTextSecondary} px-2 mb-1`}>
                Tools and resources
              </div>
              <p className={`text-[10px] ${fbTextSecondary} px-2 mb-2 leading-relaxed`}>
                Our tools help you control and manage your profile & privacy.
              </p>

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
                    <span className="text-xs font-medium">Personal Details</span>
                  </div>
                  <RightOutlined className={`text-[9px] ${fbTextSecondary}`} />
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
                    <span className="text-xs font-medium">Password & Security</span>
                  </div>
                  <RightOutlined className={`text-[9px] ${fbTextSecondary}`} />
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
                    <span className="text-xs font-medium">Address & Contact</span>
                  </div>
                  <RightOutlined className={`text-[9px] ${fbTextSecondary}`} />
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
                    <span className="text-xs font-medium">Legal Agreements</span>
                  </div>
                  <RightOutlined className={`text-[9px] ${fbTextSecondary}`} />
                </button>
              </div>
            </div>

            {/* Section: Preferences */}
            <div>
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${fbTextSecondary} px-2 mb-1`}>
                Preferences
              </div>
              <p className={`text-[10px] ${fbTextSecondary} px-2 mb-2 leading-relaxed`}>
                Customize your experience across the platform.
              </p>

              <div className="space-y-0.5">
                <Link
                  to="/admin/security"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition ${fbHover} ${fbTextPrimary}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center text-xs">
                      <KeyOutlined />
                    </span>
                    <span className="text-xs font-medium">Security & Passkeys</span>
                  </div>
                  <RightOutlined className={`text-[9px] ${fbTextSecondary}`} />
                </Link>

                <Link
                  to="/admin/profile/vendor"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition ${fbHover} ${fbTextPrimary}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs">
                      <ShopOutlined />
                    </span>
                    <span className="text-xs font-medium">Seller & Vendor Profile</span>
                  </div>
                  <RightOutlined className={`text-[9px] ${fbTextSecondary}`} />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom user badge */}
          <div className={`pt-4 border-t ${fbBorder} mt-4 flex items-center justify-between text-[11px] ${fbTextSecondary}`}>
            <span className="truncate">{user?.email}</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <CheckCircleOutlined className="text-[10px]" /> Verified
            </span>
          </div>
        </aside>

        {/* =========================================================================
            RIGHT MAIN CONTENT AREA: Facebook-style Hub & Dedicated Panels
           ========================================================================= */}
        <main className={`flex-1 p-6 md:p-8 overflow-y-auto ${fbBg}`}>
          {/* Header Bar with Back button if not on overview */}
          {activeTab !== 'overview' && (
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[#0096c7] hover:underline cursor-pointer`}
              >
                <ArrowLeftOutlined className="text-[10px]" />
                <span>Back to Settings & privacy</span>
              </button>
              <div className={`text-xs ${fbTextSecondary}`}>
                Account &gt; <span className={`font-semibold ${fbTextPrimary}`}>{activeTab.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 1: OVERVIEW (Facebook "Find the setting you need" + Cards)
             ------------------------------------------------------------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-8 max-w-4xl">
              {/* Find the setting you need Header */}
              <div>
                <h2 className={`text-lg font-bold ${fbTextPrimary} tracking-tight mb-2`}>
                  Find the setting you need
                </h2>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-full ${fbPanel} border ${fbBorder} shadow-xs transition focus-within:border-[#0096c7] focus-within:ring-2 focus-within:ring-[#0096c7]/20`}>
                  <SearchOutlined className={`text-sm ${fbTextSecondary}`} />
                  <input
                    type="text"
                    placeholder="Search settings"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-transparent border-0 outline-none text-xs ${fbTextPrimary} placeholder:${fbTextSecondary} focus:ring-0`}
                  />
                </div>
              </div>

              {/* Most visited settings (3 Facebook Style Cards) */}
              <div>
                <h3 className={`text-xs font-bold ${fbTextPrimary} tracking-tight mb-3`}>
                  Most visited settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Personal Details */}
                  <div
                    onClick={() => setActiveTab('personal')}
                    className={`${fbPanel} hover:${fbSubPanel} p-5 rounded-2xl border ${fbBorder} cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg flex flex-col justify-between min-h-[170px] group`}
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                      <UserOutlined />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${fbTextPrimary} group-hover:text-[#0096c7] transition-colors`}>
                        Personal Details
                      </div>
                      <p className={`text-[11px] ${fbTextSecondary} mt-1 leading-normal`}>
                        Update your profile photo, display name, and public biography.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Legal Agreements & Compliance */}
                  <div
                    onClick={() => setActiveTab('legal')}
                    className={`${fbPanel} hover:${fbSubPanel} p-5 rounded-2xl border ${fbBorder} cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg flex flex-col justify-between min-h-[170px] group`}
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-400/20 text-emerald-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                      <FileTextOutlined />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${fbTextPrimary} group-hover:text-[#0096c7] transition-colors`}>
                        Legal Agreements
                      </div>
                      <p className={`text-[11px] ${fbTextSecondary} mt-1 leading-normal`}>
                        Review and accept platform artisan partner & shopper terms.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Password & Security */}
                  <div
                    onClick={() => setActiveTab('security')}
                    className={`${fbPanel} hover:${fbSubPanel} p-5 rounded-2xl border ${fbBorder} cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg flex flex-col justify-between min-h-[170px] group`}
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-400/20 text-rose-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                      <LockOutlined />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${fbTextPrimary} group-hover:text-[#0096c7] transition-colors`}>
                        Password & Security
                      </div>
                      <p className={`text-[11px] ${fbTextSecondary} mt-1 leading-normal`}>
                        Update account credentials, verify passwords, and session tokens.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Looking for something else? (Wide Facebook Cards) */}
              <div>
                <h3 className={`text-xs font-bold ${fbTextPrimary} tracking-tight mb-3`}>
                  Looking for something else?
                </h3>

                <div className="space-y-3">
                  {/* Privacy & Passkeys Center */}
                  <Link
                    to="/admin/security"
                    className={`${fbPanel} hover:${fbSubPanel} p-4 rounded-2xl border ${fbBorder} transition flex items-center justify-between group cursor-pointer block`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg shrink-0">
                        <SafetyCertificateOutlined />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${fbTextPrimary} group-hover:text-[#0096c7] transition-colors`}>
                          FIDO2 Security & Passkeys Center
                        </div>
                        <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                          Learn how to manage biometric passkeys, hardware tokens, and two-factor authentication.
                        </p>
                      </div>
                    </div>
                    <RightOutlined className={`text-xs ${fbTextSecondary} group-hover:translate-x-1 group-hover:text-[#0096c7] transition-all`} />
                  </Link>

                  {/* Artisan Vendor Storefront */}
                  <Link
                    to="/admin/profile/vendor"
                    className={`${fbPanel} hover:${fbSubPanel} p-4 rounded-2xl border ${fbBorder} transition flex items-center justify-between group cursor-pointer block`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-lg shrink-0">
                        <ShopOutlined />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${fbTextPrimary} group-hover:text-[#0096c7] transition-colors`}>
                          Artisan Vendor Storefront Profile
                        </div>
                        <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                          Manage verified business identity, artisan craft category, and storefront branding.
                        </p>
                      </div>
                    </div>
                    <RightOutlined className={`text-xs ${fbTextSecondary} group-hover:translate-x-1 group-hover:text-[#0096c7] transition-all`} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 2: PERSONAL DETAILS (Photo upload, Name, Bio)
             ------------------------------------------------------------------- */}
          {activeTab === 'personal' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                  Personal Profile & Identity
                </h2>
                <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                  Manage your display name, public profile photograph, and personal bio.
                </p>
              </div>

              {/* Photo Upload Section */}
              <div className={`p-5 rounded-2xl ${fbPanel} border ${fbBorder} space-y-4`}>
                <div className={`text-xs font-bold ${fbTextPrimary}`}>Profile Picture</div>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-[#0096c7] to-cyan-400 text-white flex items-center justify-center text-2xl font-bold shrink-0 border-2 border-[#0096c7]/50 shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      avatarInitial
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-[#0096c7] hover:bg-[#0077b6] text-white text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <UploadOutlined className="text-xs" />
                        <span>Upload New Photo</span>
                      </button>

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
                    <p className={`text-[10px] ${fbTextSecondary}`}>
                      JPG, PNG, or WEBP up to 2MB. Square ratio recommended.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} className={`p-5 rounded-2xl ${fbPanel} border ${fbBorder} space-y-4`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      required
                      className={`w-full px-3 py-2 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:border-[#0096c7] transition`}
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
                      placeholder="e.g. Doe"
                      required
                      className={`w-full px-3 py-2 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:border-[#0096c7] transition`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                    Personal Bio
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other shoppers and artisans about yourself..."
                    className={`w-full px-3 py-2 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:border-[#0096c7] transition resize-none`}
                  />
                  <p className={`text-[10px] ${fbTextSecondary} mt-1`}>
                    Brief summary visible on your verified profile and reviews.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 rounded-xl bg-[#0096c7] hover:bg-[#0077b6] text-white font-medium text-xs inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {savingProfile ? <Spin size="small" /> : <SaveOutlined />}
                    <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 3: PASSWORD & SECURITY (Current, New, Confirm Password)
             ------------------------------------------------------------------- */}
          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                  Password & Security Settings
                </h2>
                <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                  Choose a unique password to safeguard your account against unauthorized logins.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className={`p-5 rounded-2xl ${fbPanel} border ${fbBorder} space-y-4`}>
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
                      className={`w-full px-3 py-2 pr-10 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:border-[#0096c7] transition`}
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
                      className={`w-full px-3 py-2 pr-10 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:border-[#0096c7] transition`}
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
                      className={`w-full px-3 py-2 pr-10 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:border-[#0096c7] transition`}
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
                <div className={`p-3 rounded-xl ${fbSubPanel} space-y-1 text-[11px]`}>
                  <div className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-emerald-400 font-semibold' : fbTextSecondary}`}>
                    <CheckOutlined className="text-[10px]" /> At least 6 characters in length
                  </div>
                  <div className={`flex items-center gap-2 ${newPassword && newPassword === confirmPassword ? 'text-emerald-400 font-semibold' : fbTextSecondary}`}>
                    <CheckOutlined className="text-[10px]" /> Both passwords match exactly
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-5 py-2 rounded-xl bg-[#0096c7] hover:bg-[#0077b6] text-white font-medium text-xs inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {changingPassword ? <Spin size="small" /> : <LockOutlined />}
                    <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 4: CONTACT & ADDRESS (Phone, Shipping Address)
             ------------------------------------------------------------------- */}
          {activeTab === 'contact' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                  Contact & Shipping Address
                </h2>
                <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                  Used for delivery coordination, courier notifications, and emergency account recovery.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className={`p-5 rounded-2xl ${fbPanel} border ${fbBorder} space-y-4`}>
                <div>
                  <label className={`block text-[11px] font-semibold ${fbTextSecondary} mb-1.5`}>
                    Email Address (Account Identity)
                  </label>
                  <div className={`w-full px-3 py-2 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextSecondary} flex items-center justify-between`}>
                    <span>{user?.email || 'user@store.com'}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
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
                    className={`w-full px-3 py-2 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:border-[#0096c7] transition`}
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
                    className={`w-full px-3 py-2 rounded-xl border ${fbBorder} ${fbSubPanel} text-xs ${fbTextPrimary} outline-none focus:border-[#0096c7] transition resize-none`}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 rounded-xl bg-[#0096c7] hover:bg-[#0077b6] text-white font-medium text-xs inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {savingProfile ? <Spin size="small" /> : <SaveOutlined />}
                    <span>{savingProfile ? 'Saving Address...' : 'Save Contact Details'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* -------------------------------------------------------------------
              VIEW 5: LEGAL AGREEMENTS (Reading section & Compliance Status)
             ------------------------------------------------------------------- */}
          {activeTab === 'legal' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className={`text-base font-bold ${fbTextPrimary} tracking-tight`}>
                  Platform Legal Agreements & Terms
                </h2>
                <p className={`text-[11px] ${fbTextSecondary} mt-0.5`}>
                  Compliance obligations, fair trade terms, and privacy policies governing the marketplace.
                </p>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-2xl ${fbPanel} border ${fbBorder} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${agreementAccepted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <FileTextOutlined />
                  </span>
                  <div>
                    <div className={`text-xs font-bold ${fbTextPrimary}`}>
                      Agreement Status:{' '}
                      <span className={agreementAccepted ? 'text-emerald-400' : 'text-amber-400'}>
                        {agreementAccepted ? 'Active & Accepted' : 'Action Required'}
                      </span>
                    </div>
                    <p className={`text-[10px] ${fbTextSecondary} mt-0.5`}>
                      {agreementAccepted
                        ? 'Your account has accepted and adheres to the standard marketplace compliance framework.'
                        : 'Please read the terms below and confirm acceptance.'}
                    </p>
                  </div>
                </div>

                <Tag color={agreementAccepted ? 'green' : 'orange'} className="rounded-full px-2.5 text-[10px] font-semibold">
                  {agreementAccepted ? 'VERIFIED' : 'PENDING'}
                </Tag>
              </div>

              {/* Terms Reader Accordion */}
              <div className={`p-5 rounded-2xl ${fbPanel} border ${fbBorder} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-bold ${fbTextPrimary}`}>
                    Himalaya Marketplace Terms of Service & Merchant Conduct
                  </div>
                  <button
                    type="button"
                    onClick={() => setAgreementExpanded(!agreementExpanded)}
                    className="text-xs text-[#0096c7] font-semibold hover:underline cursor-pointer"
                  >
                    {agreementExpanded ? 'Collapse Agreement' : 'Read Full Document'}
                  </button>
                </div>

                <div
                  className={`p-4 rounded-xl ${fbSubPanel} overflow-y-auto font-mono text-[11px] leading-relaxed transition-all ${
                    agreementExpanded ? 'max-h-96' : 'max-h-36'
                  } ${fbTextSecondary}`}
                >
                  <p className="font-bold mb-2 text-slate-300">1. PARTIES & SCOPE OF SERVICE</p>
                  <p className="mb-3">
                    By accessing or transacting on the Himalaya E-Commerce Platform, you agree to comply with all ethical fair-trade sourcing guidelines, authentic artisan heritage preservation standards, and applicable consumer protection statutes.
                  </p>

                  <p className="font-bold mb-2 text-slate-300">2. ARTISAN INTEGRITY & FAIR SOURCING</p>
                  <p className="mb-3">
                    All sellers guarantee the provenance of handcrafted artifacts, organic herbs, and hand-woven textiles. Counterfeiting, misattribution of origin, or unauthorized factory replications will incur immediate account termination.
                  </p>

                  <p className="font-bold mb-2 text-slate-300">3. PRIVACY & DATA SAFEGUARDS</p>
                  <p className="mb-3">
                    Personal identity credentials, biometric FIDO2 passkeys, and contact coordinates are encrypted under strict role-based access protocols. Customer contact information must not be stored, exported, or reused outside authorized fulfillment transactions.
                  </p>

                  <p className="font-bold mb-2 text-slate-300">4. DISPUTE RESOLUTION & SETTLEMENT</p>
                  <p>
                    All payments are held in escrow until mutual delivery acknowledgment. Disputed items are reviewed by the arbitration committee under the Nepal Commercial Fair Practices Act.
                  </p>
                </div>

                {/* Acceptance Checkbox & Save */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreementAccepted}
                      onChange={(e) => handleToggleAgreement(e.target.checked)}
                      disabled={savingAgreement}
                      className="w-4 h-4 rounded text-[#0096c7] focus:ring-[#0096c7] accent-[#0096c7] cursor-pointer"
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
