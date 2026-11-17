import { User } from "../models/database/User";

export type Role = 'admin' | 'seller' | 'customer' | 'user' | 'support' | 'manager';

export interface VendorProfile {
  vendorName?: string;
  businessLocation?: string;
  phone?: string;
  taxId?: string;
  businessCategory?: string;
  description?: string;
  documentUrl?: string;
  isApproved?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  expiresAt: Date | null;
  expiresIn: number | null;
  formattedExpiry: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  totpCode?: string;
}

export interface GoogleAuthData {
  email: string;
  firstName?: string;
  lastName?: string;
  googleId?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  vendorProfile?: VendorProfile;
  agreementAccepted?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}
