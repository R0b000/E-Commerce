/**
 * Authentication Routes Configuration
 * All API endpoints for authentication operations
 */
export const AuthAPIRoutes = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GOOGLE: '/auth/google',
  LOOKUP: '/auth/lookup',
  FIDO2_REGISTER_OPTIONS: '/auth/fido2/register-options',
  FIDO2_REGISTER_VERIFY: '/auth/fido2/register-verify',
  FIDO2_LOGIN_OPTIONS: '/auth/fido2/login-options',
  FIDO2_LOGIN_VERIFY: '/auth/fido2/login-verify',
  PASSKEYS: '/auth/fido2/credentials',
  SESSIONS: '/auth/sessions',
  SESSIONS_REVOKE_OTHERS: '/auth/sessions/revoke-others',
  AUTHENTICATOR_SETUP: '/auth/authenticator/setup',
  AUTHENTICATOR_VERIFY: '/auth/authenticator/verify',
  AUTHENTICATOR_DISABLE: '/auth/authenticator/disable',
  SECURITY_SETTINGS: '/auth/security-settings',
  PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/change-password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

export type AuthAPIRoutes = typeof AuthAPIRoutes;
