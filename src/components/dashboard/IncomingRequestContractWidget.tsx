import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../Card';
import { Button } from '../Button';
import type { OnboardingFormData } from '../../services/api';
import * as api from '../../services/api';
import { formatDate } from '../../utils/formatDate';

type IncomingRequestContractWidgetProps = {
  permissions: string[];
};

export function IncomingRequestContractWidget({ permissions }: IncomingRequestContractWidgetProps) {
  const [pending, setPending] = useState<OnboardingFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const canSee = permissions.includes('dashboard:requestContract');

  const loadPending = () => {
    if (!canSee) {
      setLoading(false);
      return;
    }
    api
      .getPendingHRDList()
      .then(setPending)
      .catch(() => [])
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPending();
  }, [canSee]);

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
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

  const isUrgent = (dateString: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours > 48; // Urgent if older than 48 hours
  };

  const handleReview = (candidateId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/candidates/${candidateId}`);
  };

  if (!canSee) return null;

  return (
    <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
      <CardHeader>
        <h3 className="text-lg font-bold text-brand-dark font-headline">Incoming Request Contract</h3>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
          Pending HRD approvals
        </p>
      </CardHeader>
      <CardBody className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 10).map((item) => {
              const urgent = isUrgent(item.submitted_for_hrd_at ?? null);
              
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    urgent
                      ? 'bg-amber-50 border-amber-100 hover:bg-amber-100'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/candidates/${item.candidate_id}`}
                          className="text-sm font-bold text-brand-dark hover:text-brand transition-colors truncate"
                        >
                          {item.candidate_name ?? `Candidate #${item.candidate_id}`}
                        </Link>
                        {urgent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-700">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                        <span>#{item.candidate_id}</span>
                        <span>•</span>
                        <span>Contract Request</span>
                        {item.submitted_for_hrd_at && (
                          <>
                            <span>•</span>
                            <span>{getTimeAgo(item.submitted_for_hrd_at)}</span>
                            <span>•</span>
                            <span>{formatDate(item.submitted_for_hrd_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="primary"
                        onClick={(e) => handleReview(item.candidate_id, e)}
                        className="!px-3 !py-1.5 !text-xs whitespace-nowrap"
                      >
                        Review
                      </Button>
                      <Link
                        to={`/candidates/${item.candidate_id}`}
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
      {pending.length > 0 && (
        <div className="p-6 mt-auto border-t border-slate-50">
          <Link
            to="/onboarding/pending-hrd"
            className="flex items-center justify-center w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-brand-lighter hover:text-brand transition-all"
          >
            View all pending HRD
          </Link>
        </div>
      )}
    </Card>
  );
}
