import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import * as api from '../services/api';

export default function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await api.getRole(parseInt(id, 10));
        setName(r.name);
        setSlug(r.slug);
        setDescription(r.description ?? '');
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
      const body = { name: name.trim(), slug: slug.trim() || undefined, description: description.trim() || undefined };
      if (isEdit && id) {
        await api.updateRole(parseInt(id, 10), body);
      } else {
        await api.createRole(body);
      }
      navigate('/roles');
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
        title={isEdit ? 'Edit Role' : 'New Role'}
        subtitle={isEdit ? `Updating ${name}` : 'Create a new access role'}
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
                label="Role Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Recruiter"
              />
              <div className="space-y-1.5">
                <Input
                  label="Slug (optional)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. recruiter"
                  className="font-mono"
                />
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Lowercase, numbers, underscores only
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <Textarea
                label="Description"
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                rows={3}
                placeholder="What this role can do..."
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Role' : 'Create Role'}
              </Button>
              <Link
                to="/roles"
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
