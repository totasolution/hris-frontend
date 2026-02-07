import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { RecruitmentStatistics, Client, Project } from '../services/api';
import * as api from '../services/api';

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  screening: 'Screening',
  screened_pass: 'Screened Pass',
  screened_fail: 'Screened Fail',
  submitted: 'Submitted to Client',
  interview_scheduled: 'Interviewing',
  interview_passed: 'Interview Passed',
  interview_failed: 'Interview Failed',
  onboarding: 'Onboarding',
  onboarding_completed: 'Onboarding Done',
  contract_requested: 'Contract Requested',
  hired: 'Hired',
  rejected: 'Rejected',
};

const STATUS_ORDER = [
  'new',
  'screening',
  'screened_pass',
  'screened_fail',
  'submitted',
  'interview_scheduled',
  'interview_passed',
  'interview_failed',
  'onboarding',
  'onboarding_completed',
  'contract_requested',
  'hired',
  'rejected',
];

const customSelectStyles = {
  control: (base: object) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    padding: '2px',
    boxShadow: 'none',
  }),
  option: (base: object, state: { isSelected?: boolean; isFocused?: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
    fontSize: '0.875rem',
  }),
};

export default function RecruitmentStatisticsPage() {
  const [stats, setStats] = useState<RecruitmentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { client_id?: number; project_id?: number } = {};
      if (clientId) params.client_id = parseInt(clientId, 10);
      if (projectId) params.project_id = parseInt(projectId, 10);
      const data = await api.getRecruitmentStatistics(params);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [clientId, projectId]);

  useEffect(() => {
    Promise.all([api.getClients(), api.getProjects()])
      .then(([cList, pList]) => {
        setClients(cList);
        setProjects(pList);
      })
      .catch(() => {});
  }, []);

  const filteredProjects = projects.filter((p) => !clientId || String(p.client_id) === clientId);
  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.name }));
  const projectOptions = filteredProjects.map((p) => ({ value: String(p.id), label: p.name }));

  const maxPipelineCount = stats
    ? Math.max(1, ...Object.values(stats.by_status))
    : 1;

  const candidatesLink = (params: { status?: string; client_id?: string; project_id?: string; created_by?: string }) => {
    const p = new URLSearchParams();
    if (params.status) p.set('status', params.status);
    if (params.client_id) p.set('client_id', params.client_id);
    if (params.project_id) p.set('project_id', params.project_id);
    if (params.created_by) p.set('created_by', params.created_by);
    const q = p.toString();
    return q ? `/candidates?${q}` : '/candidates';
  };

  return (
    <div className="space-y-8 font-body">
      <PageHeader
        title="Recruitment Statistics"
        subtitle="Pipeline overview and metrics"
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <Select
            options={clientOptions}
            value={clientOptions.find((o) => o.value === clientId)}
            onChange={(option: { value: string } | null) => {
              setClientId(option?.value ?? '');
              setProjectId('');
            }}
            placeholder="All Clients"
            styles={customSelectStyles}
            isClearable
            isSearchable
          />
        </div>
        <div className="w-64">
          <Select
            options={projectOptions}
            value={projectOptions.find((o) => o.value === projectId)}
            onChange={(option: { value: string } | null) => setProjectId(option?.value ?? '')}
            placeholder="All Projects"
            styles={customSelectStyles}
            isClearable
            isSearchable
            isDisabled={!clientId}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Candidates"
          value={stats?.totals.all ?? 0}
          loading={loading}
          color="brand"
          link="/candidates"
        />
        <StatCard
          title="Active"
          value={stats?.totals.active ?? 0}
          loading={loading}
          color="blue"
          link={candidatesLink({})}
        />
        <StatCard
          title="Hired"
          value={stats?.totals.hired ?? 0}
          loading={loading}
          color="green"
          link={candidatesLink({ status: 'hired' })}
        />
        <StatCard
          title="Rejected"
          value={stats?.totals.rejected ?? 0}
          loading={loading}
          color="red"
          link={candidatesLink({ status: 'rejected' })}
        />
        <StatCard
          title="New This Month"
          value={stats?.totals.new_this_month ?? 0}
          loading={loading}
          color="orange"
        />
        <StatCard
          title="Hired This Month"
          value={stats?.totals.hired_this_month ?? 0}
          loading={loading}
          color="green"
        />
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
            Pipeline by Status
          </h3>
          <Link
            to="/candidates"
            className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-widest"
          >
            View all
          </Link>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {STATUS_ORDER.filter((s) => (stats.by_status[s] ?? 0) > 0).map((status) => {
                const count = stats.by_status[status] ?? 0;
                const pct = Math.round((count / maxPipelineCount) * 100);
                return (
                  <div key={status} className="flex items-center gap-4">
                    <div className="w-40 shrink-0">
                      <Link
                        to={candidatesLink({
                          status,
                          client_id: clientId || undefined,
                          project_id: projectId || undefined,
                        })}
                        className="text-sm font-bold text-slate-700 hover:text-brand"
                      >
                        {STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
                      </Link>
                    </div>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg transition-all ${
                          status === 'hired'
                            ? 'bg-green-500'
                            : status === 'rejected'
                              ? 'bg-red-400'
                              : 'bg-brand'
                        }`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-bold text-slate-600">{count}</span>
                  </div>
                );
              })}
              {Object.keys(stats.by_status).length === 0 && (
                <p className="py-8 text-center text-slate-400">No candidates yet.</p>
              )}
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* By Client & By Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              By Client
            </h3>
            <Link
              to="/candidates"
              className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-widest"
            >
              View candidates
            </Link>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Client</TH>
                <TH className="text-right">Count</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={2} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand mx-auto" />
                  </TD>
                </TR>
              ) : stats?.by_client.length === 0 ? (
                <TR>
                  <TD colSpan={2} className="py-8 text-center text-slate-400">
                    No data
                  </TD>
                </TR>
              ) : (
                stats?.by_client.map((row) => (
                  <TR key={row.client_id ?? 'none'}>
                    <TD className="font-medium">
                      <Link
                        to={candidatesLink({
                          client_id: row.client_id ? String(row.client_id) : undefined,
                          project_id: projectId || undefined,
                        })}
                        className="text-brand hover:underline"
                      >
                        {row.client_name}
                      </Link>
                    </TD>
                    <TD className="text-right font-bold">{row.count}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              By Project
            </h3>
            <Link
              to="/candidates"
              className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-widest"
            >
              View candidates
            </Link>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Project</TH>
                <TH className="text-right">Count</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={2} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand mx-auto" />
                  </TD>
                </TR>
              ) : stats?.by_project.length === 0 ? (
                <TR>
                  <TD colSpan={2} className="py-8 text-center text-slate-400">
                    No data
                  </TD>
                </TR>
              ) : (
                stats?.by_project.map((row) => (
                  <TR key={row.project_id ?? 'none'}>
                    <TD className="font-medium">
                      <Link
                        to={candidatesLink({
                          client_id: clientId || undefined,
                          project_id: row.project_id ? String(row.project_id) : undefined,
                        })}
                        className="text-brand hover:underline"
                      >
                        {row.project_name}
                      </Link>
                    </TD>
                    <TD className="text-right font-bold">{row.count}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              By PIC / Recruiter
            </h3>
            <Link
              to="/candidates"
              className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-widest"
            >
              View candidates
            </Link>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>PIC / Recruiter</TH>
                <TH className="text-right">Count</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={2} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand mx-auto" />
                  </TD>
                </TR>
              ) : stats?.by_pic?.length === 0 ? (
                <TR>
                  <TD colSpan={2} className="py-8 text-center text-slate-400">
                    No data
                  </TD>
                </TR>
              ) : (
                stats?.by_pic?.map((row) => (
                  <TR key={row.pic_id ?? 'none'}>
                    <TD className="font-medium">
                      {row.pic_id ? (
                        <Link
                          to={candidatesLink({
                            created_by: String(row.pic_id),
                            client_id: clientId || undefined,
                            project_id: projectId || undefined,
                          })}
                          className="text-brand hover:underline"
                        >
                          {row.pic_name}
                        </Link>
                      ) : (
                        <span className="text-slate-600">{row.pic_name}</span>
                      )}
                    </TD>
                    <TD className="text-right font-bold">{row.count}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
