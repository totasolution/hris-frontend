import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../Card';
import type { Ticket } from '../../services/api';
import * as api from '../../services/api';
import { formatDate } from '../../utils/formatDate';

type NewTicketsWidgetProps = {
  permissions: string[];
};

export function NewTicketsWidget({ permissions }: NewTicketsWidgetProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const canSee = permissions.includes('ticket:read');

  useEffect(() => {
    if (!canSee) {
      setLoading(false);
      return;
    }
    api
      .getDepartmentNewTickets()
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [canSee]);

  if (!canSee) return null;

  return (
    <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
      <CardHeader>
        <h3 className="text-lg font-bold text-brand-dark font-headline">New Tickets</h3>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
          Open tickets for your department
        </p>
      </CardHeader>
      <CardBody className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No new tickets</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <Link
                key={t.id}
                to={`/tickets/${t.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-dark truncate">{t.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    #{t.id} • {formatDate(t.created_at)}
                  </p>
                </div>
                <span className="text-slate-300 group-hover:text-brand transition-colors">→</span>
              </Link>
            ))}
          </div>
        )}
      </CardBody>
      {tickets.length > 0 && (
        <div className="p-6 mt-auto border-t border-slate-50">
          <Link
            to="/tickets?status=open"
            className="flex items-center justify-center w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-brand-lighter hover:text-brand transition-all"
          >
            View All Open Tickets
          </Link>
        </div>
      )}
    </Card>
  );
}
