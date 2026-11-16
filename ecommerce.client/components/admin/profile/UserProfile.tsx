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
} from '@ant-design/icons';
import { Tag, Spin, Divider } from 'antd';
import { useAuth } from 'auth-client/hooks/useAuth';
import { authAPIService } from 'auth-client/services/AuthAPIService';
import { useToast } from '../../../context/ToastContext';
import { AppCard, AppButton, PageHeader } from 'shared-components';

export const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Agreement Reading Modal / Expand State
  const [isAgreementExpanded, setIsAgreementExpanded] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [savingAgreement, setSavingAgreement] = useState(false);

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

  return (
    <div className="space-y-6 w-full font-['Poppins','Inter',sans-serif]">
      {/* Header */}
      <PageHeader
        title="Personal Profile & Account"
        description="Manage your profile picture, personal identity, security credentials, and legal agreements."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Profile' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Avatar & Account Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <AppCard className="p-6 rounded-2xl border border-slate-200/80 shadow-xs bg-white text-center">
            {/* Avatar Container */}
            <div className="relative inline-block mx-auto mb-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-orange-400 shadow-md ring-4 ring-orange-50 mx-auto"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-3xl shadow-md ring-4 ring-orange-50 mx-auto">
                  {avatarInitial}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-900 text-white hover:bg-orange-600 shadow-md transition-all cursor-pointer text-xs"
                title="Upload Photo"
              >
                <UploadOutlined />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            <h3 className="text-base font-bold text-slate-900">{displayName}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{user?.email}</p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Tag color="processing" className="m-0 font-bold font-mono text-[11px] uppercase px-2.5 py-0.5 rounded-full">
                {user?.role || 'User'}
              </Tag>
              {user?.role === 'seller' && (
                <Tag color="orange" className="m-0 font-semibold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShopOutlined /> Verified Artisan
                </Tag>
              )}
              {user?.hasPasskey && (
                <Tag color="success" className="m-0 font-semibold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <KeyOutlined /> Passkey Ready
                </Tag>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
              <AppButton
                size="small"
                icon={<UploadOutlined />}
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </AppButton>
              {avatarUrl && (
                <AppButton
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemovePhoto}
                >
                  Remove
                </AppButton>
              )}
            </div>

            <p className="text-[10px] text-slate-400 mt-2">
              JPG, PNG or WEBP. Max 2MB file size.
            </p>
          </AppCard>

          {/* Account Security & Health Card */}
          <AppCard className="p-5 rounded-2xl border border-slate-200/80 shadow-xs bg-white space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <SafetyCertificateOutlined className="text-orange-500 text-sm" />
              <span>Security Status</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Biometric Passkey</span>
                <span className={user?.hasPasskey ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'}>
                  {user?.hasPasskey ? 'Active (Ready)' : 'Not Registered'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">2-Factor Authentication</span>
                <span className={user?.isTwoFactorEnabled ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'}>
                  {user?.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Platform Agreement</span>
                <span className={agreementAccepted ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {agreementAccepted ? 'Signed & Accepted' : 'Pending'}
                </span>
              </div>
            </div>
          </AppCard>
        </div>

        {/* Right Column: Profile Edit Form, Password & Agreement */}
        <div className="lg:col-span-8 space-y-6">
          {/* Personal Information Card */}
          <AppCard className="p-6 rounded-2xl border border-slate-200/80 shadow-xs bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                <p className="text-xs text-slate-400 mt-0.5">Update your basic profile name, bio, and delivery address.</p>
              </div>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-sm font-bold">
                <UserOutlined />
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Dorje"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#0284c7] bg-slate-50/50"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sherpa"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#0284c7] bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-500 text-xs bg-slate-100 cursor-not-allowed"
                    />
                    <MailOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Account login identifier cannot be altered.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977 980-0000000"
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#0284c7] bg-slate-50/50"
                    />
                    <PhoneOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Residential / Business Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Thamel Marg, Ward 26, Kathmandu, Nepal"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#0284c7] bg-slate-50/50"
                  />
                  <EnvironmentOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  About You / Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio, craftsman background, or account summary..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#0284c7] bg-slate-50/50 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <AppButton
                  type="primary"
                  htmlType="submit"
                  loading={savingProfile}
                  icon={<SaveOutlined />}
                  style={{ backgroundColor: '#0284c7' }}
                >
                  Save Profile Changes
                </AppButton>
              </div>
            </form>
          </AppCard>

          {/* Change Password Card */}
          <AppCard className="p-6 rounded-2xl border border-slate-200/80 shadow-xs bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ensure your account is protected with a secure and complex password.</p>
              </div>
              <span className="w-8 h-8 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center text-sm font-bold">
                <LockOutlined />
              </span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-orange-500 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-orange-500 bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-orange-500 bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <AppButton
                  type="primary"
                  htmlType="submit"
                  loading={changingPassword}
                  icon={<KeyOutlined />}
                  style={{ backgroundColor: '#f97316' }}
                >
                  Update Password
                </AppButton>
              </div>
            </form>
          </AppCard>

          {/* Platform Legal & User Agreement Reading Section */}
          <AppCard className="p-6 rounded-2xl border border-slate-200/80 shadow-xs bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Platform Agreement & Legal Terms</h3>
                <p className="text-xs text-slate-400 mt-0.5">Read and review the platform terms of service, artisan guidelines, and user agreement.</p>
              </div>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                <FileTextOutlined />
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    Himalaya Online Shop Platform & Artisan User Agreement
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Version 1.0 (Active) • Governed by Nepal E-Commerce & Fair Trade Laws
                  </div>
                </div>

                {agreementAccepted ? (
                  <Tag color="success" className="m-0 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircleOutlined /> Signed & Accepted
                  </Tag>
                ) : (
                  <Tag color="warning" className="m-0 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                    Pending Acceptance
                  </Tag>
                )}
              </div>

              {/* Collapsible Agreement Reader */}
              <div className="border border-slate-200 rounded-xl bg-white p-4 max-h-56 overflow-y-auto text-[11px] text-slate-600 space-y-2.5 leading-relaxed">
                <p className="font-bold text-slate-800">1. Acceptance of Terms & Dual-Persona Rights</p>
                <p>
                  By creating an account on the Himalaya Online Shop platform, you agree to comply with all fair trade, customer protection, and digital marketplace policies. Users registered as Sellers are granted dual-persona access, allowing full purchasing and artisan vendor operations under a single unified credential.
                </p>

                <p className="font-bold text-slate-800">2. Artisan Authenticity & Product Integrity</p>
                <p>
                  Sellers and vendor artisans warrant that all listed woolens, singing bowls, hand-crafted artifacts, and herbal products originate from authentic Himalayan workshops. Misleading documentation or counterfeit claims will result in immediate suspension.
                </p>

                <p className="font-bold text-slate-800">3. Data Privacy & Credential Security</p>
                <p>
                  Account credentials, biometric passkeys (FIDO2/WebAuthn), and two-factor authentication tokens are confidential. Device recognition metadata is collected solely for security tracking and unauthorized access mitigation.
                </p>

                <p className="font-bold text-slate-800">4. Dispute Resolution & Storefront Fulfillment</p>
                <p>
                  Orders placed through the customer store must be fulfilled within the agreed timelines. Customers and sellers agree to good-faith mediation through the platform administration for any return or refund claims.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {user?.agreementAcceptedAt ? `Accepted on ${new Date(user.agreementAcceptedAt).toLocaleDateString()}` : 'Review and confirm your compliance'}
                </span>

                <AppButton
                  size="small"
                  type={agreementAccepted ? 'default' : 'primary'}
                  loading={savingAgreement}
                  onClick={() => handleToggleAgreement(!agreementAccepted)}
                >
                  {agreementAccepted ? 'Re-confirm Agreement' : 'Accept Terms & Sign'}
                </AppButton>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
