import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { Select as NativeSelect } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useToast } from '../components/Toast';
import * as api from '../services/api';

type ParamField =
  | { key: string; type: 'number'; label: string; placeholder?: string }
  | { key: string; type: 'select'; label: string; options: { value: string; label: string }[] }
  | { key: string; type: 'role'; label: string }
  | { key: string; type: 'multi'; label: string; options: string[] };

type MetricDef = { label: string; desc: string; params: ParamField[] };

const METRICS: Record<string, MetricDef> = {
  activity_target: {
    label: 'Activity target / idle',
    desc: 'Someone did fewer than N of an activity in a window (covers recruiter targets, idle, BD meetings).',
    params: [
      { key: 'activity', type: 'select', label: 'Activity', options: [
        { value: 'candidates_processed', label: 'Candidates processed (recruiter)' },
        { value: 'meetings_held', label: 'Meetings held (BD)' },
        { value: 'meetings_scheduled', label: 'Meetings booked (BD)' },
      ] },
      { key: 'window_days', type: 'number', label: 'Window (days)', placeholder: '1 = today' },
      { key: 'min_count', type: 'number', label: 'Minimum count' },
      { key: 'subject_role_id', type: 'role', label: 'Subject role (who is measured)' },
    ],
  },
  candidate_stage_aging: {
    label: 'Candidate stuck in stage',
    desc: 'Candidate stays in the same pipeline stage longer than N days.',
    params: [{ key: 'days', type: 'number', label: 'Alert after (days in stage)' }],
  },
  contract_stalled: {
    label: 'Contract stalled',
    desc: 'Contract stays in a draft/sent status longer than N days.',
    params: [
      { key: 'days', type: 'number', label: 'Alert after (days)' },
      { key: 'statuses', type: 'multi', label: 'Applies to statuses', options: ['draft', 'sent_for_signature', 'signed', 'expired', 'cancelled'] },
    ],
  },
  meeting_followup: {
    label: 'Meeting follow-up overdue',
    desc: 'Held meeting with no outcome recorded after N days.',
    params: [{ key: 'days', type: 'number', label: 'Alert after (days)' }],
  },
  payroll_missing: {
    label: 'Payroll missing for month',
    desc: 'A client with active employees has no payroll for the previous month by the deadline.',
    params: [{ key: 'deadline_dom', type: 'number', label: 'Deadline (day of month)' }],
  },
};

const RECIPIENT_MODES = [
  { value: 'role_in_dept', label: "Role in subject's department" },
  { value: 'subject', label: 'The subject (self)' },
  { value: 'subject_owner', label: 'Subject owner' },
  { value: 'global_role', label: 'Global role' },
  { value: 'direct_email', label: 'Direct email(s)' },
];
const FREQS = ['daily', 'weekly', 'monthly'] as const;
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyForm: api.AlertInput = {
  name: '', metric_key: 'activity_target', params: { activity: 'candidates_processed', window_days: 1, min_count: 5 },
  frequency: 'daily', schedule_hour: 9, recipient_mode: 'role_in_dept', recipient_role_id: null,
  direct_emails: '', message_subject: '', message_body: '', dedup_hours: 24, active: true,
};

