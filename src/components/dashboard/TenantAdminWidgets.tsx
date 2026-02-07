import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { QuickActions } from './QuickActions';
import * as api from '../../services/api';

type TenantAdminWidgetsProps = {
  permissions: string[];
};

export function TenantAdminWidgets({ permissions }: TenantAdminWidgetsProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    internalEmployees: 0,
    externalEmployees: 0,
    activeProjects: 0,
    totalClients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [employeesRes, projects, clients] = await Promise.all([
          api.getEmployees({ per_page: 1000 }),
          api.getProjects(),
          api.getClients(),
        ]);
        const employees = employeesRes.data;
        const internal = employees.filter((e) => e.employee_type === 'internal');
        const external = employees.filter((e) => e.employee_type === 'external');
        const activeProjects = projects.filter((p) => p.status === 'active').length;

        setStats({
          totalEmployees: employees.length,
          internalEmployees: internal.length,
          externalEmployees: external.length,
          activeProjects,
          totalClients: clients.length,
        });
      } catch (err) {
        console.error('Failed to load tenant admin dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Employees"
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
          title="Active Projects"
          value={stats.activeProjects}
          loading={loading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          link="/projects"
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          loading={loading}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          link="/clients"
        />
      </div>

      <QuickActions
        actions={[
          { label: 'Add User', path: '/users/new', variant: 'primary', permission: 'user:create' },
          { label: 'Create Department', path: '/departments/new', variant: 'secondary', permission: 'department:create' },
          { label: 'Add Client', path: '/clients/new', variant: 'secondary', permission: 'client:create' },
          { label: 'Create Project', path: '/projects/new', variant: 'secondary', permission: 'project:create' },
        ]}
        userPermissions={permissions}
      />
    </div>
  );
}
