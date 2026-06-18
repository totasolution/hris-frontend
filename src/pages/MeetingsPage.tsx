import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select as NativeSelect } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useToast } from '../components/Toast';
import * as api from '../services/api';

const STATUSES: api.MeetingStatus[] = ['scheduled', 'held', 'cancelled', 'no_show'];
const PER_PAGE = 10;

const statusTone: Record<api.MeetingStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  held: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-600',
  no_show: 'bg-amber-100 text-amber-700',
};

function toLocalInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  // datetime-local wants "YYYY-MM-DDTHH:mm" in local time
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

const emptyForm: api.MeetingInput = {
  title: '',
  contact_name: '',
  scheduled_at: '',
  status: 'scheduled',
  outcome: '',
  follow_up_due_at: '',
  notes: '',
};

export default function MeetingsPage() {
  const { t } = useTranslation('pages');
  const { permissions = [] } = useAuth();
  const canCreate = permissions.includes('meeting:create');
  const canUpdate = permissions.includes('meeting:update');
  const toast = useToast();

  const [list, setList] = useState<api.Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<api.MeetingInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMeetings({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page,
        per_page: PER_PAGE,
      });
      setList(res.data ?? []);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, page]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (m: api.Meeting) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      contact_name: m.contact_name ?? '',
      scheduled_at: toLocalInput(m.scheduled_at),
      status: m.status,
      outcome: m.outcome ?? '',
      follow_up_due_at: toLocalInput(m.follow_up_due_at),
      notes: m.notes ?? '',
      client_id: m.client_id ?? null,
      owner_user_id: m.owner_user_id,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduled_at) {
      toast.error('Title and date/time are required');
      return;
    }
    setSaving(true);
    try {
      const payload: api.MeetingInput = {
        ...form,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        follow_up_due_at: form.follow_up_due_at ? new Date(form.follow_up_due_at).toISOString() : null,
      };
      if (editingId) {
        await api.updateMeeting(editingId, payload);
        toast.success('Meeting updated');
      } else {
        await api.createMeeting(payload);
        toast.success('Meeting created');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : '—');

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('meetings.title', 'Meetings')}
        subtitle={t('meetings.subtitle', 'Business development')}
        actions={canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90"
          >
            + {t('meetings.add', 'New meeting')}
          </button>
        ) : undefined}
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder={t('meetings.searchPlaceholder', 'Search title or contact…')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="w-56">
          <NativeSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">{t('meetings.allStatuses', 'All statuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('meetings.colTitle', 'Title')}</TH>
                <TH>{t('meetings.colContact', 'Contact')}</TH>
                <TH>{t('meetings.colScheduled', 'Scheduled')}</TH>
                <TH>{t('common:status', 'Status')}</TH>
                <TH>{t('meetings.colFollowUp', 'Follow-up due')}</TH>
                <TH className="text-right">{t('common:actions', 'Actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="py-12 text-center text-slate-400">
                    {t('meetings.empty', 'No meetings found')}
                  </TD>
                </TR>
              ) : (
                list.map((m) => (
                  <TR key={m.id}>
                    <TD className="font-bold text-[#0f172a]">{m.title}</TD>
                    <TD className="text-slate-600">{m.contact_name || '—'}</TD>
                    <TD className="text-slate-600">{fmt(m.scheduled_at)}</TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusTone[m.status]}`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </TD>
                    <TD className="text-slate-600">{fmt(m.follow_up_due_at)}</TD>
                    <TD className="text-right">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {t('common:edit', 'Edit')}
                        </button>
                      )}
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} total={total} perPage={PER_PAGE} onPageChange={setPage} />
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? t('meetings.editTitle', 'Edit meeting') : t('meetings.add', 'New meeting')}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label={t('meetings.colTitle', 'Title')}
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Intro call with Acme"
          />
          <Input
            label={t('meetings.colContact', 'Contact')}
            value={form.contact_name ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('meetings.colScheduled', 'Scheduled')}
              type="datetime-local"
              required
              value={form.scheduled_at}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
            />
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('common:status', 'Status')}</label>
              <NativeSelect value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as api.MeetingStatus }))}>
                {STATUSES.map((s) => (<option key={s} value={s}>{s.replace('_', ' ')}</option>))}
              </NativeSelect>
            </div>
          </div>
          <Input
            label={t('meetings.colFollowUp', 'Follow-up due')}
            type="datetime-local"
            value={form.follow_up_due_at ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, follow_up_due_at: e.target.value }))}
          />
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('meetings.outcome', 'Outcome')}</label>
            <textarea
              value={form.outcome ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('meetings.notes', 'Notes')}</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              {t('common:cancel', 'Cancel')}
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? t('common:saving', 'Saving…') : t('common:save', 'Save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
