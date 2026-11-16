import { useState, useEffect } from 'react';
import type { LoginFormProps } from './LoginForm.types';
import { authAPIService } from '../../services/AuthAPIService';
import {
  CheckOutlined,
  ThunderboltOutlined,
  ShopOutlined,
  UserSwitchOutlined,
  KeyOutlined,
} from '@ant-design/icons';

export const LoginForm = ({
  onSubmit,
  onSubmitFido2,
  onSubmitGoogle,
  isLoading,
  error,
  onRegisterClick,
}: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [recognizedUser, setRecognizedUser] = useState<any | null>(null);
  const [cachedRecognizedUser, setCachedRecognizedUser] = useState<any | null>(null);
  const [isDifferentAccount, setIsDifferentAccount] = useState(false);
  const [lookupUser, setLookupUser] = useState<{
    firstName?: string;
    hasPasskey?: boolean;
    requiresAuthenticator?: boolean;
  } | null>(null);
  const [requiresTotp, setRequiresTotp] = useState(false);

  // Check if current device/IP matches a previously authenticated user with registered passkey
  useEffect(() => {
    let isMounted = true;
    authAPIService
      .getRememberedDevice()
      .then((res) => {
        if (
          isMounted &&
          res.success &&
          res.data?.recognized &&
          res.data.user &&
          res.data.user.hasPasskey
        ) {
          setRecognizedUser(res.data);
          setCachedRecognizedUser(res.data);
          setEmail(res.data.user.email);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Lookup user when email changes (matching Passwordless-Authentication lookup)
  useEffect(() => {
    if (!email || !email.includes('@') || email.length < 5) {
      setLookupUser(null);
      return;
    }

    const timer = setTimeout(() => {
      authAPIService
        .lookup(email)
        .then((res) => {
          if (res.success && res.data) {
            setLookupUser(res.data);
            if (res.data.requiresAuthenticator) {
              setRequiresTotp(true);
            }
          } else {
            setLookupUser(null);
          }
        })
        .catch(() => setLookupUser(null));
    }, 450);

    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (error === '2FA_REQUIRED') {
      setRequiresTotp(true);
      setInfoNotice('Two-Factor Authentication is enabled on your account. Please enter your 6-digit authenticator code.');
    }
  }, [error]);

  const hasRecognizedPasskey = Boolean(
    recognizedUser &&
    recognizedUser.user &&
    recognizedUser.user.hasPasskey &&
    !isDifferentAccount
  );

  const displayEmail = recognizedUser?.user?.email || '';
  const displayName =
    recognizedUser?.user?.username ||
    (displayEmail.includes('@') ? displayEmail.split('@')[0] : '') ||
    displayEmail ||
    'User';
  const avatarInitial = (displayName?.[0] || displayEmail?.[0] || 'U').toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasRecognizedPasskey) {
      handleFido2Click(recognizedUser?.user?.email);
      return;
    }
    onSubmit?.({ email, password, totpCode: totpCode.trim() });
  };

  const handleDifferentAccountClick = () => {
    setIsDifferentAccount(true);
    setRecognizedUser(null);
    setEmail('');
    setPassword('');
    setTotpCode('');
    setLookupUser(null);
    setInfoNotice(null);
  };

  const handleSwitchBackToRecognized = () => {
    if (cachedRecognizedUser) {
      setIsDifferentAccount(false);
      setRecognizedUser(cachedRecognizedUser);
      setEmail(cachedRecognizedUser.user.email);
      setPassword('');
      setLookupUser(null);
    }
  };

  const handleFido2Click = (targetEmail?: string) => {
    const emailToUse = targetEmail || email;
    if (onSubmitFido2) {
      onSubmitFido2(emailToUse);
    } else {
      setInfoNotice('FIDO2 passkey service is starting up...');
      setTimeout(() => setInfoNotice(null), 4000);
    }
  };

  const handleGoogleClick = () => {
    if (onSubmitGoogle) {
      onSubmitGoogle();
    } else {
      setInfoNotice('Authenticating with Google OAuth...');
      setTimeout(() => setInfoNotice(null), 4000);
    }
  };

  return (
    <form className="space-y-4 w-full" onSubmit={handleSubmit}>
      {/* Recognized Account & Fast Passkey Login Card */}
      {hasRecognizedPasskey && (
        <div className="bg-gradient-to-b from-slate-50/90 to-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
          {/* Header row with user info and passkey badge */}
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-500/20 ring-2 ring-white">
                {avatarInitial}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white" title="Verified device">
                <CheckOutlined className="text-[8px] text-white" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {displayName}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Passkey Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                {displayEmail}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Recognized Device
                </span>
                <span>•</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {recognizedUser.clientInfo?.ip || '127.0.0.1'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Sign in with Passkey */}
          <button
            type="button"
            onClick={() => handleFido2Click(recognizedUser.user.email)}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/25 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Authenticating with Passkey...</span>
              </>
            ) : (
              <>
                <KeyOutlined className="text-base" />
                <span>Sign in as {displayName} (Passkey)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Return to recognized passkey account link if user switched to manual mode */}
      {cachedRecognizedUser && isDifferentAccount && (
        <div className="flex items-center justify-between pb-1 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={handleSwitchBackToRecognized}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1.5 hover:underline cursor-pointer transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span>Back to saved account ({cachedRecognizedUser.user.username || cachedRecognizedUser.user.email})</span>
          </button>
        </div>
      )}

      {/* Standard Email & Password Form (Hidden when recognized passkey is active) */}
      {!hasRecognizedPasskey && (
        <>
          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                placeholder="admin@himalayashop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm disabled:opacity-60"
                required
              />
            </div>
          </div>

          {/* Dynamic Passkey Detected Notice (Passwordless-Authentication flow) */}
          {lookupUser && lookupUser.hasPasskey && (
            <div className="p-3 bg-gradient-to-r from-orange-50 via-white to-blue-50 border border-orange-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-500 text-white rounded-xl text-xs flex items-center justify-center">
                  <ThunderboltOutlined className="text-white text-xs" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Biometric Passkey Enabled</div>
                  <div className="text-[11px] text-slate-500">Sign in instantly without entering your password</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFido2Click(email)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-[#0284c7] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                Use Passkey
              </button>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <a href="#forgot" className="text-xs font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-3.5 1.5h16.5a1.5 1.5 0 0 1 1.5 1.5v6.75a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V13.5a1.5 1.5 0 0 1 1.5-1.5Z" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm disabled:opacity-60"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 2FA Authenticator Code Input */}
          {requiresTotp && (
            <div className="space-y-1.5 p-3.5 bg-sky-50/80 border border-sky-200 rounded-2xl animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between">
                <label htmlFor="totpCode" className="block text-xs font-bold text-sky-900 uppercase tracking-wider">
                  2FA Authenticator Code
                </label>
                <span className="text-[10px] text-sky-600 font-medium">6 digits</span>
              </div>
              <input
                id="totpCode"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 border border-sky-300 rounded-xl bg-white text-slate-900 text-center font-mono tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                autoFocus
                required
              />
              <p className="text-[11px] text-sky-700">Enter the current 6-digit code or emergency backup code.</p>
            </div>
          )}

          {/* Remember Me Box */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-4.5 w-4.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 focus:ring-offset-0 transition-colors disabled:opacity-60 cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2.5 block text-xs text-slate-600 select-none cursor-pointer">
              Remember this device for instant passkey login
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-900/10 hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Signing in...</span>
              </>
            ) : (
              <span className="text-sm">Sign In with Password</span>
            )}
          </button>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-600 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span className="font-medium text-xs">{error}</span>
        </div>
      )}

      {/* Status Notice */}
      {infoNotice && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5 text-blue-600 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.086 1.086L12.5 13.5H13.75a.75.75 0 010 1.5H12a.75.75 0 01-.743-.648L11.25 11.25zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
          </svg>
          <span className="font-medium">{infoNotice}</span>
        </div>
      )}

      {/* Divider */}
      <div className="relative flex items-center justify-center my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <span className="relative px-3 bg-white text-[11px] text-slate-400 font-medium uppercase tracking-wider">
          {hasRecognizedPasskey ? 'Or Other Options' : 'Or Access With'}
        </span>
      </div>

      {/* Social / Biometric / Account Switching Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-3 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-[0.98] text-xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>

        {/* If recognized passkey is shown: Show "Login Different Account" */}
        {hasRecognizedPasskey ? (
          <button
            type="button"
            onClick={handleDifferentAccountClick}
            disabled={isLoading}
            className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium py-2 px-3 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-[0.98] text-xs"
            title="Log in with a different account using email and password"
          >
            <UserSwitchOutlined className="text-sm text-slate-500 shrink-0" />
            <span className="truncate">Login Different Account</span>
          </button>
        ) : (
          /* When in standard login mode: show "Passkey / FIDO2" */
          <button
            type="button"
            onClick={() => handleFido2Click(email)}
            disabled={isLoading}
            className="bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-3 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-[0.98] text-xs"
          >
            <KeyOutlined className="text-sm text-orange-500 shrink-0" />
            <span>Passkey / FIDO2</span>
          </button>
        )}
      </div>

      {/* Sign Up & Seller Navigation links */}
      {onRegisterClick && (
        <div className="text-center mt-4 space-y-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onRegisterClick('customer')}
              className="font-semibold text-orange-600 hover:text-orange-500 hover:underline transition-colors focus:outline-none cursor-pointer"
            >
              Sign Up
            </button>
          </p>

          <div>
            <button
              type="button"
              onClick={() => onRegisterClick('seller')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShopOutlined className="text-xs" />
              <span>Sign In As Seller</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
};
