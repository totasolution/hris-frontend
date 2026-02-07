import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { TableWidget } from './TableWidget';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import * as api from '../../services/api';

type ManagerWidgetsProps = {
  permissions: string[];
  userId?: number;
};

export function ManagerWidgets({ permissions, userId }: ManagerWidgetsProps) {
  const [stats, setStats] = useState({
    teamSize: 0,
    internalTeam: 0,
    externalTeam: 0,
    openTickets: 0,
    teamWarnings: 0,
  });
  const [teamMembers, setTeamMembers] = useState<api.Employee[]>([]);
  const [tickets, setTickets] = useState<api.Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [employees, ticketList] = await Promise.all([
          api.getEmployees({ per_page: 1000 }).then((r) => r.data),
          api.getTickets({ per_page: 1000 }).then((r) => r.data),
        ]);

        // TODO: Filter by department/team based on manager's department
        // For now, show all employees (should be filtered by manager's department)
        const internal = employees.filter((e) => e.employee_type === 'internal');
        const external = employees.filter((e) => e.employee_type === 'external');
        const openTickets = ticketList.filter((t) => t.status === 'open' || t.status === 'in_progress');

        setStats({
          teamSize: employees.length,
          internalTeam: internal.length,
          externalTeam: external.length,
          openTickets: openTickets.length,
          teamWarnings: 0, // TODO: Get warnings for team members
        });
        setTeamMembers(employees.slice(0, 5));
        setTickets(openTickets.slice(0, 5));
      } catch (err) {
        console.error('Failed to load manager dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Team Size"
          value={stats.teamSize}
          subtitle={`${stats.internalTeam} internal, ${stats.externalTeam} external`}
          loading={loading}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          link="/employees"
        />
        <StatCard
          title="Open Tickets"
          value={stats.openTickets}
          loading={loading}
          color={stats.openTickets > 0 ? 'orange' : 'green'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          link="/tickets"
        />
        <StatCard
          title="Team Warnings"
          value={stats.teamWarnings}
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
        <TableWidget
          title="Team Members"
          subtitle="Your team overview"
          columns={[
            {
              key: 'full_name',
              label: 'Employee',
              render: (emp) => (
                <div>
                  <p className="text-sm font-bold text-brand-dark">{emp.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {emp.employee_type === 'internal' ? 'Internal' : 'External'}
                  </p>
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (emp) => (
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                  emp.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'
                }`}>
                  {emp.status}
                </span>
              ),
            },
          ]}
          data={teamMembers}
          loading={loading}
          emptyMessage="No team members"
          viewAllLink="/employees"
          getRowLink={(emp) => `/employees/${emp.id}`}
        />

        <RecentActivity
          title="Department Tickets"
          subtitle="Tickets requiring attention"
          items={tickets.map((ticket) => ({
            id: ticket.id,
            title: ticket.subject,
            subtitle: ticket.status,
            link: `/tickets/${ticket.id}`,
          }))}
          loading={loading}
          emptyMessage="No open tickets"
          viewAllLink="/tickets"
        />
      </div>

      <QuickActions
        actions={[
          { label: 'View Team', path: '/employees', variant: 'primary', permission: 'employee:read' },
          { label: 'Respond to Tickets', path: '/tickets', variant: 'secondary', permission: 'ticket:respond' },
        ]}
        userPermissions={permissions}
      />
    </div>
  );
}
