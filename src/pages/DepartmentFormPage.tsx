import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import * as api from '../services/api';

export default function DepartmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [departments, setDepartments] = useState<api.Department[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.getDepartments();
        setDepartments(list);
        if (isEdit && id) {
          const d = await api.getDepartment(parseInt(id, 10));
          setName(d.name);
          setCode(d.code ?? '');
          setParentId(d.parent_id != null ? String(d.parent_id) : '');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        code: code.trim() || undefined,
        parent_id: parentId ? parseInt(parentId, 10) : undefined,
      };
      if (isEdit && id) {
        await api.updateDepartment(parseInt(id, 10), body);
      } else {
        await api.createDepartment(body);
      }
      navigate('/departments');
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
        title={isEdit ? 'Edit Department' : 'New Department'}
        subtitle={isEdit ? `Updating ${name}` : 'Create a new organizational unit'}
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
              <Input
                label="Department Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Human Resources"
              />
              <Input
                label="Department Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. HR"
              />
              <Select
                label="Parent Department"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">No Parent (Top Level)</option>
                {departments
                  .filter((d) => !isEdit || d.id !== parseInt(id!, 10))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </Select>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Department' : 'Create Department'}
              </Button>
              <Link
                to="/departments"
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
