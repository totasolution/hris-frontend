import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../Card';
import { Button } from '../Button';
import { useToast } from '../Toast';
import { useAuth } from '../../contexts/AuthContext';
import type { Ticket } from '../../services/api';
import * as api from '../../services/api';
import { formatDate } from '../../utils/formatDate';

type NewTicketsWidgetProps = {
  permissions: string[];
};

export function NewTicketsWidget({ permissions }: NewTicketsWidgetProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canSee = permissions.includes('dashboard:ticket');
  const canRespond = permissions.includes('ticket:respond');

  const loadTickets = () => {
    if (!canSee) {
      setLoading(false);
      return;
    }
    api
      .getDepartmentNewTickets()
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, [canSee]);

  const handleTakeOver = async (ticketId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canRespond || !user?.id) return;
    
    setAssigning(ticketId);
    try {
      await api.assignTicket(ticketId);
      toast.success('You have taken over this ticket');
      loadTickets();
      // Navigate to ticket detail after taking over
      setTimeout(() => navigate(`/tickets/${ticketId}`), 500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to take over ticket');
    } finally {
      setAssigning(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins > 0 ? `${diffMins}m ago` : 'Just now';
  };

  const isUrgent = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours > 24; // Urgent if older than 24 hours
  };

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
          <div className="space-y-3">
            {tickets.map((t) => {
              const urgent = isUrgent(t.created_at);
              const canTakeOver = canRespond && !t.assignee_id && user?.id;
              
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    urgent
                      ? 'bg-red-50 border-red-100 hover:bg-red-100'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/tickets/${t.id}`}
                          className="text-sm font-bold text-brand-dark hover:text-brand transition-colors truncate"
                        >
                          {t.subject}
                        </Link>
                        {urgent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-200 text-red-700">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                        <span>#{t.id}</span>
                        <span>•</span>
                        {t.author_name && (
                          <>
                            <span className="font-medium text-slate-600">From: {t.author_name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{getTimeAgo(t.created_at)}</span>
                        <span>•</span>
                        <span>{formatDate(t.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canTakeOver && (
                        <Button
                          variant="primary"
                          onClick={(e) => handleTakeOver(t.id, e)}
                          disabled={assigning === t.id}
                          className="!px-3 !py-1.5 !text-xs whitespace-nowrap"
                        >
                          {assigning === t.id ? 'Taking...' : 'Take Over'}
                        </Button>
                      )}
                      <Link
                        to={`/tickets/${t.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-brand-lighter hover:text-brand transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
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
