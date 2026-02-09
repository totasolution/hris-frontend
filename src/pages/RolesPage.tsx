import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmModal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Role } from '../services/api';
import * as api from '../services/api';

export default function RolesPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [list, setList] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRoles();
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:roles.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!roleToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteRole(roleToDelete.id);
      toast.success(t('pages:roles.roleDeleted', { name: roleToDelete.name }));
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages:roles.deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:roles.title')}
        subtitle={t('pages:roles.subtitle')}
        actions={<ButtonLink to="/roles/new">{t('pages:roles.addRole')}</ButtonLink>}
      />

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
                <TH>{t('pages:roles.roleName')}</TH>
                <TH>{t('pages:roles.slug')}</TH>
                <TH>{t('pages:roles.description')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    {t('pages:roles.noRolesFound')}
                  </TD>
                </TR>
              ) : (
                list.map((r) => (
                  <TR key={r.id}>
                    <TD className="font-bold text-[#0f172a]">{r.name}</TD>
                    <TD>
                      <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        {r.slug}
                      </span>
                    </TD>
                    <TD className="max-w-xs truncate">{r.description ?? '—'}</TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/roles/${r.id}/permissions`}
                          className="p-2 text-slate-400 hover:text-brand transition-colors"
                          title={t('pages:roles.managePermissions')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </Link>
                        <Link
                          to={`/roles/${r.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title={t('pages:roles.editRole')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            setRoleToDelete({ id: r.id, name: r.name });
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title={t('common:delete')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" />
                          </svg>
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setRoleToDelete(null);
        }}
        onConfirm={handleDelete}
        title={t('pages:roles.deleteModalTitle')}
        confirmText={t('common:yesDelete')}
        variant="danger"
        isLoading={deleteLoading}
      >
        <p>{t('pages:roles.confirmDeleteRole', { name: roleToDelete?.name ?? '' })}</p>
        <p className="mt-2 text-sm text-red-500 font-medium">{t('pages:roles.deleteWarning')}</p>
      </ConfirmModal>
    </div>
  );
}
