import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPIService } from '../services/AuthAPIService';
import { AuthState, LoginCredentials, RegisterData, GoogleAuthData, Role } from '../config/appConfig';
import { createWebAuthnCredential, getWebAuthnAssertion } from '../services/fido2Helper';
import type { User } from '../models/database/User';

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (data: GoogleAuthData) => Promise<void>;
  fido2Login: (email?: string) => Promise<void>;
  fido2Register: (email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchRole: (role: Role) => void;
  originalRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => ({
    user: null,
    token: localStorage.getItem('authToken'),
    isAuthenticated: !!localStorage.getItem('authToken'),
    isLoading: !!localStorage.getItem('authToken'),
  }));

  const [originalRole, setOriginalRole] = useState<string | null>(() => {
    return sessionStorage.getItem('testOriginalRole') || null;
  });

  const setUser = (user: User | null) =>
    setState((prev) => ({ ...prev, user }));

  const setToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
    setState((prev) => ({ ...prev, token, isAuthenticated: !!token }));
  };

  const switchRole = (newRole: Role) => {
    sessionStorage.setItem('testRoleOverride', newRole);
    setState((prev) => {
      if (!prev.user) return prev;
      const actualOriginal = originalRole || prev.user.role;
      if (!originalRole) {
        setOriginalRole(actualOriginal);
        sessionStorage.setItem('testOriginalRole', actualOriginal);
      }
      return {
        ...prev,
        user: {
          ...prev.user,
          role: newRole,
        },
      };
    });
  };

  const refreshUser = async () => {
    if (!state.token) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authAPIService.getUserProfile();
      if (response.success && response.data) {
        const u = response.data as unknown as User;
        const savedOverride = sessionStorage.getItem('testRoleOverride');
        if (savedOverride) {
          u.role = savedOverride as Role;
        }
        setUser(u);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (state.token && !state.user) {
      refreshUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.token]);

  const login = async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authAPIService.login({
        email: credentials.email,
        password: credentials.password,
        totpCode: credentials.totpCode,
      });
      if (response.success && response.data?.token) {
        sessionStorage.removeItem('testRoleOverride');
        sessionStorage.removeItem('testOriginalRole');
        setOriginalRole(null);
        setToken(response.data.token);
        setUser(response.data.user as unknown as User);
      } else if (response.data && (response.data as any).requiresAuthenticator) {
        throw new Error('2FA_REQUIRED');
      } else {
        throw new Error(response.messages?.[0] || 'Login failed');
      }
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const register = async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authAPIService.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'customer',
        vendorProfile: data.vendorProfile,
        agreementAccepted: data.agreementAccepted,
      });
      if (response.success && response.data) {
        setToken(null);
        await login({ email: data.email, password: data.password });
      } else {
        throw new Error(response.messages?.[0] || 'Registration failed');
      }
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const googleLogin = async (data: GoogleAuthData) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authAPIService.googleLogin({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        googleId: data.googleId,
      });
      if (response.success && response.data) {
        setToken(response.data.token);
        setUser(response.data.user as unknown as User);
      } else {
        throw new Error(response.messages?.[0] || 'Google login failed');
      }
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const fido2Login = async (email?: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      let credentialId: string | undefined = undefined;

      // Gracefully attempt WebAuthn challenge if supported by browser
      if (typeof window !== 'undefined' && 'credentials' in navigator && Boolean(window.PublicKeyCredential)) {
        try {
          const optionsRes = await authAPIService.getFido2LoginOptions(email);
          if (optionsRes.success && optionsRes.data) {
            const assertion = await getWebAuthnAssertion(optionsRes.data);
            if (assertion?.credentialId) {
              credentialId = assertion.credentialId;
            }
          }
        } catch {
          // Fall back gracefully to direct passkey verification
        }
      }

      // Direct, clean FIDO2 API login
      const response = await authAPIService.fido2Login(email, credentialId);
      if (response.success && response.data) {
        setToken(response.data.token);
        setUser(response.data.user as unknown as User);
      } else {
        throw new Error(response.messages?.[0] || 'Passkey authentication failed');
      }
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const fido2Register = async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      let credentialId: string | undefined = undefined;

      if (typeof window !== 'undefined' && 'credentials' in navigator && Boolean(window.PublicKeyCredential)) {
        try {
          const optionsRes = await authAPIService.getFido2RegisterOptions(email);
          if (optionsRes.success && optionsRes.data) {
            const cred = await createWebAuthnCredential(optionsRes.data);
            credentialId = cred.credentialId;
          }
        } catch {
          // Fall back gracefully
        }
      }

      const verifyRes = await authAPIService.fido2Register(email, credentialId);
      if (!verifyRes.success) {
        throw new Error(verifyRes.messages?.[0] || 'Passkey registration failed');
      }

      await refreshUser();
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const logout = () => {
    sessionStorage.removeItem('testRoleOverride');
    sessionStorage.removeItem('testOriginalRole');
    setOriginalRole(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        googleLogin,
        fido2Login,
        fido2Register,
        logout,
        refreshUser,
        switchRole,
        originalRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
