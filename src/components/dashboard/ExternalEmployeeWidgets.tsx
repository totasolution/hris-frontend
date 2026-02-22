import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { TableWidget } from './TableWidget';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import * as api from '../../services/api';

type ExternalEmployeeWidgetsProps = {
  permissions: string[];
  userId?: number;
};

export function ExternalEmployeeWidgets({ permissions, userId }: ExternalEmployeeWidgetsProps) {
  const [employee, setEmployee] = useState<api.Employee | null>(null);
  const [contracts, setContracts] = useState<api.Contract[]>([]);
  const [paklarings, setPaklarings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<api.Ticket[]>([]);
  const [client, setClient] = useState<api.Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // TODO: Get current user's employee record
        // For now, fetch all and filter (should be optimized with backend endpoint)
        const [allEmployees, allContracts, allTickets, allClients] = await Promise.all([
          api.getEmployees({ per_page: 1000 }).then((r) => r.data),
          api.getContracts({ per_page: 1000 }).then((r) => r.data),
          api.getTickets({ per_page: 1000 }).then((r) => r.data),
          api.getClients(),
        ]);

        // Find employee by user_id
        const myEmployee = userId ? allEmployees.find((e) => e.user_id === userId) : null;
        const myContracts = userId ? allContracts.filter((c) => c.employee_id === myEmployee?.id) : [];
        const myTickets = allTickets.filter((t) => t.author_id === userId);
        const myClient = myEmployee?.client_id ? allClients.find((c) => c.id === myEmployee.client_id) : null;

        // TODO: Get Paklarings for this employee
        setEmployee(myEmployee || null);
        setContracts(myContracts);
        setTickets(myTickets);
        setClient(myClient || null);
        setPaklarings([]); // TODO: Implement Paklaring API
      } catch (err) {
        console.error('Failed to load external employee dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  const activeContract = contracts.find((c) => c.status === 'signed');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Contract"
          value={activeContract ? 'Active' : 'None'}
          subtitle={activeContract?.contract_number || 'No active contract'}
          loading={loading}
          color={activeContract ? 'green' : 'orange'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          link="/me/documents"
        />
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
          title="Paklaring"
          value={paklarings.length}
          loading={loading}
          color={paklarings.length > 0 ? 'green' : 'gray'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          link="/me/documents"
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

      {client && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="group relative overflow-hidden rounded-[2rem] bg-green-50 p-8 border-2 border-green-200 shadow-xl">
            <h3 className="text-xl font-bold text-green-900 font-headline mb-4">Client</h3>
            <p className="text-lg font-bold text-green-700">{client.name}</p>
            {client.contact_name && (
              <p className="text-sm text-green-600 mt-2">Contact: {client.contact_name}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TableWidget
          title="My Contracts"
          subtitle="Contract status and history"
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
                  contract.status === 'signed' ? 'bg-green-50 text-green-600' : 
                  contract.status === 'sent_for_signature' ? 'bg-orange-50 text-orange-600' :
                  'bg-slate-50 text-slate-600'
                }`}>
                  {contract.status.replace('_', ' ')}
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
            link: `/tickets/${ticket.id}`,
          }))}
          loading={loading}
          emptyMessage="No tickets"
          viewAllLink="/me/tickets"
        />
      </div>

      <QuickActions
        actions={[
          { label: 'View Documents', path: '/me/documents', variant: 'primary' },
          { label: 'Download Paklaring', path: '/me/documents', variant: paklarings.length > 0 ? 'primary' : 'secondary' },
          { label: 'Create Ticket', path: '/tickets/new', variant: 'secondary', permission: 'ticket:create' },
          { label: 'View FAQ', path: '/faq', variant: 'secondary' },
        ]}
        userPermissions={permissions}
      />
    </div>
  );
}
