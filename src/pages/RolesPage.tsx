import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmModal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Role } from '../services/api';
import * as api from '../services/api';

export default function RolesPage() {
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
      setError(e instanceof Error ? e.message : 'Failed to load roles');
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
      toast.success(`Role ${roleToDelete.name} deleted`);
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roles"
        subtitle="Define system access levels and permissions"
        actions={<ButtonLink to="/roles/new">Add Role</ButtonLink>}
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
                <TH>Role Name</TH>
                <TH>Slug</TH>
                <TH>Description</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    No roles found.
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
                          title="Manage Permissions"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </Link>
                        <Link
                          to={`/roles/${r.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit Role"
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
                          title="Delete Role"
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
        title="Delete Role"
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={deleteLoading}
      >
        <p>Are you sure you want to delete the role <span className="font-bold text-brand-dark">{roleToDelete?.name}</span>?</p>
        <p className="mt-2 text-sm text-red-500 font-medium">This action may affect users assigned to this role.</p>
      </ConfirmModal>
    </div>
  );
}
