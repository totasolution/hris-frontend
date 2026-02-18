import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({
        email: email.trim(),
        password,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth:loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden font-body">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-dark/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-bento shadow-bento border border-slate-100 p-10">
          <div className="flex flex-col items-center mb-10">
            <img
              src="/logo-sigma.png"
              alt="Sigma Solusi"
              className="h-16 w-auto object-contain mb-4"
            />
            <h1 className="text-2xl font-black text-brand-dark tracking-tighter font-headline">Sigma<span className="text-brand">HR</span></h1>
            {/* <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Solusi Servis</p> */}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t('auth:workEmail')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('auth:emailPlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('auth:password')}
                </label>
                <a href="#" className="text-[10px] font-bold text-brand hover:text-brand-dark uppercase tracking-wider">{t('auth:forgotPassword')}</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder={t('auth:passwordPlaceholder')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title={showPassword ? t('auth:hidePassword') : t('auth:showPassword')}
                  aria-label={showPassword ? t('auth:hidePassword') : t('auth:showPassword')}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold hover:bg-black shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none font-headline"
            >
              {loading ? t('auth:authenticating') : t('auth:signIn')}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-slate-50 flex flex-col items-center">
            <p className="text-xs text-slate-400 font-medium">
              {t('auth:demoCredentials')}
            </p>
            <div className="mt-2 flex gap-4">
              <code className="text-[10px] bg-slate-50 px-2 py-1 rounded text-slate-500">admin@example.com</code>
              <code className="text-[10px] bg-slate-50 px-2 py-1 rounded text-slate-500">admin123</code>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
          &copy; 2026 Sigma • SigmaHR v1.0
        </p>
      </div>
    </div>
  );
}
