import React, { useState, useEffect } from 'react';
import {
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  DesktopOutlined,
  MobileOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  QrcodeOutlined,
  CopyOutlined,
  SyncOutlined,
  UsbOutlined,
} from '@ant-design/icons';
import {
  Tabs,
  Tag,
  Tooltip,
  Modal,
  Switch,
  Progress,
  Input,
  Badge,
} from 'antd';
import { AppButton } from 'shared-components';
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
  isCurrent: boolean;
}

interface AuthenticatorSetupData {
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export default function SecurityManagement() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const showSuccess = (msg: string) => showToast(msg, 'success');
  const showError = (msg: string) => showToast(msg, 'error');
  const showInfo = (msg: string) => showToast(msg, 'info');

  const [activeTab, setActiveTab] = useState('passkeys');
  const [loading, setLoading] = useState(false);

  // Passkeys state
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
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
    try {
      const res = await authAPIService.getPasskeys();
      if (res.success && Array.isArray(res.data)) {
        setPasskeys(res.data);
      }
    } catch {
      // Fallback
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
      // Step 1: Request attestation options from server
      const optRes = await authAPIService.getFido2RegisterOptions(user.email);
      if (!optRes.success || !optRes.data) {
        throw new Error(optRes.messages?.[0] || 'Failed to initialize passkey challenge');
      }

      // Step 2: Browser navigator.credentials.create
      const cred = await createWebAuthnCredential(optRes.data);

      // Step 3: Verify with server and save
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
    Modal.confirm({
      title: 'Remove Passkey',
      content: `Are you sure you want to remove "${name}"? You will not be able to use it for biometric sign-in.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await authAPIService.deletePasskey(credentialId);
          if (res.success) {
            showSuccess('Passkey removed successfully');
            await loadPasskeys();
            await refreshUser();
          } else {
            showError(res.messages?.[0] || 'Failed to remove passkey');
          }
        } catch (err: any) {
          showError(err.message || 'Error deleting passkey');
        }
      },
    });
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
    Modal.confirm({
      title: 'Log out of other devices',
      content: 'This will terminate all other active sign-in sessions except this current browser window. Are you sure?',
      okText: 'Log Out Others',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
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
      },
    });
  };

  // ===================== 2FA Authenticator Actions =====================

  const handleStart2FASetup = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    Modal.confirm({
      title: 'Disable Two-Factor Authentication',
      content: 'Are you sure you want to disable 2FA? This will reduce the security level of your account.',
      okText: 'Disable 2FA',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
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
      },
    });
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
  const strengthColor = pwdScore <= 25 ? '#ef4444' : pwdScore <= 50 ? '#f59e0b' : pwdScore <= 75 ? '#0284c7' : '#10b981';
  const strengthLabel = pwdScore <= 25 ? 'Weak' : pwdScore <= 50 ? 'Fair' : pwdScore <= 75 ? 'Good' : 'Strong & Secure';

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
      // Revert if error
      setAlertOnNewDevice(!checked);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-orange-500 to-[#0284c7] text-white rounded-xl shadow-xs text-lg">
              <LockOutlined />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & Device Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Modeled from .NET passwordless architecture: biometric passkeys, hardware security keys, TOTP 2FA, and active session controls.
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2">
            <KeyOutlined className="text-orange-600 text-sm" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-medium">Passkeys</div>
              <div className="text-xs font-bold text-slate-800">{passkeys.length} Registered</div>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2">
            <SafetyCertificateOutlined className="text-sky-600 text-sm" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-medium">2FA Authenticator</div>
              <div className={`text-xs font-bold ${twoFactorEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                {twoFactorEnabled ? 'Active' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2">
            <DesktopOutlined className="text-slate-600 text-sm" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-medium">Active Devices</div>
              <div className="text-xs font-bold text-slate-800">{sessions.length} Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-admin-tabs px-6 pt-4"
          items={[
            {
              key: 'passkeys',
              label: (
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <KeyOutlined />
                  <span>Biometric Passkeys & FIDO2</span>
                  <Badge count={passkeys.length} style={{ backgroundColor: '#f97316' }} />
                </span>
              ),
              children: (
                <div className="py-4 space-y-6">
                  {/* Hero Callout */}
                  <div className="p-4 bg-gradient-to-r from-orange-50/70 via-white to-blue-50/70 border border-orange-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 text-xl font-bold">
                        ⚡
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Passwordless Biometric Sign-in</h4>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                          Sign in securely with Windows Hello, Touch ID, Face ID, or a FIDO2 hardware security key (YubiKey). Your private key never leaves your physical device.
                        </p>
                      </div>
                    </div>
                    <AppButton
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setNewPasskeyName('');
                        setIsRegisterPasskeyModalOpen(true);
                      }}
                      style={{ backgroundColor: '#f97316' }}
                    >
                      Add New Passkey
                    </AppButton>
                  </div>

                  {/* Registered Passkeys List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span>Registered Security Credentials</span>
                        <Tag color="orange">{passkeys.length}</Tag>
                      </h3>
                      <button
                        type="button"
                        onClick={loadPasskeys}
                        className="text-xs text-slate-500 hover:text-orange-600 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <SyncOutlined /> Refresh
                      </button>
                    </div>

                    {passkeys.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <KeyOutlined className="text-4xl text-slate-300 mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">No passkeys registered yet</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                          Protect your account by adding a biometric authenticator or hardware security key.
                        </p>
                        <AppButton
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setNewPasskeyName('');
                            setIsRegisterPasskeyModalOpen(true);
                          }}
                          style={{ backgroundColor: '#f97316' }}
                        >
                          Register First Passkey
                        </AppButton>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {passkeys.map((pk) => (
                          <div
                            key={pk.credentialId}
                            className="p-4 border border-slate-200 rounded-2xl bg-white hover:border-orange-300 hover:shadow-sm transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="p-2 bg-orange-100 text-orange-600 rounded-xl text-base">
                                  <KeyOutlined />
                                </span>
                                <div>
                                  <div className="font-bold text-sm text-slate-900">{pk.deviceName}</div>
                                  <div className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                                    ID: {pk.credentialId.substring(0, 16)}...
                                  </div>
                                </div>
                              </div>
                              <Tag color="green">Active</Tag>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Created:</span>
                                <span>{new Date(pk.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Last used:</span>
                                <span>{pk.lastUsedAt ? new Date(pk.lastUsedAt).toLocaleDateString() : 'Never'}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeletePasskey(pk.credentialId, pk.deviceName)}
                                className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <DeleteOutlined /> Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'sessions',
              label: (
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <DesktopOutlined />
                  <span>Active Sessions & Devices</span>
                  <Badge count={sessions.length} style={{ backgroundColor: '#0284c7' }} />
                </span>
              ),
              children: (
                <div className="py-4 space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Signed-in Devices</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Devices that have authenticated into your account. Revoke any unrecognized sessions immediately.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadSessions}
                        className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <SyncOutlined spin={loadingSessions} /> Refresh
                      </button>
                      <AppButton
                        type="default"
                        danger
                        onClick={handleRevokeOtherSessions}
                        disabled={sessions.length <= 1}
                      >
                        Log Out Other Devices
                      </AppButton>
                    </div>
                  </div>

                  {/* Sessions List */}
                  <div className="space-y-3">
                    {sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className={`p-4 border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                          sess.isCurrent
                            ? 'border-emerald-200 bg-emerald-50/30 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`p-2.5 rounded-xl text-lg ${
                              sess.isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {sess.userAgent.toLowerCase().includes('mobile') ? (
                              <MobileOutlined />
                            ) : (
                              <DesktopOutlined />
                            )}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {sess.userAgent.includes('Chrome')
                                  ? 'Google Chrome'
                                  : sess.userAgent.includes('Firefox')
                                  ? 'Mozilla Firefox'
                                  : sess.userAgent.includes('Safari')
                                  ? 'Apple Safari'
                                  : 'Web Browser'}
                              </span>
                              {sess.isCurrent && (
                                <Tag color="success" className="font-semibold text-[10px]">
                                  Current Device
                                </Tag>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="flex items-center gap-1">
                                <GlobalOutlined className="text-slate-400" />
                                <strong>IP:</strong> {sess.ip}
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Last active:</strong> {new Date(sess.lastActive).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id, sess.ip)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1.5 border border-red-200 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          >
                            Revoke Access
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: '2fa',
              label: (
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <SafetyCertificateOutlined />
                  <span>Two-Factor Authenticator</span>
                </span>
              ),
              children: (
                <div className="py-4 max-w-2xl space-y-6">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Google / Microsoft Authenticator (TOTP)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Require a 6-digit one-time passcode generated by your mobile authenticator app when signing in.
                      </p>
                    </div>
                    {twoFactorEnabled ? (
                      <AppButton danger onClick={handleDisable2FA}>
                        Disable 2FA
                      </AppButton>
                    ) : (
                      <AppButton
                        type="primary"
                        onClick={handleStart2FASetup}
                        style={{ backgroundColor: '#0284c7' }}
                      >
                        Set Up Authenticator
                      </AppButton>
                    )}
                  </div>

                  {twoFactorEnabled ? (
                    <div className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-2xl flex items-center gap-3">
                      <CheckCircleOutlined className="text-emerald-600 text-xl" />
                      <div>
                        <div className="font-bold text-sm text-emerald-900">Two-Factor Authentication is Active</div>
                        <div className="text-xs text-emerald-700">
                          Your account is protected with time-based one-time passcodes (RFC 6238).
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-slate-200 rounded-2xl text-xs text-slate-500 space-y-2">
                      <div className="font-bold text-slate-700 text-sm">How it works:</div>
                      <p>1. Open Google Authenticator, Microsoft Authenticator, or 1Password.</p>
                      <p>2. Scan the provided QR code or type the secret key manually.</p>
                      <p>3. Enter the 6-digit confirmation code to link your authenticator app.</p>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'password',
              label: (
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <LockOutlined />
                  <span>Password & Alerts</span>
                </span>
              ),
              children: (
                <div className="py-4 max-w-xl space-y-6">
                  {/* Change Password Card */}
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Change Password</h3>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Current Password</label>
                      <Input.Password
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="rounded-xl py-2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">New Password</label>
                      <Input.Password
                        placeholder="New strong password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl py-2"
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
                      <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                      <Input.Password
                        placeholder="Re-type new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl py-2"
                      />
                    </div>

                    <AppButton
                      type="primary"
                      htmlType="submit"
                      loading={changingPassword}
                      style={{ backgroundColor: '#0284c7' }}
                    >
                      Update Password
                    </AppButton>
                  </form>

                  {/* Security Alert Settings */}
                  <div className="pt-6 border-t border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Security Alerts</h3>
                    <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Alert on new device sign-in</div>
                        <div className="text-[11px] text-slate-500">
                          Receive security notifications whenever an unrecognized IP address or device accesses your account.
                        </div>
                      </div>
                      <Switch checked={alertOnNewDevice} onChange={handleToggleAlerts} />
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Modal: Register Passkey */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg text-sm">
              <KeyOutlined />
            </span>
            <span className="font-bold text-sm text-slate-900">Register Biometric Passkey / Security Key</span>
          </div>
        }
        open={isRegisterPasskeyModalOpen}
        onCancel={() => {
          if (!registeringPasskey) setIsRegisterPasskeyModalOpen(false);
        }}
        footer={[
          <AppButton key="cancel" disabled={registeringPasskey} onClick={() => setIsRegisterPasskeyModalOpen(false)}>
            Cancel
          </AppButton>,
          <AppButton
            key="submit"
            type="primary"
            loading={registeringPasskey}
            onClick={handleRegisterPasskey}
            style={{ backgroundColor: '#f97316' }}
          >
            Start Biometric Prompt
          </AppButton>,
        ]}
      >
        <div className="py-3 space-y-4">
          <p className="text-xs text-slate-600">
            Give this passkey a friendly name so you can identify it (e.g. <em>"MacBook Touch ID"</em>, <em>"Windows Hello Office"</em>, or <em>"YubiKey 5C"</em>).
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Passkey Nickname</label>
            <Input
              placeholder="e.g. My Laptop Biometrics"
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              className="rounded-xl py-2"
              autoFocus
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            <strong>Device prompt:</strong> Clicking "Start Biometric Prompt" will trigger your browser's native WebAuthn dialog to touch your sensor or insert your security key.
          </div>
        </div>
      </Modal>

      {/* Modal: 2FA Authenticator Setup */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-100 text-sky-600 rounded-lg text-sm">
              <SafetyCertificateOutlined />
            </span>
            <span className="font-bold text-sm text-slate-900">Set Up Two-Factor Authenticator</span>
          </div>
        }
        open={is2FAModalOpen}
        onCancel={() => setIs2FAModalOpen(false)}
        footer={[
          <AppButton key="cancel" onClick={() => setIs2FAModalOpen(false)}>
            Cancel
          </AppButton>,
          <AppButton
            key="submit"
            type="primary"
            loading={verifying2FA}
            onClick={handleVerify2FACode}
            style={{ backgroundColor: '#0284c7' }}
          >
            Verify & Activate
          </AppButton>,
        ]}
      >
        {authenticatorData && (
          <div className="py-2 space-y-4">
            <div className="text-xs text-slate-600">
              Scan this QR code in Google Authenticator or enter the secret key manually:
            </div>

            {/* Manual Secret Key */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Manual Setup Key</div>
                <div className="font-mono text-sm font-bold text-slate-900 tracking-wider">
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
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <CopyOutlined /> {copiedKey ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* 6-Digit Code Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Enter 6-Digit Authenticator Code</label>
              <Input
                placeholder="123456"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="rounded-xl py-2 text-center text-lg font-mono tracking-widest"
              />
            </div>

            {/* Emergency Backup Codes */}
            {authenticatorData.backupCodes?.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700">Emergency Recovery Codes:</div>
                <div className="text-[11px] text-slate-500 mb-1.5">
                  Save these codes in a safe place. You can use each code once if you lose your phone.
                </div>
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
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
      </Modal>
    </div>
  );
}
