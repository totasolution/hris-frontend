import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import * as api from '../services/api';

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const defaultClientId = searchParams.get('client_id') ?? '';
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(defaultClientId);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [clients, setClients] = useState<api.Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const clientList = await api.getClients();
        setClients(clientList);
        if (!defaultClientId && clientList.length > 0 && !isEdit) {
          setClientId(String(clientList[0].id));
        } else if (defaultClientId) {
          setClientId(defaultClientId);
        }
        if (isEdit && id) {
          const p = await api.getProject(parseInt(id, 10));
          setName(p.name);
          setClientId(String(p.client_id));
          setDescription(p.description ?? '');
          setStartDate(p.start_date?.slice(0, 10) ?? '');
          setEndDate(p.end_date?.slice(0, 10) ?? '');
          setStatus(p.status ?? 'active');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, defaultClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        client_id: parseInt(clientId, 10),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status,
      };
      if (isEdit && id) {
        await api.updateProject(parseInt(id, 10), body);
      } else {
        await api.createProject(body);
      }
      navigate('/projects');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={isEdit ? 'Edit Project' : 'New Project'}
        subtitle={isEdit ? `Updating ${name}` : 'Create a new project for a client'}
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
                label="Client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Input
                label="Project Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Frontend Development"
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="closed">Closed</option>
              </Select>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <Textarea
                label="Description"
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                rows={3}
                placeholder="Project scope and details..."
              />
            </div>

            <div className="pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
              </Button>
              <Link
                to="/projects"
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
