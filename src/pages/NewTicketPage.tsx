import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import * as api from '../services/api';

/** Safe internal path for redirect (starts with /, no protocol or external link). */
function getReturnPath(search: string): string | null {
  const returnTo = new URLSearchParams(search).get('return');
  if (!returnTo || !returnTo.startsWith('/') || returnTo.includes('://') || returnTo.startsWith('//')) {
    return null;
  }
  return returnTo;
}

export default function NewTicketPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getReturnPath(location.search);
  const [departmentId, setDepartmentId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [departments, setDepartments] = useState<api.Department[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createTicket({
        department_id: parseInt(departmentId, 10),
        subject: subject.trim(),
        message: message.trim(),
      });
      navigate(returnTo ?? '/tickets', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Create Support Ticket"
        subtitle="Submit a question or issue to a department"
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Target Department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>{d.name}</option>
                ))}
              </Select>
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief summary of the issue"
              />
            </div>

            <div className="pt-6 border-t border-slate-50">
              <Textarea
                label="Detailed Message"
                value={message}
                onChange={(e: any) => setMessage(e.target.value)}
                rows={6}
                required
                placeholder="Describe your issue in detail..."
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
              <Link
                to={returnTo ?? '/tickets'}
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
