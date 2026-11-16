import { Role, VendorProfile } from "../../config/appConfig";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  address?: string;
  agreementAccepted?: boolean;
  agreementAcceptedAt?: string;
  agreementVersion?: string;
  role: Role;
  isActive: boolean;
  vendorProfile?: VendorProfile | null;
  customPermissions?: string[];
  hasPasskey?: boolean;
  passkeysCount?: number;
  isTwoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  alertOnNewDevice?: boolean;
  lastLoginIp?: string | null;
  lastPasswordChange?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
