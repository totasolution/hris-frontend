import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import * as api from '../services/api';

export default function WarningFormPage() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('SP1');
  const [warningDate, setWarningDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [companyPolicyFile, setCompanyPolicyFile] = useState<File | null>(null);
  const [additionalRefFile, setAdditionalRefFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<api.Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getEmployees({ per_page: 1000 }).then((r) => setEmployees(r.data)).catch(() => {});
  }, []);

  const MAX_FILE_MB = 5;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (companyPolicyFile && companyPolicyFile.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Company Policy Reference must be ${MAX_FILE_MB}MB or less`);
      return;
    }
    if (additionalRefFile && additionalRefFile.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Additional Reference must be ${MAX_FILE_MB}MB or less`);
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('employee_id', employeeId);
      formData.set('type', type);
      formData.set('warning_date', warningDate);
      formData.set('duration_months', durationMonths);
      formData.set('description', description.trim());
      if (companyPolicyFile) formData.set('company_policy', companyPolicyFile);
      if (additionalRefFile) formData.set('additional_reference', additionalRefFile);
      await api.createWarningWithFiles(formData);
      navigate('/warnings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Issue Warning Letter"
        subtitle="Document performance or conduct issues"
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
                label="Employee"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={String(e.id)}>{e.full_name}</option>
                ))}
              </Select>
              <Select
                label="Warning Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="SP1">SP1 (First Warning)</option>
                <option value="SP2">SP2 (Second Warning)</option>
                <option value="SP3">SP3 (Final Warning)</option>
              </Select>
              <Input
                label="Warning Date"
                type="date"
                value={warningDate}
                onChange={(e) => setWarningDate(e.target.value)}
                required
              />
              <Select
                label="Duration (months)"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                required
              >
                <option value="">Select duration</option>
                <option value="1">1 month</option>
                <option value="2">2 months</option>
                <option value="3">3 months</option>
                <option value="4">4 months</option>
                <option value="5">5 months</option>
                <option value="6">6 months</option>
              </Select>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <Textarea
                label="Description / Incident Details"
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder="Provide a detailed description of the incident or reason for the warning..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Company Policy Reference (optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  onChange={(e) => setCompanyPolicyFile(e.target.files?.[0] ?? null)}
                />
                {companyPolicyFile && (
                  <p className="text-xs text-slate-600 truncate" title={companyPolicyFile.name}>
                    {companyPolicyFile.name}
                  </p>
                )}
                <p className="text-xs text-slate-500">PDF, Word, or image. Max 5MB.</p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Additional Reference (optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  onChange={(e) => setAdditionalRefFile(e.target.files?.[0] ?? null)}
                />
                {additionalRefFile && (
                  <p className="text-xs text-slate-600 truncate" title={additionalRefFile.name}>
                    {additionalRefFile.name}
                  </p>
                )}
                <p className="text-xs text-slate-500">PDF, Word, or image. Max 5MB.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting} variant="danger">
                {submitting ? 'Issuing...' : 'Issue Warning Letter'}
              </Button>
              <Link
                to="/warnings"
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
