import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink, Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../services/api';
import * as api from '../services/api';

const eyeIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const eyeOffIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function UsersPage() {
  const { t } = useTranslation(['pages', 'common']);
  const { permissions = [] } = useAuth();
  const canResetPassword = permissions.includes('user:update');
  const [list, setList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNew, setShowResetNew] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUsers({
        search: search.trim() || undefined,
        page,
        per_page: perPage,
      });
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:users.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, page]);

  const openResetModal = (u: User) => {
    setResetUser(u);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError(null);
    setResetSuccess(false);
  };

  const closeResetModal = () => {
    setResetUser(null);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError(null);
    setResetSuccess(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetError(null);
    setResetSuccess(false);
    if (resetNewPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    setResetSubmitting(true);
    try {
      await api.resetUserPassword(resetUser.id, resetNewPassword);
      setResetSuccess(true);
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:users.title')}
        subtitle={t('pages:users.subtitle')}
        actions={<ButtonLink to="/users/new">{t('pages:users.addUser')}</ButtonLink>}
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder={t('pages:users.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('pages:users.fullName')}</TH>
                <TH>{t('pages:users.email')}</TH>
                <TH>{t('common:status')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    {t('pages:users.noUsersFound')}
                  </TD>
                </TR>
              ) : (
                list.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-bold text-[#0f172a]">{u.full_name}</TD>
                    <TD>{u.email}</TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.status}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <span className="inline-flex items-center gap-0">
                        <Link
                          to={`/users/${u.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors inline-block"
                          title={t('pages:users.editUser')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        {canResetPassword && (
                          <button
                            type="button"
                            onClick={() => openResetModal(u)}
                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors inline-block"
                            title={t('pages:users.resetPassword')}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                        )}
                      </span>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            onPageChange={setPage}
          />
        </Card>
      )}

      <Modal
        isOpen={!!resetUser}
        onClose={closeResetModal}
        title={t('pages:users.resetPasswordTitle')}
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={closeResetModal} disabled={resetSubmitting} className="flex-1">
              {t('common:cancel')}
            </Button>
            <Button disabled={resetSubmitting} className="flex-1" type="submit" form="reset-password-form">
              {resetSubmitting ? 'Resetting...' : t('pages:users.resetPassword')}
            </Button>
          </div>
        }
      >
        {resetUser && (
          <form id="reset-password-form" onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">{t('pages:users.resetPasswordDescription')}</p>
            {resetError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{resetError}</div>
            )}
            {resetSuccess && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-700">{t('pages:users.resetPasswordSuccess')}</div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('pages:users.newPassword')}</label>
              <div className="relative">
                <input
                  type={showResetNew ? 'text' : 'password'}
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowResetNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title={showResetNew ? 'Hide password' : 'Show password'}
                  aria-label={showResetNew ? 'Hide password' : 'Show password'}
                >
                  {showResetNew ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('pages:users.confirmNewPassword')}</label>
              <div className="relative">
                <input
                  type={showResetConfirm ? 'text' : 'password'}
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowResetConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title={showResetConfirm ? 'Hide password' : 'Show password'}
                  aria-label={showResetConfirm ? 'Hide password' : 'Show password'}
                >
                  {showResetConfirm ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
