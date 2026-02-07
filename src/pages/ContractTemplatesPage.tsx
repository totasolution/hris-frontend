import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink, Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Select } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { ContractTemplate, ContractTemplateType } from '../services/api';
import * as api from '../services/api';

const contractTypeLabels: Record<ContractTemplateType, string> = {
  pkwt: 'PKWT (Fixed-Term)',
  pkwtt: 'PKWTT (Permanent)',
  internship: 'Internship',
  freelance: 'Freelance',
  other: 'Other',
};

export default function ContractTemplatesPage() {
  const [list, setList] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeOnly, setActiveOnly] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { contract_type?: ContractTemplateType; active_only?: boolean } = {};
      if (typeFilter) params.contract_type = typeFilter as ContractTemplateType;
      if (activeOnly) params.active_only = true;
      const data = await api.getContractTemplates(params);
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [typeFilter, activeOnly]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.deleteContractTemplate(id);
      toast.success('Template deleted');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contract Templates"
        subtitle="Manage reusable contract templates with legal clauses"
        actions={<ButtonLink to="/contract-templates/new">New Template</ButtonLink>}
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="pkwt">PKWT (Fixed-Term)</option>
            <option value="pkwtt">PKWTT (Permanent)</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-slate-300 text-brand focus:ring-brand"
          />
          Active only
        </label>
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
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Description</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="py-12 text-center text-slate-400">
                    No templates found. Create your first contract template to get started.
                  </TD>
                </TR>
              ) : (
                list.map((t) => (
                  <TR key={t.id}>
                    <TD className="font-bold text-[#0f172a]">{t.name}</TD>
                    <TD>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {contractTypeLabels[t.contract_type]}
                      </span>
                    </TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TD>
                    <TD className="text-slate-500 max-w-xs truncate">
                      {t.description || '—'}
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/contract-templates/${t.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit Template"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete Template"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold text-lg text-slate-900 mb-3">About Contract Templates</h3>
        <div className="text-sm text-slate-600 space-y-2">
          <p>Contract templates allow you to create reusable legal document templates with placeholders that are automatically filled with candidate/employee information.</p>
          <p><strong>Available placeholders:</strong> Use double curly braces to insert placeholders, e.g., <code className="bg-slate-100 px-1 rounded">{'{{full_name}}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{{position}}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{{salary}}'}</code>.</p>
          <p>Common placeholders include: <code className="text-xs bg-slate-100 px-1 rounded">contract_number</code>, <code className="text-xs bg-slate-100 px-1 rounded">full_name</code>, <code className="text-xs bg-slate-100 px-1 rounded">id_number</code>, <code className="text-xs bg-slate-100 px-1 rounded">address</code>, <code className="text-xs bg-slate-100 px-1 rounded">position</code>, <code className="text-xs bg-slate-100 px-1 rounded">salary</code>, <code className="text-xs bg-slate-100 px-1 rounded">start_date</code>, <code className="text-xs bg-slate-100 px-1 rounded">end_date</code>, and more.</p>
        </div>
      </Card>
    </div>
  );
}
