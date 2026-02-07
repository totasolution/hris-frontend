import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmModal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Client } from '../services/api';
import * as api from '../services/api';

export default function ClientsPage() {
  const [list, setList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getClients();
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteClient(clientToDelete.id);
      toast.success(`Client ${clientToDelete.name} deleted`);
      setShowDeleteConfirm(false);
      setClientToDelete(null);
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
        title="Clients"
        subtitle="Manage your client companies"
        actions={<ButtonLink to="/clients/new">Add Client</ButtonLink>}
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
                <TH>Client Name</TH>
                <TH>Contact Person</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    No clients found.
                  </TD>
                </TR>
              ) : (
                list.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-bold text-[#0f172a]">{c.name}</TD>
                    <TD>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{c.contact_name ?? '—'}</span>
                        <span className="text-xs text-slate-400">{c.contact_email}</span>
                      </div>
                    </TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/clients/${c.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            setClientToDelete({ id: c.id, name: c.name });
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
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
          setClientToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Client"
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={deleteLoading}
      >
        <p>Are you sure you want to delete the client <span className="font-bold text-brand-dark">{clientToDelete?.name}</span>?</p>
        <p className="mt-2 text-sm text-red-500 font-medium">This action will delete all data related to this client and cannot be undone.</p>
      </ConfirmModal>
    </div>
  );
}
