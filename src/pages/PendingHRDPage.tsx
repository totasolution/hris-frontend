import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { ConfirmModal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import * as api from '../services/api';

export default function PendingHRDPage() {
  const [list, setList] = useState<api.OnboardingFormData[]>([]);
  const [candidates, setCandidates] = useState<Record<number, api.Candidate>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPendingHRDList();
      setList(data);
      const candMap: Record<number, api.Candidate> = {};
      for (const d of data) {
        try {
          const c = await api.getCandidate(d.candidate_id);
          candMap[c.id] = c;
        } catch {
          // skip
        }
      }
      setCandidates(candMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async () => {
    if (!approvingId) return;
    setApproveLoading(true);
    try {
      await api.approveCandidate(approvingId);
      toast.success('Onboarding submission approved');
      setApprovingId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async (candidateId: number) => {
    if (!rejectComment.trim()) {
      toast.warning('Please provide a reason for rejection');
      return;
    }
    try {
      await api.rejectCandidate(candidateId, rejectComment);
      toast.success('Onboarding submission rejected');
      setRejectingId(null);
      setRejectComment('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reject failed');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pending Approvals"
        subtitle="Review and approve onboarding submissions"
      />

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
                <TH>Candidate</TH>
                <TH>Submitted At</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={3} className="py-12 text-center">
                    <p className="text-slate-400">No candidates pending HRD approval.</p>
                    <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto">
                      Candidates with status &quot;Contract requested&quot; who are not listed here have already been approved by HRD and are no longer pending.
                    </p>
                  </TD>
                </TR>
              ) : (
                list.map((d) => {
                  const c = candidates[d.candidate_id];
                  return (
                    <TR key={d.id}>
                      <TD>
                        <div className="flex flex-col">
                          <Link to={`/candidates/${d.candidate_id}`} className="font-bold text-[#0f172a] hover:text-brand transition-colors">
                            {c?.full_name ?? `Candidate #${d.candidate_id}`}
                          </Link>
                          <span className="text-xs text-slate-400">{c?.email}</span>
                        </div>
                      </TD>
                      <TD>
                        {d.submitted_for_hrd_at ? new Date(d.submitted_for_hrd_at).toLocaleString() : '—'}
                      </TD>
                      <TD className="text-right">
                        {rejectingId === d.candidate_id ? (
                          <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right-2 duration-200">
                            <Input
                              placeholder="Reason for rejection..."
                              value={rejectComment}
                              onChange={(e) => setRejectComment(e.target.value)}
                              className="w-64"
                            />
                            <div className="flex gap-2">
                              <Button onClick={() => handleReject(d.candidate_id)} variant="danger" className="!px-3 !py-1.5 !text-xs">
                                Confirm Reject
                              </Button>
                              <Button onClick={() => setRejectingId(null)} variant="secondary" className="!px-3 !py-1.5 !text-xs">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <Button onClick={() => setApprovingId(d.candidate_id)} className="!px-4 !py-2 !text-xs">
                              Approve
                            </Button>
                            <Button onClick={() => setRejectingId(d.candidate_id)} variant="ghost" className="!px-4 !py-2 !text-xs !text-red-500 hover:!bg-red-50">
                              Reject
                            </Button>
                          </div>
                        )}
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </Card>
      )}

      <ConfirmModal
        isOpen={!!approvingId}
        onClose={() => setApprovingId(null)}
        onConfirm={handleApprove}
        title="Approve Onboarding"
        confirmText="Yes, Approve"
        isLoading={approveLoading}
      >
        <p>Are you sure you want to approve the onboarding submission for <span className="font-bold text-brand-dark">{approvingId ? (candidates[approvingId]?.full_name ?? `Candidate #${approvingId}`) : ''}</span>?</p>
        <p className="mt-2 text-sm">Once approved, the candidate will be ready for contract generation.</p>
      </ConfirmModal>
    </div>
  );
}
