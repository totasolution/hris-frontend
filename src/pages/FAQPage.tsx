import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { useAuth } from '../contexts/AuthContext';
import type { FAQ, FAQCategory } from '../services/api';
import * as api from '../services/api';

export default function FAQPage() {
  const { roles = [] } = useAuth();
  const canManage = roles.some((r) => ['super_admin', 'tenant_admin', 'hrd'].includes(r));
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, list] = await Promise.all([
        api.getFAQCategories(),
        categoryId
          ? api.getFAQs(parseInt(categoryId, 10))
          : api.getFAQs(),
      ]);
      setCategories(cats);
      setFaqs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load FAQ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [categoryId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQ.trim()) {
      load();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await api.searchFAQ(searchQ.trim());
      setFaqs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-[300px]">
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search for answers..."
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <div className="w-64">
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>

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
      ) : faqs.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          No FAQs found matching your search.
        </Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <Card
              key={f.id}
              className={`overflow-hidden transition-all duration-200 ${
                expandedId === f.id ? 'ring-2 ring-brand/20 border-brand/20' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                className="w-full px-8 py-5 text-left flex justify-between items-center group"
              >
                <span className={`font-bold transition-colors ${
                  expandedId === f.id ? 'text-brand' : 'text-[#0f172a] group-hover:text-brand'
                }`}>
                  {f.question}
                </span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                  expandedId === f.id ? 'bg-brand text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-brand-light group-hover:text-brand'
                }`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {expandedId === f.id && (
                <div className="px-8 pb-6 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="pt-4 border-t border-slate-50">
                    {f.answer}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
