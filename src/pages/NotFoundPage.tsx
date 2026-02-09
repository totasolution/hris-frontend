import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';

export default function NotFoundPage() {
  const { t } = useTranslation(['pages', 'nav']);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden font-body">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-dark/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="bg-white rounded-bento shadow-bento border border-slate-100 p-10">
          <p className="text-8xl font-black text-brand/20 tracking-tighter font-headline">404</p>
          <h1 className="text-xl font-bold text-slate-800 mt-2">{t('pages:notFound.title')}</h1>
          <p className="text-slate-500 mt-2">{t('pages:notFound.description')}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <ButtonLink to="/" variant="primary">{t('pages:notFound.goHome')}</ButtonLink>
            <ButtonLink to="/dashboard" variant="outline">{t('nav:dashboard')}</ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
