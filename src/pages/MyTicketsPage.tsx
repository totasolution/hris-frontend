import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Ticket } from '../services/api';
import * as api from '../services/api';

type MyTicketsPageProps = { embedded?: boolean };

export default function MyTicketsPage({ embedded }: MyTicketsPageProps) {
  const location = useLocation();
  const [list, setList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const returnTo = embedded ? '/me' : location.pathname;

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getMyTickets()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-8'}>
      {!embedded && (
        <PageHeader
          title="My Support Tickets"
          subtitle="Track your submitted inquiries and their status"
          actions={<ButtonLink to={`/tickets/new?return=${encodeURIComponent(returnTo)}`}>New Ticket</ButtonLink>}
        />
      )}
      {embedded && (
        <div className="flex justify-end">
          <ButtonLink to={`/tickets/new?return=${encodeURIComponent(returnTo)}`}>New Ticket</ButtonLink>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Subject</TH>
                <TH>Status</TH>
                <TH>Created Date</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    You haven't submitted any support tickets yet.
                  </TD>
                </TR>
              ) : (
                list.map((t) => (
                  <TR key={t.id}>
                    <TD className="font-bold text-[#0f172a]">{t.subject}</TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        t.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        t.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </TD>
                    <TD>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</TD>
                    <TD className="text-right">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="p-2 text-slate-400 hover:text-brand transition-colors inline-block"
                        title="View Ticket Thread"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
