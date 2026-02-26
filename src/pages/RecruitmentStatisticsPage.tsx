import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { RecruitmentStatistics, Client } from '../services/api';
import * as api from '../services/api';

const PIE_COLORS = [
  '#107BC7', '#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#f87171', '#f97316', '#eab308', '#8b5cf6', '#ec4899',
];

const STATUS_GROUPS: Record<string, string[]> = {
  Screening: ['new', 'screening', 'screened_pass', 'screened_fail', 'submitted', 'interview_scheduled', 'interview_passed', 'interview_failed', 'onboarding', 'onboarding_completed'],
  Rejected: ['rejected'],
  OJT: ['ojt'],
  'Contract Requested': ['contract_requested'],
};

function getWeekRange(year: number, week: number): string {
  const jan4 = new Date(year, 0, 4);
  const daysFromMonday = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - daysFromMonday);
  const targetMonday = new Date(week1Monday);
  targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7);
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  return `${fmt(targetMonday)} – ${fmt(targetSunday)}`;
}

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
  const [periodFilter, setPeriodFilter] = useState<'week' | 'month'>('week');
  const [weekFilter, setWeekFilter] = useState<string>(() => {
    const d = new Date();
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const daysFromMonday = (jan4.getDay() + 6) % 7;
    const week1Mon = new Date(jan4);
    week1Mon.setDate(jan4.getDate() - daysFromMonday);
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSince = Math.floor((d.getTime() - week1Mon.getTime()) / msPerDay);
    let week = Math.floor(daysSince / 7) + 1;
    let y = d.getFullYear();
    if (daysSince < 0) {
      const prevJan4 = new Date(y - 1, 0, 4);
      const prevMon = new Date(prevJan4);
      prevMon.setDate(prevJan4.getDate() - ((prevJan4.getDay() + 6) % 7));
      week = Math.floor((d.getTime() - prevMon.getTime()) / msPerDay / 7) + 1;
      y -= 1;
    }
    return `${y}-W${String(Math.min(53, Math.max(1, week))).padStart(2, '0')}`;
  });
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [clients, setClients] = useState<Client[]>([]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { client_id?: number; period: 'week' | 'month'; year?: number; month?: number; week?: number } = {
        period: periodFilter,
      };
      if (clientId) params.client_id = parseInt(clientId, 10);
      if (periodFilter === 'week') {
        const match = weekFilter.match(/^(\d{4})-W?(\d{1,2})$/);
        if (match) {
          params.year = parseInt(match[1], 10);
          params.week = parseInt(match[2], 10);
        }
      } else {
        const [y, m] = monthFilter.split('-').map(Number);
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          params.year = y;
          params.month = m;
        }
      }
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
  }, [clientId, periodFilter, weekFilter, monthFilter]);

  useEffect(() => {
    api.getClients().then(setClients).catch(() => {});
  }, []);

  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.name }));

  const statusChartData =
    stats && Object.keys(stats.by_status).length > 0
      ? Object.entries(STATUS_GROUPS)
          .map(([groupName, statuses]) => ({
            name: groupName,
            value: statuses.reduce((sum, s) => sum + (stats.by_status[s] ?? 0), 0),
            statuses,
            type: 'grouped' as const,
          }))
          .filter((d) => d.value > 0)
      : [];

  const clientChartData =
    stats?.by_client?.filter((r) => r.count > 0).map((r) => ({
      name: r.client_name,
      value: r.count,
      client_id: r.client_id,
    })) ?? [];

  const periodLabel =
    periodFilter === 'week'
      ? (() => {
          const match = weekFilter.match(/^(\d{4})-W?(\d{1,2})$/);
          if (match) return getWeekRange(parseInt(match[1], 10), parseInt(match[2], 10));
          return 'This week';
        })()
      : monthFilter
        ? new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';

  const candidatesLink = (params: { status?: string; client_id?: string; created_by?: string }) => {
    const p = new URLSearchParams();
    if (params.status) p.set('status', params.status);
    if (params.client_id) p.set('client_id', params.client_id);
    if (params.created_by) p.set('created_by', params.created_by);
    const q = p.toString();
    return q ? `/candidates?${q}` : '/candidates';
  };

  return (
    <div className="space-y-4 font-body max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Recruitment Statistics"
          subtitle="Pipeline overview and metrics"
        />
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Period</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as 'week' | 'month')}
              className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none"
            >
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          {periodFilter === 'week' ? (
            <div className="flex flex-col gap-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Week</label>
              <input
                type="week"
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value || weekFilter)}
                className="w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none"
              />
            </div>
          )}
          <div className="w-52">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Client</label>
            <Select
              options={clientOptions}
              value={clientOptions.find((o) => o.value === clientId)}
              onChange={(option: { value: string } | null) => setClientId(option?.value ?? '')}
              placeholder="All Clients"
              styles={customSelectStyles}
              isClearable
              isSearchable
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Candidates" value={stats?.totals.all ?? 0} loading={loading} color="brand" link="/candidates" className="!p-4" />
        <StatCard title="Active" value={stats?.totals.active ?? 0} loading={loading} color="blue" link={candidatesLink({})} className="!p-4" />
        <StatCard title="Hired" value={stats?.totals.hired ?? 0} loading={loading} color="green" link={candidatesLink({ status: 'hired' })} className="!p-4" />
        <StatCard title="Rejected" value={stats?.totals.rejected ?? 0} loading={loading} color="red" link={candidatesLink({ status: 'rejected' })} className="!p-4" />
        <StatCard title={periodFilter === 'week' ? 'New This Week' : 'New This Month'} value={stats?.totals.new_this_period ?? 0} loading={loading} color="orange" className="!p-4" />
        <StatCard title={periodFilter === 'week' ? 'Hired This Week' : 'Hired This Month'} value={stats?.totals.hired_this_period ?? 0} loading={loading} color="green" className="!p-4" />
      </div>

      {/* Charts: Pipeline by Status + Pipeline by Client - side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="px-5 py-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Pipeline by Status
              {periodLabel && <span className="text-slate-500 font-normal normal-case tracking-normal ml-2">({periodLabel})</span>}
            </h3>
            <Link
              to="/candidates"
              className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-widest"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody className="!p-4 !pt-0">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
              </div>
            ) : statusChartData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={1}
                      label={({ name, percent }) => (percent >= 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : '')}
                    >
                    {statusChartData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      const linkStatus = d.type === 'grouped' && d.statuses?.length === 1
                        ? d.statuses[0]
                        : d.type === 'single'
                          ? d.status
                          : null;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
                          <p className="font-bold text-slate-800">{d.name}</p>
                          <p className="text-sm text-slate-600">{d.value} candidates</p>
                          {linkStatus && (
                            <Link
                              to={candidatesLink({ status: linkStatus, client_id: clientId || undefined })}
                              className="text-xs text-brand hover:underline mt-1 inline-block"
                            >
                              View candidates →
                            </Link>
                          )}
                          {d.type === 'grouped' && d.statuses?.length > 1 && (
                            <Link
                              to="/candidates"
                              className="text-xs text-brand hover:underline mt-1 inline-block"
                            >
                              View all candidates →
                            </Link>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-slate-400 text-sm">No candidates in this period.</p>
          )}
        </CardBody>
        </Card>

        <Card>
          <CardHeader className="px-5 py-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">
              Pipeline by Client
              {periodLabel && <span className="text-slate-500 font-normal normal-case tracking-normal ml-2">({periodLabel})</span>}
            </h3>
            <Link
              to="/candidates"
              className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-widest"
            >
              View candidates
            </Link>
          </CardHeader>
          <CardBody className="!p-4 !pt-0">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
              </div>
            ) : clientChartData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={1}
                      label={({ name, percent }) => (percent >= 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : '')}
                    >
                    {clientChartData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
                          <p className="font-bold text-slate-800">{d.name}</p>
                          <p className="text-sm text-slate-600">{d.value} candidates</p>
                          <Link
                            to={candidatesLink({ client_id: d.client_id != null ? String(d.client_id) : undefined })}
                            className="text-xs text-brand hover:underline mt-1 inline-block"
                          >
                            View candidates →
                          </Link>
                        </div>
                      );
                    }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-slate-400 text-sm">No data</p>
          )}
        </CardBody>
        </Card>
      </div>

      {/* By PIC (4 stages) */}
      <Card className="overflow-hidden">
          <CardHeader className="px-5 py-3">
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
          <div className="[&_th]:py-2 [&_td]:py-2 [&_th]:px-4 [&_td]:px-4 [&_td]:text-xs">
          <Table>
            <THead>
              <TR>
                <TH>PIC / Recruiter</TH>
                <TH className="text-right">Screening</TH>
                <TH className="text-right">Rejected</TH>
                <TH className="text-right">OJT</TH>
                <TH className="text-right">Contract Requested</TH>
                <TH className="text-right">Total</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={6} className="py-6 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand mx-auto" />
                  </TD>
                </TR>
              ) : !stats?.by_pic_stages?.length ? (
                <TR>
                  <TD colSpan={6} className="py-6 text-center text-slate-400 text-sm">
                    No data
                  </TD>
                </TR>
              ) : (
                stats.by_pic_stages.map((row) => (
                  <TR key={row.pic_id ?? 'none'}>
                    <TD className="font-medium">
                      {row.pic_id ? (
                        <Link
                          to={candidatesLink({
                            created_by: String(row.pic_id),
                            client_id: clientId || undefined,
                          })}
                          className="text-brand hover:underline"
                        >
                          {row.pic_name}
                        </Link>
                      ) : (
                        <span className="text-slate-600">{row.pic_name}</span>
                      )}
                    </TD>
                    <TD className="text-right font-bold">{row.screening}</TD>
                    <TD className="text-right font-bold text-red-600">{row.rejected}</TD>
                    <TD className="text-right font-bold">{row.ojt}</TD>
                    <TD className="text-right font-bold">{row.contract_requested}</TD>
                    <TD className="text-right font-bold text-slate-800">{row.screening + row.rejected + row.ojt + row.contract_requested}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
          </div>
        </Card>
    </div>
  );
}
