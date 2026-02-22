import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import type { AnnouncementCreate, AnnouncementUpdate } from '../services/api';
import * as api from '../services/api';

const clientSelectStyles = {
  control: (base: any) => ({
    ...base,
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    padding: '2px',
    boxShadow: 'none',
    '&:hover': { border: '1px solid #107BC7' },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
    fontSize: '0.875rem',
    fontWeight: '500',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: '500',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#282828',
  }),
};

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function fromDatetimeLocal(s: string): string | null {
  if (!s || !s.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function AnnouncementFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== 'new' && id != null && id !== undefined;
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishedFrom, setPublishedFrom] = useState('');
  const [publishedUntil, setPublishedUntil] = useState('');
  const [clients, setClients] = useState<api.Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getClients().then(setClients).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const a = await api.getAnnouncement(parseInt(id, 10));
        setTitle(a.title);
        setBody(a.body);
        setClientId(a.client_id != null ? String(a.client_id) : '');
        setPublishedFrom(toDatetimeLocal(a.published_from ?? null));
        setPublishedUntil(toDatetimeLocal(a.published_until ?? null));
      } catch (e) {
        setError(e instanceof Error ? e.message : t('announcementForm.saveError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const base = {
        client_id: clientId ? Number(clientId) : undefined,
        title: title.trim(),
        body: body.trim(),
        published_from: fromDatetimeLocal(publishedFrom) ?? undefined,
        published_until: fromDatetimeLocal(publishedUntil) ?? undefined,
      };
      if (isEdit && id) {
        const payload: AnnouncementUpdate = { ...base };
        await api.updateAnnouncement(parseInt(id, 10), payload);
      } else {
        await api.createAnnouncement(base);
      }
      navigate('/announcements');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('announcementForm.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

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
        title={isEdit ? t('announcementForm.editTitle') : t('announcementForm.newTitle')}
        subtitle={isEdit ? t('announcementForm.editSubtitle') : t('announcementForm.newSubtitle')}
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
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('announcementForm.client')}
              </label>
              <Select
                options={[
                  { value: '', label: t('announcementForm.allClients') },
                  ...clients.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
                value={clientId ? { value: clientId, label: clients.find((c) => String(c.id) === clientId)?.name ?? clientId } : { value: '', label: t('announcementForm.allClients') }}
                onChange={(option: { value: string; label: string } | null) => setClientId(option?.value ?? '')}
                placeholder={t('announcementForm.allClients')}
                styles={clientSelectStyles}
                isSearchable
                isClearable
              />
            </div>

            <Input
              label={t('announcementForm.title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Announcement title"
            />

            <Textarea
              label={t('announcementForm.body')}
              value={body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              required
              rows={6}
              placeholder="Announcement content..."
            />

            <Input
              label={t('announcementForm.publishedFrom')}
              type="datetime-local"
              value={publishedFrom}
              onChange={(e) => setPublishedFrom(e.target.value)}
            />

            <Input
              label={t('announcementForm.publishedUntil')}
              type="datetime-local"
              value={publishedUntil}
              onChange={(e) => setPublishedUntil(e.target.value)}
            />

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? '...' : t('announcementForm.save')}
              </Button>
              <Link
                to="/announcements"
                className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                {t('announcementForm.cancel')}
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
