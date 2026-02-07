import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { TableWidget } from './TableWidget';
import { QuickActions } from './QuickActions';
import * as api from '../../services/api';

type SuperAdminWidgetsProps = {
  permissions: string[];
};

export function SuperAdminWidgets({ permissions }: SuperAdminWidgetsProps) {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    systemHealth: 'healthy',
  });
  const [recentTenants, setRecentTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // TODO: Implement backend endpoints for super admin stats
        // For now, use placeholder data
        setStats({
          totalTenants: 0,
          activeTenants: 0,
          totalUsers: 0,
          systemHealth: 'healthy',
        });
        setRecentTenants([]);
      } catch (err) {
        console.error('Failed to load super admin dashboard data', err);
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
          title="Total Tenants"
          value={stats.totalTenants}
          loading={loading}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          link="/tenants"
        />
        <StatCard
          title="Active Tenants"
          value={stats.activeTenants}
          loading={loading}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          loading={loading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="System Status"
          value={stats.systemHealth}
          loading={loading}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TableWidget
          title="Recent Tenants"
          subtitle="Latest tenant registrations"
          columns={[
            { key: 'name', label: 'Tenant Name' },
            { key: 'status', label: 'Status' },
          ]}
          data={recentTenants}
          loading={loading}
          emptyMessage="No tenants yet"
          viewAllLink="/tenants"
        />

        <QuickActions
          actions={[
            { label: 'Create Tenant', path: '/tenants/new', variant: 'primary', permission: 'tenant:create' },
            { label: 'System Settings', path: '/system/settings', variant: 'secondary' },
          ]}
          userPermissions={permissions}
        />
      </div>
    </div>
  );
}
