import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  DesktopOutlined,
  MobileOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  CopyOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import {
  Tag,
  Switch,
  Progress,
  Input,
  Breadcrumb,
  Popconfirm,
} from 'antd';
import { AppTable, AppButton, AppInput, AppModal } from 'shared-components';
import { useAuth } from 'auth-client/hooks/useAuth';
import { authAPIService } from 'auth-client/services/AuthAPIService';
import { createWebAuthnCredential } from 'auth-client/services/fido2Helper';
import { useToast } from '../../../context/ToastContext';

interface PasskeyItem {
  id: string;
  credentialId: string;
  deviceName: string;
  transports: string[];
  createdAt: string;
  lastUsedAt?: string | null;
}

interface SessionItem {
  id: string;
  ip: string;
  userAgent: string;
  macOrDevice: string;
  lastActive: string;
  expiresAt?: string;
  isCurrent: boolean;
}

interface AuthenticatorSetupData {
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export default function SecurityManagement() {
  const { user, refreshUser, formattedExpiry } = useAuth();
  const { showToast } = useToast();

  const showSuccess = (msg: string) => showToast(msg, 'success');
  const showError = (msg: string) => showToast(msg, 'error');

  const [activeTab, setActiveTab] = useState<'passkeys' | 'sessions' | '2fa' | 'password'>('passkeys');

  // Passkeys state
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [isRegisterPasskeyModalOpen, setIsRegisterPasskeyModalOpen] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [authenticatorData, setAuthenticatorData] = useState<AuthenticatorSetupData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Alerts
  const [alertOnNewDevice, setAlertOnNewDevice] = useState(true);

  // Load Passkeys
  const loadPasskeys = async () => {
    setLoadingPasskeys(true);
    try {
      const res = await authAPIService.getPasskeys();
      if (res.success && Array.isArray(res.data)) {
        setPasskeys(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingPasskeys(false);
    }
  };

  // Load Active Sessions
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await authAPIService.getSessions();
      if (res.success && Array.isArray(res.data)) {
        setSessions(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
    loadSessions();
    if (user) {
      setTwoFactorEnabled(Boolean(user.isTwoFactorEnabled));
      if (typeof user.alertOnNewDevice === 'boolean') {
        setAlertOnNewDevice(user.alertOnNewDevice);
      }
    }
  }, [user]);

  // ===================== Passkey Actions =====================

  const handleRegisterPasskey = async () => {
    if (!user?.email) {
      showError('Please sign in with a valid account first');
      return;
    }

    setRegisteringPasskey(true);
    try {
      const optRes = await authAPIService.getFido2RegisterOptions(user.email);
      if (!optRes.success || !optRes.data) {
        throw new Error(optRes.messages?.[0] || 'Failed to initialize passkey challenge');
      }

      const cred = await createWebAuthnCredential(optRes.data);

      const verifyRes = await authAPIService.verifyFido2Register({
        email: user.email,
        credentialId: cred.credentialId,
        publicKey: cred.publicKey || 'fido2_key_' + Date.now(),
        transports: ['internal', 'usb', 'nfc'],
        deviceName: newPasskeyName.trim() || 'Biometric Security Key',
      } as any);

      if (verifyRes.success) {
        showSuccess(`Passkey "${newPasskeyName.trim() || 'Biometric Key'}" registered successfully!`);
        setIsRegisterPasskeyModalOpen(false);
        setNewPasskeyName('');
        await loadPasskeys();
        await refreshUser();
      } else {
        throw new Error(verifyRes.messages?.[0] || 'Passkey verification failed');
      }
    } catch (err: any) {
      showError(err.message || 'Passkey creation was cancelled or unsupported on this device.');
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (credentialId: string, name: string) => {
    try {
      const res = await authAPIService.deletePasskey(credentialId);
      if (res.success) {
        showSuccess(`Passkey "${name}" removed successfully`);
        await loadPasskeys();
        await refreshUser();
      } else {
        showError(res.messages?.[0] || 'Failed to remove passkey');
      }
    } catch (err: any) {
      showError(err.message || 'Error deleting passkey');
    }
  };

  // ===================== Session Actions =====================

  const handleRevokeSession = async (sessionId: string, ip: string) => {
    try {
      const res = await authAPIService.revokeSession(sessionId);
      if (res.success) {
        showSuccess(`Device session (${ip}) revoked`);
        await loadSessions();
      } else {
        showError(res.messages?.[0] || 'Failed to revoke session');
      }
    } catch (err: any) {
      showError(err.message || 'Error revoking session');
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      const res = await authAPIService.revokeOtherSessions();
      if (res.success) {
        showSuccess('Logged out of all other devices');
        await loadSessions();
      } else {
        showError(res.messages?.[0] || 'Failed to log out other devices');
      }
    } catch (err: any) {
      showError(err.message || 'Error revoking sessions');
    }
  };

  // ===================== 2FA Authenticator Actions =====================

  const handleStart2FASetup = async () => {
    try {
      const res = await authAPIService.setupAuthenticator();
      if (res.success && res.data) {
        setAuthenticatorData(res.data);
        setTotpCode('');
        setIs2FAModalOpen(true);
      } else {
        showError(res.messages?.[0] || 'Failed to start authenticator setup');
      }
    } catch (err: any) {
      showError(err.message || 'Error initiating 2FA');
    }
  };

  const handleVerify2FACode = async () => {
    if (!totpCode || totpCode.trim().length < 6) {
      showError('Please enter the 6-digit code from your authenticator app');
      return;
    }

    setVerifying2FA(true);
    try {
      const res = await authAPIService.verifyAuthenticator(totpCode.trim());
      if (res.success) {
        showSuccess('Two-factor authentication has been activated!');
        setTwoFactorEnabled(true);
        setIs2FAModalOpen(false);
        await refreshUser();
      } else {
        showError(res.messages?.[0] || 'Invalid verification code. Try again.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to verify code');
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const res = await authAPIService.disableAuthenticator();
      if (res.success) {
        showSuccess('Two-factor authentication disabled');
        setTwoFactorEnabled(false);
        await refreshUser();
      } else {
        showError(res.messages?.[0] || 'Failed to disable 2FA');
      }
    } catch (err: any) {
      showError(err.message || 'Error disabling 2FA');
    }
  };

  // ===================== Password & Preferences =====================

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const pwdScore = calculateStrength(newPassword);
  const strengthColor =
    pwdScore <= 25 ? '#ef4444' : pwdScore <= 50 ? '#f59e0b' : pwdScore <= 75 ? '#0284c7' : '#10b981';
  const strengthLabel =
    pwdScore <= 25 ? 'Weak' : pwdScore <= 50 ? 'Fair' : pwdScore <= 75 ? 'Good' : 'Strong & Secure';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showError('Please fill in both current and new passwords');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await authAPIService.changePassword(currentPassword, newPassword);
      if (res.success) {
        showSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showError(res.messages?.[0] || 'Failed to update password');
      }
    } catch (err: any) {
      showError(err.message || 'Error updating password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleAlerts = async (checked: boolean) => {
    setAlertOnNewDevice(checked);
    try {
      await authAPIService.updateSecuritySettings({ alertOnNewDevice: checked });
      showSuccess(checked ? 'New device security alerts enabled' : 'New device alerts disabled');
    } catch {
      setAlertOnNewDevice(!checked);
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden font-['Poppins','Inter',sans-serif] space-y-2.5">
      {/* Top Bar: Breadcrumb Navigation */}
      <div className="px-2 flex items-center justify-between gap-1.5 text-[11px] leading-none text-slate-500 font-semibold shrink-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-500 [&_*]:border-0 font-semibold"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-500 hover:text-[#0096C7] transition-colors font-semibold">
                  Admin
                </Link>
              ),
            },
            {
              title: <span className="text-slate-700 font-semibold">Security & Device Management</span>,
            },
          ]}
        />
      </div>

      {/* Main Two-Column Split (fills remaining vertical space) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Security Management Tabs Canvas (fills space, independent scroll) */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Table Top Controls & Integrated Header */}
          <div className="pl-0 pr-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl shrink-0">
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Security & Device Management
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Pill Tab Selectors */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { key: 'passkeys', label: `Passkeys (${passkeys.length})`, icon: <KeyOutlined /> },
                  { key: 'sessions', label: `Active Sessions (${sessions.length})`, icon: <DesktopOutlined /> },
                  { key: '2fa', label: 'Two-Factor (TOTP)', icon: <SafetyCertificateOutlined /> },
                  { key: 'password', label: 'Password & Alerts', icon: <LockOutlined /> },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content Canvas (independent scroll) */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Tab 1: Biometric Passkeys (AppTable Architecture) */}
            {activeTab === 'passkeys' && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Sub-header Action Strip */}
            <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div>
                <span className="font-bold text-slate-800 text-xs">FIDO2 & WebAuthn Passkeys</span>
                <span className="text-[11px] text-slate-500 ml-2">
                  Sign in with Windows Hello, Touch ID, Face ID, or security keys.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadPasskeys}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <SyncOutlined spin={loadingPasskeys} /> Refresh
                </button>
                <AppButton
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setNewPasskeyName('');
                    setIsRegisterPasskeyModalOpen(true);
                  }}
                  style={{ backgroundColor: '#0096C7' }}
                  size="small"
                >
                  Add Passkey
                </AppButton>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <AppTable wrapperClassName="h-full flex-1 flex flex-col min-h-0" className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="py-2.5 px-6 font-medium text-[12px]">Device & Name</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Credential ID</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Supported Transports</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Created Date</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Last Used</th>
                    <th className="py-2.5 px-6 text-right font-medium text-[12px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {passkeys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <KeyOutlined className="text-3xl text-slate-300 mb-2 block mx-auto" />
                        <span className="font-semibold text-slate-700 block">No biometric passkeys registered yet</span>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Add a passkey to enable frictionless fingerprint or face authentication.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    passkeys.map((pk) => (
                      <tr key={pk.credentialId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 text-sm shrink-0">
                              <KeyOutlined />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{pk.deviceName}</div>
                              <Tag color="success" className="m-0 mt-0.5 text-[9px] font-bold px-1.5 py-0">
                                Active FIDO2
                              </Tag>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                          {pk.credentialId.substring(0, 18)}...
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {Array.isArray(pk.transports) && pk.transports.length > 0 ? (
                              pk.transports.map((t, i) => (
                                <Tag key={i} className="m-0 uppercase text-[9px] font-bold bg-slate-100 text-slate-600 border-slate-200">
                                  {t}
                                </Tag>
                              ))
                            ) : (
                              <Tag className="m-0 uppercase text-[9px] font-bold bg-slate-100 text-slate-600 border-slate-200">
                                Internal
                              </Tag>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                          {new Date(pk.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                          {pk.lastUsedAt ? new Date(pk.lastUsedAt).toLocaleDateString() : (
                            <span className="text-slate-400 italic">Never</span>
                          )}
                        </td>

                        <td className="py-3 px-6 text-right whitespace-nowrap">
                          <Popconfirm
                            title="Remove Passkey"
                            description={`Remove passkey "${pk.deviceName}"? You will not be able to sign in with this device.`}
                            onConfirm={() => handleDeletePasskey(pk.credentialId, pk.deviceName)}
                            okText="Yes, Remove"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <AppButton size="small" danger icon={<DeleteOutlined />} title="Remove Passkey" />
                          </Popconfirm>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </AppTable>
            </div>

            {/* Signature Cyan Footer */}
            <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-medium text-white/90 text-[11px] leading-none">Registered Passkeys:</span>
                <span className="font-bold text-white text-[11px] leading-none">
                  {passkeys.length} Credentials
                </span>
              </div>
              <span className="text-white/90 text-[10px]">FIDO2 / WebAuthn Level 3 Security</span>
            </div>
          </div>
        )}

        {/* Tab 2: Active Sessions (AppTable Architecture) */}
        {activeTab === 'sessions' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Sub-header Action Strip */}
            <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div>
                <span className="font-bold text-slate-800 text-xs">Active Device Sessions</span>
                <span className="text-[11px] text-slate-500 ml-2">
                  Monitor authenticated devices and revoke suspicious or stale sessions immediately.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSessions}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <SyncOutlined spin={loadingSessions} /> Refresh
                </button>
                <Popconfirm
                  title="Log out of other devices"
                  description="This will terminate all other active sign-in sessions except this current browser window. Are you sure?"
                  onConfirm={handleRevokeOtherSessions}
                  okText="Log Out Others"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <AppButton
                    size="small"
                    danger
                    disabled={sessions.length <= 1}
                  >
                    Log Out Other Devices
                  </AppButton>
                </Popconfirm>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <AppTable wrapperClassName="h-full flex-1 flex flex-col min-h-0" className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="py-2.5 px-6 font-medium text-[12px]">Device & Browser</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Network IP</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Session Status</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Last Active</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Token Expiry</th>
                    <th className="py-2.5 px-6 text-right font-medium text-[12px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No active sessions found.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((sess) => {
                      const isMobile = sess.userAgent.toLowerCase().includes('mobile');
                      const browserName = sess.userAgent.includes('Chrome')
                        ? 'Google Chrome'
                        : sess.userAgent.includes('Firefox')
                        ? 'Mozilla Firefox'
                        : sess.userAgent.includes('Safari')
                        ? 'Apple Safari'
                        : 'Web Browser';

                      return (
                        <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#0284c7] text-sm shrink-0">
                                {isMobile ? <MobileOutlined /> : <DesktopOutlined />}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{browserName}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                  {sess.userAgent}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <GlobalOutlined className="text-slate-400" />
                              {sess.ip}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {sess.isCurrent ? (
                              <Tag color="success" className="font-bold text-[10px] px-2 py-0.5 rounded-full m-0">
                                Current Session
                              </Tag>
                            ) : (
                              <Tag color="default" className="font-medium text-[10px] px-2 py-0.5 rounded-full m-0">
                                Active Device
                              </Tag>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                            {new Date(sess.lastActive).toLocaleString()}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                            {sess.expiresAt ? new Date(sess.expiresAt).toLocaleString() : (formattedExpiry || '24h Active')}
                          </td>

                          <td className="py-3 px-6 text-right whitespace-nowrap">
                            {sess.isCurrent ? (
                              <span className="text-[11px] text-slate-400 italic">This Device</span>
                            ) : (
                              <AppButton
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleRevokeSession(sess.id, sess.ip)}
                                title="Revoke Session"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </AppTable>
            </div>

            {/* Signature Cyan Footer */}
            <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-medium text-white/90 text-[11px] leading-none">Active Devices:</span>
                <span className="font-bold text-white text-[11px] leading-none">
                  {sessions.length} Signed-in Sessions
                </span>
              </div>
              <span className="text-white/90 text-[10px]">JWT In-Memory + Redis Revocation Guard</span>
            </div>
          </div>
        )}

        {/* Tab 3: Two-Factor Authenticator (TOTP) */}
        {activeTab === '2fa' && (
          <div className="flex-1 min-h-0 overflow-y-auto p-6 max-w-2xl space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <SafetyCertificateOutlined className="text-[#0096C7]" />
                  <span>Google / Microsoft Authenticator (TOTP)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Require a 6-digit one-time passcode generated by your mobile authenticator app when signing in.
                </p>
              </div>

              {twoFactorEnabled ? (
                <Popconfirm
                  title="Disable Two-Factor Authentication"
                  description="Are you sure you want to disable 2FA? This will reduce the security level of your account."
                  onConfirm={handleDisable2FA}
                  okText="Yes, Disable"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <AppButton danger size="small">
                    Disable 2FA
                  </AppButton>
                </Popconfirm>
              ) : (
                <AppButton
                  type="primary"
                  onClick={handleStart2FASetup}
                  style={{ backgroundColor: '#0096C7' }}
                  size="small"
                >
                  Set Up 2FA
                </AppButton>
              )}
            </div>

            {twoFactorEnabled ? (
              <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl flex items-center gap-3">
                <CheckCircleOutlined className="text-emerald-600 text-2xl shrink-0" />
                <div>
                  <div className="font-bold text-sm text-emerald-900">Two-Factor Authentication is Active</div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    Your account is fully protected with time-based one-time passcodes (RFC 6238 standard).
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2 bg-white">
                <div className="font-bold text-slate-800 text-xs">How it works:</div>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">1</span>
                  Install Google Authenticator, Microsoft Authenticator, or 1Password.
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">2</span>
                  Scan the secure QR code or enter the secret setup key.
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">3</span>
                  Enter the 6-digit verification code to activate protection.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Password & Alerts */}
        {activeTab === 'password' && (
          <div className="flex-1 min-h-0 overflow-y-auto p-6 max-w-xl space-y-6">
            <form id="password-change-form" onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LockOutlined className="text-[#0096C7]" />
                <span>Update Account Password</span>
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Current Password *</label>
                <Input.Password
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rounded-lg py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">New Password *</label>
                <Input.Password
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg py-2"
                />
                {newPassword && (
                  <div className="pt-1.5 space-y-1">
                    <Progress
                      percent={pwdScore}
                      showInfo={false}
                      strokeColor={strengthColor}
                      size="small"
                    />
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Strength:</span>
                      <span style={{ color: strengthColor }} className="font-bold">
                        {strengthLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Confirm New Password *</label>
                <Input.Password
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg py-2"
                />
              </div>

              <AppButton
                type="primary"
                htmlType="submit"
                loading={changingPassword}
                style={{ backgroundColor: '#0096C7' }}
              >
                Update Password
              </AppButton>
            </form>

            {/* Security Alerts */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BellOutlined className="text-emerald-600" />
                <span>Security Notifications</span>
              </h3>
              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                <div>
                  <div className="text-xs font-bold text-slate-800">Alert on new device sign-in</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Receive immediate notifications whenever an unrecognized IP address accesses your account.
                  </div>
                </div>
                <Switch checked={alertOnNewDevice} onChange={handleToggleAlerts} />
              </div>
            </div>
          </div>
        )}
          </div>
        </div>

        {/* Right Column: Contextual Action + Security Health Summary (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: Contextual Action Button */}
          <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
            {activeTab === 'passkeys' && (
              <button
                type="button"
                onClick={() => {
                  setNewPasskeyName('');
                  setIsRegisterPasskeyModalOpen(true);
                }}
                className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <PlusOutlined className="text-xs" />
                <span>Add New Passkey</span>
              </button>
            )}
            {activeTab === 'sessions' && (
              <button
                type="button"
                onClick={loadSessions}
                className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <SyncOutlined className={`text-xs ${loadingSessions ? 'animate-spin' : ''}`} />
                <span>Refresh Sessions</span>
              </button>
            )}
            {activeTab === '2fa' && (
              twoFactorEnabled ? (
                <Popconfirm
                  title="Disable Two-Factor Authentication"
                  description="Are you sure you want to disable 2FA? This will reduce the security level of your account."
                  onConfirm={handleDisable2FA}
                  okText="Yes, Disable"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <button
                    type="button"
                    className="w-full h-[32px] flex items-center justify-center gap-1.5 font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                  >
                    <SafetyCertificateOutlined className="text-xs" />
                    <span>Disable 2FA</span>
                  </button>
                </Popconfirm>
              ) : (
                <button
                  type="button"
                  onClick={handleStart2FASetup}
                  className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <SafetyCertificateOutlined className="text-xs" />
                  <span>Set Up Two-Factor</span>
                </button>
              )
            )}
            {activeTab === 'password' && (
              <button
                type="button"
                onClick={() => {
                  const form = document.getElementById('password-change-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                disabled={changingPassword}
                className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <LockOutlined className="text-xs" />
                <span>{changingPassword ? 'Updating...' : 'Save New Password'}</span>
              </button>
            )}
          </div>

          {/* Card 2: Security Health Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Security Health</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Protected
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Biometric Keys */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Biometric Keys
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {passkeys.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    FIDO2 / WebAuthn passkeys
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center text-lg shrink-0">
                  <KeyOutlined />
                </div>
              </div>

              {/* Metric 2: Active Sessions */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Active Sessions
                  </span>
                  <span className="text-2xl font-black text-[#0284c7] leading-tight block">
                    {sessions.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Authenticated clients
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-lg shrink-0">
                  <DesktopOutlined />
                </div>
              </div>

              {/* Metric 3: Two-Factor Auth */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Two-Factor Auth
                  </span>
                  <span className={`text-2xl font-black leading-tight block ${twoFactorEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {twoFactorEnabled ? 'Active' : 'Disabled'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Time-based OTP token
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                  <SafetyCertificateOutlined />
                </div>
              </div>

              {/* Metric 4: Session Expiry */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Session Expiry
                  </span>
                  <span className="text-base font-black text-slate-900 leading-tight block truncate max-w-[170px]" title={formattedExpiry || '24h Active'}>
                    {formattedExpiry || '24h Active'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Active token duration
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-lg shrink-0">
                  <ClockCircleOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Register Passkey */}
      <AppModal
        title="Register Biometric Passkey / Security Key"
        open={isRegisterPasskeyModalOpen}
        onCancel={() => {
          if (!registeringPasskey) setIsRegisterPasskeyModalOpen(false);
        }}
        onOk={handleRegisterPasskey}
        confirmLoading={registeringPasskey}
        okText="Start Biometric Prompt"
        width={500}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Give this passkey a friendly nickname so you can identify it (e.g. <em>"MacBook Touch ID"</em>, <em>"Windows Hello Office"</em>, or <em>"YubiKey 5C"</em>).
          </p>

          <div className="space-y-1">
            <AppInput
              label="Passkey Nickname *"
              placeholder="e.g. My Laptop Biometrics"
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            <strong>Device prompt:</strong> Clicking "Start Biometric Prompt" will trigger your browser's native WebAuthn dialog to touch your sensor or insert your security key.
          </div>
        </div>
      </AppModal>

      {/* Modal: 2FA Authenticator Setup */}
      <AppModal
        title="Set Up Two-Factor Authenticator"
        open={is2FAModalOpen}
        onCancel={() => setIs2FAModalOpen(false)}
        onOk={handleVerify2FACode}
        confirmLoading={verifying2FA}
        okText="Verify & Activate"
        width={500}
      >
        {authenticatorData && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600">
              Enter the secret key manually or scan in your authenticator app:
            </div>

            {/* Manual Secret Key */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Manual Setup Key</div>
                <div className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                  {authenticatorData.manualEntryKey}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(authenticatorData.secret);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="text-xs text-[#0096C7] hover:text-[#007AA3] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <CopyOutlined /> {copiedKey ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* 6-Digit Code Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Enter 6-Digit Code</label>
              <Input
                placeholder="123456"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="rounded-lg py-2 text-center text-lg font-mono tracking-widest"
              />
            </div>

            {/* Emergency Backup Codes */}
            {authenticatorData.backupCodes?.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700">Emergency Recovery Codes:</div>
                <div className="text-[11px] text-slate-500 mb-1.5">
                  Save these codes in a safe place. You can use each code once if you lose your phone.
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                  {authenticatorData.backupCodes.map((c, i) => (
                    <div key={i} className="p-1 bg-white rounded border border-slate-200 text-center">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AppModal>
    </div>
  );
}
