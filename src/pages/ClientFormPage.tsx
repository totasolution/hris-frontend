import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import * as api from '../services/api';

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<string>('active');
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
        const c = await api.getClient(parseInt(id, 10));
        setName(c.name);
        setContactName(c.contact_name ?? '');
        setContactEmail(c.contact_email ?? '');
        setContactPhone(c.contact_phone ?? '');
        setAddress(c.address ?? '');
        setStatus(c.status ?? 'active');
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
        contact_name: contactName.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        address: address.trim() || undefined,
        status,
      };
      if (isEdit && id) {
        await api.updateClient(parseInt(id, 10), body);
      } else {
        await api.createClient(body);
      }
      navigate('/clients');
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
        title={isEdit ? 'Edit Client' : 'New Client'}
        subtitle={isEdit ? `Updating ${name}` : 'Register a new client company'}
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
                label="Client Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter company name"
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Contact Person"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Full name"
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@client.com"
                />
                <Input
                  label="Contact Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+62..."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <Textarea
                label="Office Address"
                value={address}
                onChange={(e: any) => setAddress(e.target.value)}
                rows={3}
                placeholder="Full company address..."
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
              </Button>
              <Link
                to="/clients"
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
