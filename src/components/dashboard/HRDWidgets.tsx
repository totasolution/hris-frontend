import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { QuickActions } from './QuickActions';
import * as api from '../../services/api';

type HRDWidgetsProps = {
  permissions: string[];
};

export function HRDWidgets({ permissions }: HRDWidgetsProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    internalEmployees: 0,
    externalEmployees: 0,
    activeContracts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const employees = await api.getEmployees({ per_page: 1000 }).then((r) => r.data);
        const internal = employees.filter((e) => e.employee_type === 'internal');
        const external = employees.filter((e) => e.employee_type === 'external');

        setStats({
          totalEmployees: employees.length,
          internalEmployees: internal.length,
          externalEmployees: external.length,
          activeContracts: 0, // TODO: Get from contracts API
        });
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
