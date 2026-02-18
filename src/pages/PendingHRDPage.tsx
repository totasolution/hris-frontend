import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

export default function PendingHRDPage() {
  const navigate = useNavigate();
  const { permissions = [] } = useAuth();
  const canView = permissions.includes('rc:view') || permissions.includes('rc:approve');
  const canApprove = permissions.includes('rc:approve');
  const [list, setList] = useState<api.OnboardingFormData[]>([]);
  const [candidates, setCandidates] = useState<Record<number, api.Candidate>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
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

  if (!canView) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-slate-600 font-medium">You do not have permission to view Request Contract.</p>
            <Link to="/dashboard" className="mt-4 inline-block text-sm font-bold text-brand hover:underline">
              Back to Dashboard
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const handleReject = async () => {
    if (!rejectingId || !rejectComment.trim()) {
      toast.warning('Please provide a reason for rejection');
      return;
    }
    setRejectLoading(true);
    try {
      await api.rejectCandidate(rejectingId, rejectComment);
      toast.success('Contract request rejected');
      setRejectingId(null);
      setRejectComment('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setRejectLoading(false);
    }
  };

  const closeRejectModal = () => {
    if (!rejectLoading) {
      setRejectingId(null);
      setRejectComment('');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Request Contract"
        subtitle="Review and approve contract requests"
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
                {canApprove && <TH className="text-right">Actions</TH>}
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={canApprove ? 3 : 2} className="py-12 text-center">
                    <p className="text-slate-400">No contract requests pending approval.</p>
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
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              to={`/candidates/${d.candidate_id}`}
                              className="font-bold text-[#0f172a] hover:text-brand transition-colors"
                            >
                              {c?.full_name ?? `Candidate #${d.candidate_id}`}
                            </Link>
                            {c?.employment_type && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                {c.employment_type === 'pkwt'
                                  ? 'PKWT'
                                  : c.employment_type === 'partnership'
                                  ? 'Mitra Kerja'
                                  : c.employment_type}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{c?.email}</span>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            {c?.client_name && (
                              <span>
                                <span className="font-semibold text-slate-600">Client:</span> {c.client_name}
                              </span>
                            )}
                            {c?.pic_name && (
                              <span>
                                <span className="font-semibold text-slate-600">PIC:</span> {c.pic_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </TD>
                      <TD>
                        {d.submitted_for_hrd_at ? new Date(d.submitted_for_hrd_at).toLocaleString() : '—'}
                      </TD>
                      {canApprove && (
                        <TD className="text-right">
                          <div className="flex justify-end gap-3">
                            <Button
                              onClick={() => navigate(`/onboarding/pending-hrd/create-contract?candidate_id=${d.candidate_id}`)}
                              className="!px-4 !py-2 !text-xs"
                            >
                              Approve
                            </Button>
                            <Button onClick={() => setRejectingId(d.candidate_id)} variant="ghost" className="!px-4 !py-2 !text-xs !text-red-500 hover:!bg-red-50">
                              Reject
                            </Button>
                          </div>
                        </TD>
                      )}
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </Card>
      )}

      <Modal
        isOpen={!!rejectingId}
        onClose={closeRejectModal}
        title="Reject Contract Request"
        variant="danger"
        footer={
          <>
            <Button variant="secondary" onClick={closeRejectModal} disabled={rejectLoading} className="!px-6 !py-3">
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectComment.trim() || rejectLoading}
              className="!px-6 !py-3"
            >
              {rejectLoading ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </>
        }
      >
        <p className="mb-4">
          You are about to reject the contract request for <span className="font-bold text-brand-dark">{rejectingId ? (candidates[rejectingId]?.full_name ?? `Candidate #${rejectingId}`) : ''}</span>. Please provide a reason (required).
        </p>
        <Textarea
          label="Reason for rejection"
          placeholder="e.g. Missing documents, information incomplete..."
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          className="w-full min-h-[120px] resize-y"
          rows={5}
          required
        />
      </Modal>
    </div>
  );
}
