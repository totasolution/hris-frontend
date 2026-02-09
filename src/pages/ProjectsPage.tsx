import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmModal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Select } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Client, Project } from '../services/api';
import * as api from '../services/api';

export default function ProjectsPage() {
  const { t } = useTranslation(['pages', 'common']);
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('client_id');
  const [list, setList] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterClientId, setFilterClientId] = useState<string>(clientIdParam ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projects, clientList] = await Promise.all([
        api.getProjects(filterClientId ? parseInt(filterClientId, 10) : undefined),
        api.getClients(),
      ]);
      setList(projects);
      setClients(clientList);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('pages:projects.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterClientId]);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteProject(projectToDelete.id);
      toast.success(t('pages:projects.projectDeleted', { name: projectToDelete.name }));
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages:projects.deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const clientName = (id: number) => clients.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pages:projects.title')}
        subtitle={t('pages:projects.subtitle')}
        actions={
          <ButtonLink to={filterClientId ? `/projects/new?client_id=${filterClientId}` : '/projects/new'}>
            {t('pages:projects.addProject')}
          </ButtonLink>
        }
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <Select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
          >
            <option value="">{t('pages:projects.allClients')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
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
                <TH>{t('pages:projects.projectName')}</TH>
                <TH>{t('pages:projects.client')}</TH>
                <TH>{t('common:status')}</TH>
                <TH className="text-right">{t('common:actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    {t('pages:projects.noProjectsFound')}
                  </TD>
                </TR>
              ) : (
                list.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-bold text-[#0f172a]">{p.name}</TD>
                    <TD>{clientName(p.client_id)}</TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        p.status === 'active' ? 'bg-green-100 text-green-700' :
                        p.status === 'on_hold' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/projects/${p.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title={t('common:edit')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            setProjectToDelete({ id: p.id, name: p.name });
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
          setProjectToDelete(null);
        }}
        onConfirm={handleDelete}
        title={t('pages:projects.deleteModalTitle')}
        confirmText={t('common:yesDelete')}
        variant="danger"
        isLoading={deleteLoading}
      >
        <p>{t('pages:projects.confirmDeleteProject', { name: projectToDelete?.name ?? '' })}</p>
        <p className="mt-2 text-sm text-red-500 font-medium">{t('pages:projects.deleteWarning')}</p>
      </ConfirmModal>
    </div>
  );
}
