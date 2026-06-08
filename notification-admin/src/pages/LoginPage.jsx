import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Bell,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const validationErrors = {};
    if (!email) validationErrors.email = 'Email address is required.';
    if (!password) validationErrors.password = 'Password is required.';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      toast.success('Access authorized. Session active.');
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      if (err.errors) {
        const formattedErrors = {};
        Object.keys(err.errors).forEach((key) => {
          formattedErrors[key] = err.errors[key][0];
        });
        setErrors(formattedErrors);
      }
      toast.error(err.message || 'Verification failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-bg-main text-text-primary selection:bg-accent-primary-glow overflow-hidden relative font-sans">

      {/* ─── AMBIENT BACKGROUND LIGHTS ─── */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] bg-accent-primary/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[500px] bg-accent-secondary/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Subtle fine grid */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--border-color)_1px,transparent_1px),linear-gradient(90deg,var(--border-color)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* ─── FLOATING GLASS CARD ─── */}
      <div className="w-full max-w-[420px] mx-4 relative z-10 transition-all duration-300">

        <div className="bg-bg-glass border border-border-color backdrop-blur-2xl rounded-2xl shadow-lg !p-[20px] !space-y-4">

          {/* Header section */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-border-color rounded-2xl flex items-center justify-center text-accent-secondary shadow-sm !mb-2">
              <Bell size={20} />
            </div>

            <h1 className="text-xl font-bold font-display tracking-tight text-text-primary flex items-center gap-1.5">
              <span>Aether</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary font-light">Notify</span>
            </h1>

            <p className="text-xs text-text-secondary mt-2">
              Authorized admin authentication portal
            </p>
          </div>

          {/* Validation Banner */}
          {Object.keys(errors).length > 0 && !errors.email && !errors.password && (
            <div className="mb-5 p-3 bg-danger-bg border border-danger/20 rounded-xl flex items-start gap-2.5 text-xs text-danger animate-fadeIn">
              <ShieldAlert size={15} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">Authentication failed. Please verify credentials.</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="!space-y-5">

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="email">
                  Operator Email
                </label>
                {errors.email && (
                  <span className="text-[10px] text-danger font-medium">{errors.email}</span>
                )}
              </div>
              <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-bg-main border border-border-color rounded-sm focus-within:border-accent-primary focus-within:bg-bg-surface focus-within:shadow-glow focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all duration-200 group">
                <Mail
                  size={18}
                  className="text-text-muted transition-colors group-focus-within:text-accent-primary shrink-0 !ml-3.5"
                />
                <input
                  id="email"
                  type="email"
                  className="w-full bg-transparent border-none outline-none !py-1 text-text-primary text-sm placeholder:text-text-muted disabled:cursor-not-allowed"
                  placeholder="name@aethernotify.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="password">
                  Security Passcode
                </label>
                {errors.password && (
                  <span className="text-[10px] text-danger font-medium">{errors.password}</span>
                )}
              </div>
              <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-bg-main border border-border-color rounded-sm focus-within:border-accent-primary focus-within:bg-bg-surface focus-within:shadow-glow focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all duration-200 group">
                <Lock
                  size={18}
                  className="text-text-muted transition-colors group-focus-within:text-accent-primary shrink-0 !ml-3.5"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-transparent border-none outline-none !py-1 text-text-primary text-sm placeholder:text-text-muted disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="text-text-muted !mr-3.5 hover:text-text-secondary transition-colors cursor-pointer shrink-0"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full !py-2 px-6 text-white font-bold text-sm tracking-wide rounded-sm bg-gradient-to-r from-accent-primary to-accent-secondary hover:shadow-md hover:shadow-accent-primary/25 active:scale-[0.99] focus:outline-none transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Identity...</span>
                </>
              ) : (
                <>
                  <span>Initialize Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs !pt-2 text-text-muted border-t border-border-color mt-6">
            Not registered on this console?{' '}
            <Link to="/register" className="text-accent-secondary hover:text-accent-secondary-hover font-semibold transition-colors">
              Enroll profile
            </Link>
          </div>

        </div>
      </div>

      {/* Absolute Bottom Footer Info */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-text-muted tracking-wider font-mono">
        SECURE NODE IP // LOCALHOST:8000
      </div>

    </div>
  );
};

export default LoginPage;
