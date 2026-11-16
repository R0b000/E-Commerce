import { AuthAPIRoutes } from '../config/AuthAPIRoutes';
import { axiosConfig } from 'shared-ui/axios/AxiosConfig';
import type { IResponse } from 'shared-api/wrappers/IResponse';
import type {
  LoginRequest,
  RegisterRequest,
  GoogleLoginRequest,
  Fido2RegisterVerifyRequest,
  Fido2LoginVerifyRequest,
} from '../models/requests/AuthRequestMode';
import type { LoginResponse, RegisterResponse, UserProfileResponse } from '../models/responses/AuthResponseMode';

class AuthAPIService {
  async login(request: LoginRequest): Promise<IResponse<LoginResponse>> {
    const response = await axiosConfig.post<IResponse<LoginResponse>>(AuthAPIRoutes.LOGIN, request);
    return response.data;
  }

  async register(request: RegisterRequest): Promise<IResponse<RegisterResponse>> {
    const response = await axiosConfig.post<IResponse<RegisterResponse>>(AuthAPIRoutes.REGISTER, request);
    return response.data;
  }

  async googleLogin(request: GoogleLoginRequest): Promise<IResponse<LoginResponse>> {
    const response = await axiosConfig.post<IResponse<LoginResponse>>(AuthAPIRoutes.GOOGLE, request);
    return response.data;
  }

  async getFido2RegisterOptions(email: string): Promise<IResponse<any>> {
    const response = await axiosConfig.get<IResponse<any>>(
      `${AuthAPIRoutes.FIDO2_REGISTER_OPTIONS}?email=${encodeURIComponent(email)}`
    );
    return response.data;
  }

  async verifyFido2Register(data: Fido2RegisterVerifyRequest): Promise<IResponse<{ registered: boolean; count: number }>> {
    const response = await axiosConfig.post<IResponse<{ registered: boolean; count: number }>>(
      AuthAPIRoutes.FIDO2_REGISTER_VERIFY,
      data
    );
    return response.data;
  }

  async getFido2LoginOptions(email?: string): Promise<IResponse<any>> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await axiosConfig.get<IResponse<any>>(`${AuthAPIRoutes.FIDO2_LOGIN_OPTIONS}${query}`);
    return response.data;
  }

  async fido2Login(email?: string, credentialId?: string): Promise<IResponse<LoginResponse>> {
    const response = await axiosConfig.post<IResponse<LoginResponse>>(AuthAPIRoutes.FIDO2_LOGIN, {
      email,
      credentialId,
    });
    return response.data;
  }

  async fido2Register(email: string, credentialId?: string, deviceName?: string): Promise<IResponse<{ registered: boolean; count: number }>> {
    const response = await axiosConfig.post<IResponse<{ registered: boolean; count: number }>>(
      AuthAPIRoutes.FIDO2_REGISTER,
      { email, credentialId, deviceName }
    );
    return response.data;
  }

  async verifyFido2Login(data: Fido2LoginVerifyRequest): Promise<IResponse<LoginResponse>> {
    const response = await axiosConfig.post<IResponse<LoginResponse>>(
      AuthAPIRoutes.FIDO2_LOGIN_VERIFY,
      data
    );
    return response.data;
  }

  async getRememberedDevice(): Promise<IResponse<{ recognized: boolean; user?: any; clientInfo?: { ip: string; macOrDevice: string } }>> {
    const response = await axiosConfig.get<IResponse<any>>('/auth/remembered-device');
    return response.data;
  }

  async lookup(identifier: string): Promise<IResponse<{
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    hasPasskey: boolean;
    requiresFido2: boolean;
    requiresAuthenticator: boolean;
    isActive: boolean;
  }>> {
    const response = await axiosConfig.post<IResponse<any>>(AuthAPIRoutes.LOOKUP, { identifier });
    return response.data;
  }

  async getPasskeys(): Promise<IResponse<Array<{
    id: string;
    credentialId: string;
    deviceName: string;
    transports: string[];
    createdAt: string;
    lastUsedAt?: string | null;
  }>>> {
    const response = await axiosConfig.get<IResponse<any>>(AuthAPIRoutes.PASSKEYS);
    return response.data;
  }

  async deletePasskey(credentialId: string): Promise<IResponse<{ remaining: number }>> {
    const response = await axiosConfig.delete<IResponse<any>>(`${AuthAPIRoutes.PASSKEYS}/${credentialId}`);
    return response.data;
  }

  async getSessions(): Promise<IResponse<Array<{
    id: string;
    ip: string;
    userAgent: string;
    macOrDevice: string;
    lastActive: string;
    isCurrent: boolean;
  }>>> {
    const response = await axiosConfig.get<IResponse<any>>(AuthAPIRoutes.SESSIONS);
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<IResponse<{ activeCount: number }>> {
    const response = await axiosConfig.delete<IResponse<any>>(`${AuthAPIRoutes.SESSIONS}/${sessionId}`);
    return response.data;
  }

  async revokeOtherSessions(): Promise<IResponse<{ activeCount: number }>> {
    const response = await axiosConfig.post<IResponse<any>>(AuthAPIRoutes.SESSIONS_REVOKE_OTHERS);
    return response.data;
  }

  async setupAuthenticator(): Promise<IResponse<{
    secret: string;
    qrCodeUri: string;
    backupCodes: string[];
    manualEntryKey: string;
  }>> {
    const response = await axiosConfig.get<IResponse<any>>(AuthAPIRoutes.AUTHENTICATOR_SETUP);
    return response.data;
  }

  async verifyAuthenticator(code: string): Promise<IResponse<{ enabled: boolean; method: string }>> {
    const response = await axiosConfig.post<IResponse<any>>(AuthAPIRoutes.AUTHENTICATOR_VERIFY, { code });
    return response.data;
  }

  async disableAuthenticator(): Promise<IResponse<{ enabled: boolean }>> {
    const response = await axiosConfig.post<IResponse<any>>(AuthAPIRoutes.AUTHENTICATOR_DISABLE);
    return response.data;
  }

  async updateSecuritySettings(settings: { alertOnNewDevice?: boolean; twoFactorMethod?: string }): Promise<IResponse<any>> {
    const response = await axiosConfig.put<IResponse<any>>(AuthAPIRoutes.SECURITY_SETTINGS, settings);
    return response.data;
  }

  async getUserProfile(): Promise<IResponse<UserProfileResponse>> {
    const response = await axiosConfig.get<IResponse<UserProfileResponse>>(AuthAPIRoutes.PROFILE);
    return response.data;
  }

  async updateUserProfile(profileData: any): Promise<IResponse<UserProfileResponse>> {
    const response = await axiosConfig.put<IResponse<UserProfileResponse>>(AuthAPIRoutes.PROFILE, profileData);
    return response.data;
  }

  async updateVendorProfile(profileData: any): Promise<IResponse<UserProfileResponse>> {
    const response = await axiosConfig.put<IResponse<UserProfileResponse>>('/auth/vendor-profile', profileData);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<IResponse<string>> {
    const response = await axiosConfig.post<IResponse<string>>(AuthAPIRoutes.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async forgotPassword(email: string): Promise<IResponse<string>> {
    const response = await axiosConfig.post<IResponse<string>>(AuthAPIRoutes.FORGOT_PASSWORD, { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<IResponse<string>> {
    const response = await axiosConfig.post<IResponse<string>>(AuthAPIRoutes.RESET_PASSWORD, {
      token,
      newPassword,
    });
    return response.data;
  }
}

export const authAPIService = new AuthAPIService();
export { AuthAPIService };
export default AuthAPIService;
