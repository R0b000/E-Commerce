import { LoginCredentials } from "../../config/appConfig";

export interface LoginFormProps {
  onSubmit?: (credentials: LoginCredentials) => void;
  onSubmitFido2?: (email?: string) => void;
  onSubmitGoogle?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRegisterClick?: () => void;
}