export default function AlertsBuilderPage() {
  const { permissions = [] } = useAuth();
  const canManage = permissions.includes('alert:manage');
  const toast = useToast();

  const [tab, setTab] = useState<'rules' | 'log'>('rules');
  const [rules, setRules] = useState<api.AlertRule[]>([]);
  const [logEntries, setLogEntries] = useState<api.AlertLogEntry[]>([]);
  const [roles, setRoles] = useState<api.Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<api.AlertInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const roleName = (id?: number | null) => roles.find((r) => r.id === id)?.name ?? (id ? `#${id}` : '—');

  const loadRules = async () => {
    setLoading(true);
    try { setRules(await api.getAlerts()); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setLoading(false); }
  };
  const loadLog = async () => {
    setLoading(true);
    try { setLogEntries(await api.getAlertLog()); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { api.getRoles().then(setRoles).catch(() => {}); }, []);
  useEffect(() => { if (tab === 'rules') loadRules(); else loadLog(); /* eslint-disable-next-line */ }, [tab]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDrawerOpen(true); };
  const openEdit = (r: api.AlertRule) => {
    setEditingId(r.id);
    setForm({
      name: r.name, metric_key: r.metric_key, params: (r.params ?? {}) as Record<string, unknown>,
      frequency: r.frequency, schedule_hour: r.schedule_hour, schedule_dow: r.schedule_dow ?? null, schedule_dom: r.schedule_dom ?? null,
      recipient_mode: r.recipient_mode, recipient_role_id: r.recipient_role_id ?? null, direct_emails: r.direct_emails ?? '',
      message_subject: r.message_subject ?? '', message_body: r.message_body ?? '', dedup_hours: r.dedup_hours, active: r.active,
    });
    setDrawerOpen(true);
  };

  const setParam = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, params: { ...(f.params ?? {}), [key]: value } }));
  const onMetricChange = (metric: string) =>
    setForm((f) => ({ ...f, metric_key: metric, params: {} }));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editingId) { await api.updateAlert(editingId, form); toast.success('Alert updated'); }
      else { await api.createAlert(form); toast.success('Alert created'); }
      setDrawerOpen(false); await loadRules();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (r: api.AlertRule) => {
    try { await api.setAlertActive(r.id, !r.active); setRules((list) => list.map((x) => x.id === r.id ? { ...x, active: !x.active } : x)); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };
  const remove = async (r: api.AlertRule) => {
    if (!confirm(`Delete alert "${r.name}"?`)) return;
    try { await api.deleteAlert(r.id); setRules((list) => list.filter((x) => x.id !== r.id)); toast.success('Deleted'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };
  const runNow = async () => { try { await api.runAlerts(); toast.success('Evaluation started'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } };

  const metricDef = METRICS[form.metric_key];

  const condition = (r: api.AlertRule) => {
    const p = (r.params ?? {}) as Record<string, unknown>;
    switch (r.metric_key) {
      case 'activity_target': return `< ${p.min_count ?? '?'} ${p.activity ?? ''} / ${p.window_days ?? 1}d`;
      case 'candidate_stage_aging': return `in stage > ${p.days ?? '?'}d`;
      case 'contract_stalled': return `> ${p.days ?? '?'}d in ${(p.statuses as string[] | undefined)?.join('/') ?? 'draft'}`;
      case 'meeting_followup': return `held, no outcome > ${p.days ?? '?'}d`;
      case 'payroll_missing': return `missing by day ${p.deadline_dom ?? '?'}`;
      default: return '—';
    }
  };
  const schedule = (r: api.AlertRule) => {
    const h = `${String(r.schedule_hour).padStart(2, '0')}:00`;
    if (r.frequency === 'weekly') return `Weekly · ${DOW[(r.schedule_dow ?? 1) - 1] ?? '?'} · ${h}`;
    if (r.frequency === 'monthly') return `Monthly · day ${r.schedule_dom ?? '?'} · ${h}`;
    return `Daily · ${h}`;
  };
  const recipient = (r: api.AlertRule) => {
    if (r.recipient_mode === 'direct_email') return r.direct_emails || '—';
    if (r.recipient_mode === 'role_in_dept') return `${roleName(r.recipient_role_id)} (dept)`;
    if (r.recipient_mode === 'global_role') return `${roleName(r.recipient_role_id)} (global)`;
    if (r.recipient_mode === 'subject') return 'Subject (self)';
    return 'Subject owner';
  };
  const needsRole = form.recipient_mode === 'role_in_dept' || form.recipient_mode === 'global_role';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Alerts Builder"
        subtitle="KPI alerts"
        actions={canManage ? (
          <div className="flex gap-2">
            <button type="button" onClick={runNow} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">Run now</button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90">+ New alert</button>
          </div>
        ) : undefined}
      />

      <div className="flex gap-2 border-b border-slate-200">
        {(['rules', 'log'] as const).map((tb) => (
          <button key={tb} type="button" onClick={() => setTab(tb)}
            className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${tab === tb ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {tb === 'rules' ? 'Alerts' : 'Activity log'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>
      ) : tab === 'rules' ? (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Metric</TH><TH>Condition</TH><TH>Notify</TH><TH>Schedule</TH><TH>Active</TH><TH className="text-right">Actions</TH></TR>
            </THead>
            <TBody>
              {rules.length === 0 ? (
                <TR><TD colSpan={7} className="py-12 text-center text-slate-400">No alerts yet. Click “New alert” to create one.</TD></TR>
              ) : rules.map((r) => (
                <TR key={r.id}>
                  <TD className="font-bold text-[#0f172a]">{r.name}</TD>
                  <TD><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">{METRICS[r.metric_key]?.label ?? r.metric_key}</span></TD>
                  <TD className="text-slate-600 font-mono text-xs">{condition(r)}</TD>
                  <TD className="text-slate-600">{recipient(r)}</TD>
                  <TD className="text-slate-600">{schedule(r)}</TD>
                  <TD>
                    <button type="button" disabled={!canManage} onClick={() => toggleActive(r)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${r.active ? 'bg-brand' : 'bg-slate-300'} disabled:opacity-50`}>
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${r.active ? 'left-5' : 'left-1'}`} />
                    </button>
                  </TD>
                  <TD className="text-right">
                    {canManage && (
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(r)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Edit</button>
                        <button type="button" onClick={() => remove(r)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">Delete</button>
                      </div>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead><TR><TH>When</TH><TH>Subject</TH><TH>Status</TH><TH>Recipients</TH><TH>Detail</TH></TR></THead>
            <TBody>
              {logEntries.length === 0 ? (
                <TR><TD colSpan={5} className="py-12 text-center text-slate-400">No alert activity yet.</TD></TR>
              ) : logEntries.map((l) => (
                <TR key={l.id}>
                  <TD className="text-slate-500 text-sm whitespace-nowrap">{new Date(l.sent_at).toLocaleString()}</TD>
                  <TD className="font-mono text-xs text-slate-600">{l.subject_key}</TD>
                  <TD>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${l.status === 'sent' ? 'bg-green-100 text-green-700' : l.status === 'skipped' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span>
                  </TD>
                  <TD className="text-slate-600 text-sm">{l.recipients || '—'}</TD>
                  <TD className="text-slate-500 text-sm max-w-md truncate">{l.detail || '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* ---- Editor drawer ---- */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? 'Edit alert' : 'New alert'} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Recruiter below daily target" />

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Metric</label>
            <NativeSelect value={form.metric_key} onChange={(e) => onMetricChange(e.target.value)}>
              {Object.entries(METRICS).map(([k, m]) => (<option key={k} value={k}>{m.label}</option>))}
            </NativeSelect>
            {metricDef && <p className="mt-1.5 text-xs text-slate-400">{metricDef.desc}</p>}
          </div>

          {/* dynamic params */}
          {metricDef && (
            <div className="rounded-xl border border-dashed border-brand/40 bg-brand/5 p-3 space-y-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand">Parameters</div>
              {metricDef.params.map((p) => {
                const val = (form.params ?? {})[p.key];
                if (p.type === 'number') return (
                  <Input key={p.key} label={p.label} type="number" value={val == null ? '' : String(val)} placeholder={p.placeholder}
                    onChange={(e) => setParam(p.key, e.target.value === '' ? undefined : Number(e.target.value))} />
                );
                if (p.type === 'select') return (
                  <div key={p.key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{p.label}</label>
                    <NativeSelect value={(val as string) ?? ''} onChange={(e) => setParam(p.key, e.target.value)}>
                      <option value="">— Select —</option>
                      {p.options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </NativeSelect>
                  </div>
                );
                if (p.type === 'role') return (
                  <div key={p.key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{p.label}</label>
                    <NativeSelect value={val ? String(val) : ''} onChange={(e) => setParam(p.key, e.target.value ? Number(e.target.value) : undefined)}>
                      <option value="">— Select role —</option>
                      {roles.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </NativeSelect>
                  </div>
                );
                // multi
                const arr = (val as string[] | undefined) ?? [];
                return (
                  <div key={p.key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{p.label}</label>
                    <div className="flex flex-wrap gap-2">
                      {p.options.map((o) => {
                        const sel = arr.includes(o);
                        return (
                          <button key={o} type="button"
                            onClick={() => setParam(p.key, sel ? arr.filter((x) => x !== o) : [...arr, o])}
                            className={`text-xs rounded-full px-3 py-1.5 border ${sel ? 'bg-brand border-brand text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{o}</button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* schedule */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Frequency</label>
              <NativeSelect value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as api.AlertInput['frequency'] }))}>
                {FREQS.map((fq) => (<option key={fq} value={fq}>{fq}</option>))}
              </NativeSelect>
            </div>
            {form.frequency === 'weekly' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Day</label>
                <NativeSelect value={String(form.schedule_dow ?? 1)} onChange={(e) => setForm((f) => ({ ...f, schedule_dow: Number(e.target.value) }))}>
                  {DOW.map((d, i) => (<option key={d} value={i + 1}>{d}</option>))}
                </NativeSelect>
              </div>
            )}
            {form.frequency === 'monthly' && (
              <Input label="Day of month" type="number" value={String(form.schedule_dom ?? 1)} onChange={(e) => setForm((f) => ({ ...f, schedule_dom: Number(e.target.value) }))} />
            )}
            <Input label="Hour (0-23)" type="number" value={String(form.schedule_hour)} onChange={(e) => setForm((f) => ({ ...f, schedule_hour: Number(e.target.value) }))} />
          </div>

          {/* recipient */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recipient</label>
            <NativeSelect value={form.recipient_mode} onChange={(e) => setForm((f) => ({ ...f, recipient_mode: e.target.value as api.AlertRule['recipient_mode'] }))}>
              {RECIPIENT_MODES.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
            </NativeSelect>
          </div>
          {needsRole && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role to notify</label>
              <NativeSelect value={form.recipient_role_id ? String(form.recipient_role_id) : ''} onChange={(e) => setForm((f) => ({ ...f, recipient_role_id: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">— Select role —</option>
                {roles.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </NativeSelect>
            </div>
          )}
          <Input label="Direct email(s) — used for direct mode, or as fallback" value={form.direct_emails ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, direct_emails: e.target.value }))} placeholder="a@co.com, b@co.com" />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            Active
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
