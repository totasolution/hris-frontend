import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input, Textarea } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import type { FAQ, FAQCategory } from '../services/api';
import * as api from '../services/api';

export default function FAQFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== 'new' && id != null;
  const navigate = useNavigate();
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cats = await api.getFAQCategories();
        setCategories(cats);
        if (isEdit && id) {
          const faq = await api.getFAQ(parseInt(id, 10));
          setQuestion(faq.question);
          setAnswer(faq.answer);
          setSortOrder(faq.sort_order ?? 0);
          setCategoryId(faq.category_id != null ? String(faq.category_id) : '');
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
        category_id: categoryId ? parseInt(categoryId, 10) : undefined,
        question: question.trim(),
        answer: answer.trim(),
        sort_order: sortOrder,
      };
      if (isEdit && id) {
        await api.updateFAQ(parseInt(id, 10), body);
      } else {
        await api.createFAQ(body);
      }
      navigate('/faq/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
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
        title={isEdit ? 'Edit FAQ' : 'New FAQ'}
        subtitle={isEdit ? `Updating "${question.slice(0, 40)}${question.length > 40 ? '...' : ''}"` : 'Add a new frequently asked question'}
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
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Input
              label="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              placeholder="e.g. How do I request leave?"
            />

            <Textarea
              label="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              rows={5}
              placeholder="Provide a clear, helpful answer..."
            />

            <Input
              label="Sort Order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              min={0}
            />

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update FAQ' : 'Create FAQ'}
              </Button>
              <Link
                to="/faq/admin"
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
