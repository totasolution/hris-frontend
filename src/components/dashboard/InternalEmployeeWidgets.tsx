import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { TableWidget } from './TableWidget';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import * as api from '../../services/api';

type InternalEmployeeWidgetsProps = {
  permissions: string[];
  userId?: number;
};

export function InternalEmployeeWidgets({ permissions, userId }: InternalEmployeeWidgetsProps) {
  const [employee, setEmployee] = useState<api.Employee | null>(null);
  const [contracts, setContracts] = useState<api.Contract[]>([]);
  const [warnings, setWarnings] = useState<api.WarningLetter[]>([]);
  const [tickets, setTickets] = useState<api.Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // TODO: Get current user's employee record
        // For now, fetch all and filter (should be optimized with backend endpoint)
        const [employeesRes, contractsRes, warningsRes, ticketsRes] = await Promise.all([
          api.getEmployees({ per_page: 1000 }),
          api.getContracts({ per_page: 1000 }),
          api.getWarnings({ per_page: 1000 }),
          api.getTickets({ per_page: 1000 }),
        ]);
        const allEmployees = employeesRes.data;
        const allContracts = contractsRes.data;
        const allWarnings = warningsRes.data;
        const allTickets = ticketsRes.data;

        // Find employee by user_id
        const myEmployee = userId ? allEmployees.find((e) => e.user_id === userId) : null;
        const myContracts = userId ? allContracts.filter((c) => c.employee_id === myEmployee?.id) : [];
        const myWarnings = userId ? allWarnings.filter((w) => w.employee_id === myEmployee?.id) : [];
        const myTickets = allTickets.filter((t) => t.author_id === userId);

        setEmployee(myEmployee || null);
        setContracts(myContracts);
        setWarnings(myWarnings);
        setTickets(myTickets);
      } catch (err) {
        console.error('Failed to load internal employee dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {employee && (
          <StatCard
            title="Employee Number"
            value={employee.employee_number || 'N/A'}
            loading={loading}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h3" />
              </svg>
            }
          />
        )}
        <StatCard
          title="My Contracts"
          value={contracts.length}
          loading={loading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          link="/me/documents"
        />
        <StatCard
          title="My Warnings"
          value={warnings.length}
          loading={loading}
          color={warnings.length > 0 ? 'red' : 'green'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          link="/me/warnings"
        />
        <StatCard
          title="My Tickets"
          value={tickets.length}
          loading={loading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          link="/me/tickets"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TableWidget
          title="My Contracts"
          subtitle="Contract history"
          columns={[
            {
              key: 'contract_number',
              label: 'Contract',
              render: (contract) => contract.contract_number || `#${contract.id}`,
            },
            {
              key: 'status',
              label: 'Status',
              render: (contract) => (
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                  contract.status === 'signed' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'
                }`}>
                  {contract.status}
                </span>
              ),
            },
          ]}
          data={contracts}
          loading={loading}
          emptyMessage="No contracts"
          viewAllLink="/me/documents"
        />

        <RecentActivity
          title="My Tickets"
          subtitle="Support requests"
          items={tickets.map((ticket) => ({
            id: ticket.id,
            title: ticket.subject,
            subtitle: ticket.status,
            link: `/me/tickets/${ticket.id}`,
          }))}
          loading={loading}
          emptyMessage="No tickets"
          viewAllLink="/me/tickets"
        />
      </div>

      <QuickActions
        actions={[
          { label: 'View Documents', path: '/me/documents', variant: 'primary' },
          { label: 'Create Ticket', path: '/tickets/new', variant: 'secondary', permission: 'ticket:create' },
          { label: 'View Warnings', path: '/me/warnings', variant: 'secondary' },
        ]}
        userPermissions={permissions}
      />
    </div>
  );
}
