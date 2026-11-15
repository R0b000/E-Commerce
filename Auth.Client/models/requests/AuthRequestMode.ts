import { Role, VendorProfile } from '../../config/appConfig';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totpCode?: string;
}

export interface GoogleLoginRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  googleId?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role | string;
  vendorProfile?: VendorProfile;
  agreementAccepted?: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface Fido2RegisterVerifyRequest {
  email: string;
  credentialId: string;
  publicKey?: string;
  transports?: string[];
  deviceName?: string;
}

export interface Fido2LoginVerifyRequest {
  email?: string;
  credentialId?: string;
}
