import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { Input, Label, FormGroup } from '../components/Input';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const PENDING_HRD_RETURN = '/onboarding/pending-hrd';

export default function PendingHRDContractCreatePage() {
  const { permissions = [] } = useAuth();
  const canApprove = permissions.includes('rc:approve');
  const [searchParams] = useSearchParams();
  const candidateIdParam = searchParams.get('candidate_id');
  const candidateIdNum = candidateIdParam ? parseInt(candidateIdParam, 10) : null;

  const navigate = useNavigate();
  const toast = useToast();
  const [candidateId, setCandidateId] = useState<string>(candidateIdParam ?? '');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [status, setStatus] = useState('draft');
  const [candidate, setCandidate] = useState<api.Candidate | null>(null);
  const [loading, setLoading] = useState(!!candidateIdParam);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateIdParam || !candidateIdNum) {
      setLoading(false);
      return;
    }
    setCandidateId(candidateIdParam);
    api
      .getCandidate(candidateIdNum)
      .then((c) => setCandidate(c))
      .catch(() => setError('Failed to load candidate'))
      .finally(() => setLoading(false));
  }, [candidateIdParam, candidateIdNum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cid = candidateId ? parseInt(candidateId, 10) : undefined;
    if (!cid) {
      toast.error('Candidate is required');
      return;
    }

    if (!candidate?.employment_type) {
      toast.error('Candidate must have employment type (PKWT or Mitra) set');
      return;
    }

    setSubmitting(true);
    try {
      await api.approveCandidate(cid, {
        contract_number: contractNumber.trim() || undefined,
        status: status || undefined,
      });
      toast.success('Contract created and request approved');
      navigate(PENDING_HRD_RETURN, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canApprove) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card>
          <CardBody className="py-12 text-center space-y-4">
            <p className="text-slate-600 font-medium">You do not have permission to approve contract requests.</p>
            <ButtonLink to={PENDING_HRD_RETURN}>Back to Request Contract</ButtonLink>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!candidateIdParam) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <PageHeader title="Create Contract" subtitle="Approve request by creating contract" />
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm text-amber-800">Missing candidate. Please go back and approve from the Request Contract list.</p>
          <Link to={PENDING_HRD_RETURN} className="inline-block mt-3 text-sm font-bold text-brand hover:underline">
            ← Back to Request Contract
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Create Contract"
        subtitle={
          candidate
            ? `Create contract for ${candidate.full_name} — the request will be approved after you save`
            : 'Approve request by creating the contract'
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader title="Contract Details" />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormGroup>
              <Label>Contract number <span className="text-red-500">*</span></Label>
              <Input
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="e.g., PKWT-2026-001"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Related candidate</Label>
              <Input
                value={candidate ? `${candidate.full_name} (${candidate.email})` : candidateId ? `Candidate #${candidateId}` : '—'}
                readOnly
                disabled
                className="bg-slate-50 cursor-not-allowed"
              />
            </FormGroup>
            <FormGroup>
              <Label>Contract status</Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="sent_for_signature">Sent for Signature</option>
                <option value="signed">Signed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormGroup>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
              {candidateIdNum && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/candidates/${candidateIdNum}`)}
                >
                  Preview Candidate
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting || !candidate?.employment_type || !contractNumber.trim()}
              >
                {submitting ? 'Saving...' : 'Approve'}
              </Button>
              <Link
                to={PENDING_HRD_RETURN}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
