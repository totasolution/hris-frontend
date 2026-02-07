import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from './StatCard';
import { TableWidget } from './TableWidget';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import * as api from '../../services/api';

type HRDWidgetsProps = {
  permissions: string[];
};

export function HRDWidgets({ permissions }: HRDWidgetsProps) {
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalEmployees: 0,
    internalEmployees: 0,
    externalEmployees: 0,
    activeContracts: 0,
    recentWarnings: 0,
  });
  const [pendingApprovals, setPendingApprovals] = useState<api.OnboardingFormData[]>([]);
  const [recentWarnings, setRecentWarnings] = useState<api.WarningLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pendingHRD, employees, warnings] = await Promise.all([
          api.getPendingHRDList(),
          api.getEmployees({ per_page: 1000 }).then((r) => r.data),
          api.getWarnings({ per_page: 1000 }).then((r) => r.data),
        ]);

        const internal = employees.filter((e) => e.employee_type === 'internal');
        const external = employees.filter((e) => e.employee_type === 'external');

        setStats({
          pendingApprovals: pendingHRD.length,
          totalEmployees: employees.length,
          internalEmployees: internal.length,
          externalEmployees: external.length,
          activeContracts: 0, // TODO: Get from contracts API
          recentWarnings: warnings.length,
        });
        setPendingApprovals(pendingHRD.slice(0, 5));
        setRecentWarnings(warnings.slice(0, 5));
      } catch (err) {
        console.error('Failed to load HRD dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          loading={loading}
          color={stats.pendingApprovals > 0 ? 'orange' : 'green'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          link="/onboarding/pending-hrd"
        />
        <StatCard
          title="Total Workforce"
          value={stats.totalEmployees}
          subtitle={`${stats.internalEmployees} internal, ${stats.externalEmployees} external`}
          loading={loading}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          link="/employees"
        />
        <StatCard
          title="Active Contracts"
          value={stats.activeContracts}
          loading={loading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          link="/contracts"
        />
        <StatCard
          title="Recent Warnings"
          value={stats.recentWarnings}
          loading={loading}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          link="/warnings"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {stats.pendingApprovals > 0 && (
          <div className="md:col-span-2 lg:col-span-1">
            <div className="group relative overflow-hidden rounded-[2rem] bg-orange-50 p-8 border-2 border-orange-200 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-orange-900 font-headline">Action Required</h3>
                  <p className="text-sm text-orange-700 mt-1">Pending HRD Approvals</p>
                </div>
                <span className="text-4xl font-black text-orange-600">{stats.pendingApprovals}</span>
              </div>
              <Link
                to="/onboarding/pending-hrd"
                className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-orange-700 active:scale-95 shadow-lg"
              >
                Review Now →
              </Link>
            </div>
          </div>
        )}

        <TableWidget
          title="Pending Approvals"
          subtitle="Onboarding forms awaiting approval"
          columns={[
            {
              key: 'candidate_name',
              label: 'Candidate',
              render: (form) => form.candidate_name || 'N/A',
            },
            {
              key: 'status',
              label: 'Status',
              render: () => (
                <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-orange-50 text-orange-600">
                  Pending
                </span>
              ),
            },
          ]}
          data={pendingApprovals}
          loading={loading}
          emptyMessage="No pending approvals"
          viewAllLink="/onboarding/pending-hrd"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity
          title="Recent Warnings"
          subtitle="Latest warning letters issued"
          items={recentWarnings.map((warning) => ({
            id: warning.id,
            title: `Warning ${warning.type}`,
            subtitle: `Employee ID: ${warning.employee_id}`,
            link: `/warnings/${warning.id}`,
          }))}
          loading={loading}
          emptyMessage="No recent warnings"
          viewAllLink="/warnings"
        />

        <QuickActions
          actions={[
            { label: 'Review Approvals', path: '/onboarding/pending-hrd', variant: 'primary', permission: 'onboarding:approve' },
            { label: 'Create Warning', path: '/warnings/new', variant: 'secondary', permission: 'warning:create' },
            { label: 'View Contracts', path: '/contracts', variant: 'secondary', permission: 'contract:read' },
            { label: 'Manage Employees', path: '/employees', variant: 'secondary', permission: 'employee:read' },
          ]}
          userPermissions={permissions}
        />
      </div>
    </div>
  );
}
