import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../Card';
import type { OnboardingFormData } from '../../services/api';
import * as api from '../../services/api';

type IncomingRequestContractWidgetProps = {
  permissions: string[];
};

export function IncomingRequestContractWidget({ permissions }: IncomingRequestContractWidgetProps) {
  const [pending, setPending] = useState<OnboardingFormData[]>([]);
  const [loading, setLoading] = useState(true);

  const canSee = permissions.includes('dashboard:requestContract');

  useEffect(() => {
    if (!canSee) {
      setLoading(false);
      return;
    }
    api
      .getPendingHRDList()
      .then(setPending)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [canSee]);

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
          <div className="space-y-2">
            {pending.slice(0, 10).map((item) => (
              <Link
                key={item.id}
                to={`/candidates/${item.candidate_id}`}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-dark truncate">
                    {item.candidate_name ?? `Candidate #${item.candidate_id}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    #{item.candidate_id} • Requested for contract
                  </p>
                </div>
                <span className="text-slate-300 group-hover:text-brand transition-colors">→</span>
              </Link>
            ))}
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
