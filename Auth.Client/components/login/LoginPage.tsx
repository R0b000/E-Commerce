import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

export const LoginPage = () => {
  const { login, googleLogin, fido2Login, isAuthenticated, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (credentials: { email: string; password: string }) => {
    setIsPending(true);
    setError(null);
    try {
      await login(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsPending(true);
    setError(null);
    try {
      await googleLogin({
        email: 'admin@himalayashop.com',
        firstName: 'Google',
        lastName: 'Admin',
        googleId: 'google_oauth_' + Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setIsPending(false);
    }
  };

  const handleFido2Login = async (email?: string) => {
    setIsPending(true);
    setError(null);
    try {
      await fido2Login(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey login failed');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-6 select-none font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
        {/* Left Side: Brand & Visuals */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100/50 p-8 flex-col justify-between border-r border-slate-100 relative overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

          {/* Logo container */}
          <div className="flex flex-col items-center text-center space-y-6 my-auto justify-center flex-1">
            <Link to="/" title="Navigate to Storefront Home" className="cursor-pointer group flex flex-col items-center">
              <img 
                src="/images/logo.png" 
                alt="Himalaya Online Shop Logo" 
                className="max-w-[220px] h-auto object-contain transition-transform duration-300 group-hover:scale-105" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = document.getElementById('logo-fallback');
                  if (fb) fb.classList.remove('hidden');
                }}
              />
              {/* Fallback styling if logo doesn't load */}
              <div id="logo-fallback" className="hidden flex-col items-center space-y-2">
                <div className="p-4 bg-orange-500 text-white rounded-xl font-bold text-2xl shadow-md">H</div>
                <span className="font-bold text-xl text-slate-800 tracking-wider">HIMALAYA</span>
              </div>
            </Link>
            
            <div className="space-y-2 max-w-[240px]">
              <h3 className="text-slate-800 font-semibold text-base tracking-tight">Portal Management</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Manage your e-commerce shop, view dashboard statistics, and handle customer communication efficiently.
              </p>
            </div>
          </div>

          {/* Footer inside Left Panel */}
          <div className="text-center text-slate-400 text-[10px]">
            &copy; {new Date().getFullYear()} Himalaya Online Shop.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center p-8 md:p-12 bg-white relative">
          {/* Logo visible only on mobile */}
          <div className="flex justify-center mb-6 md:hidden">
            <Link to="/" title="Navigate to Storefront Home">
              <img 
                src="/images/logo.png" 
                alt="Himalaya Online Shop Logo" 
                className="max-w-[180px] h-auto object-contain"
              />
            </Link>
          </div>

          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Quick Navigation to Storefront */}
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0096C7] transition-colors group cursor-pointer"
                title="Return to Himalaya Storefront"
              >
                <ArrowLeftOutlined className="text-xs group-hover:-translate-x-1 transition-transform" />
                <span>Back to Storefront</span>
              </Link>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 text-sm">Please sign in to access your administrative dashboard.</p>
            </div>

            <LoginForm
              onSubmit={handleSubmit}
              onSubmitGoogle={handleGoogleLogin}
              onSubmitFido2={handleFido2Login}
              isLoading={isPending}
              error={error}
              onRegisterClick={(role?: 'customer' | 'seller') =>
                navigate(role === 'seller' ? '/register?role=seller' : '/register?role=customer')
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
