import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { Card, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Input, Textarea, Label, FormGroup } from '../components/Input';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import type { ContractTemplate, ContractTemplateType } from '../services/api';
import * as api from '../services/api';

export default function ContractTemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [contractType, setContractType] = useState<ContractTemplateType>('pkwt');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loadPlaceholders = async () => {
      try {
        const data = await api.getContractTemplatePlaceholders();
        setPlaceholders(data);
      } catch {
        // ignore
      }
    };
    loadPlaceholders();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const load = async () => {
        setLoading(true);
        try {
          const t = await api.getContractTemplate(parseInt(id, 10));
          setName(t.name);
          setContractType(t.contract_type);
          setDescription(t.description ?? '');
          setContent(t.content);
          setIsActive(t.is_active);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Failed to load template');
          navigate('/contract-templates');
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [id, isEdit, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateContractTemplate(parseInt(id, 10), {
          name,
          contract_type: contractType,
          description: description || undefined,
          content,
          is_active: isActive,
        });
        toast.success('Template updated');
      } else {
        await api.createContractTemplate({
          name,
          contract_type: contractType,
          description: description || undefined,
          content,
          is_active: isActive,
        });
        toast.success('Template created');
      }
      navigate('/contract-templates');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!isEdit) {
      toast.error('Save the template first to preview');
      return;
    }
    try {
      // Generate sample values for preview
      const sampleValues: Record<string, string> = {
        contract_number: 'PKWT-2026-001',
        contract_date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        company_name: 'PT Example Company',
        company_address: 'Jl. Sudirman No. 123, Jakarta',
        company_representative: 'John Director',
        representative_position: 'Human Resources Director',
        full_name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '08123456789',
        id_number: '3201234567890001',
        address: 'Jl. Contoh No. 456, Bandung',
        place_of_birth: 'Jakarta',
        date_of_birth: '15 Januari 1990',
        gender: 'Female',
        religion: 'Islam',
        marital_status: 'Single',
        bank_name: 'BCA',
        bank_account_number: '1234567890',
        bank_account_holder: 'Jane Doe',
        npwp_number: '12.345.678.9-012.345',
        position: 'Software Engineer',
        start_date: '1 Februari 2026',
        end_date: '31 Januari 2027',
        salary: '15.000.000',
        work_location: 'Jakarta Office',
        other_terms: 'Subject to company policy and regulations.',
      };
      const html = await api.previewContractTemplate(parseInt(id, 10), sampleValues);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed');
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = content;
      const before = text.substring(0, start);
      const after = text.substring(end);
      setContent(`${before}{{${placeholder}}}${after}`);
      // Focus back to textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length + 4, start + placeholder.length + 4);
      }, 0);
    } else {
      setContent(content + `{{${placeholder}}}`);
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
    <div className="space-y-8">
      <PageHeader
        title={isEdit ? 'Edit Contract Template' : 'New Contract Template'}
        subtitle="Create reusable legal document templates with placeholders"
        actions={<ButtonLink to="/contract-templates" variant="outline">Back to List</ButtonLink>}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader title="Template Information" />
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup>
                <Label>Template Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., PKWT Standard 1 Year"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Contract Type *</Label>
                <Select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as ContractTemplateType)}
                  required
                >
                  <option value="pkwt">PKWT (Fixed-Term Employment)</option>
                  <option value="pkwtt">PKWTT (Permanent Employment)</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                  <option value="other">Other</option>
                </Select>
              </FormGroup>
            </div>
            <FormGroup>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this template"
              />
            </FormGroup>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300 text-brand focus:ring-brand"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Active (available for use in contracts)
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Template Content (HTML)" />
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Available Placeholders:</strong> Click to insert at cursor position
              </p>
              <div className="flex flex-wrap gap-2">
                {placeholders.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => insertPlaceholder(p)}
                    className="px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:bg-brand hover:text-white hover:border-brand transition-colors"
                  >
                    {`{{${p}}}`}
                  </button>
                ))}
              </div>
            </div>
            <FormGroup>
              <Textarea
                id="content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<!DOCTYPE html>
<html>
<head>
  <style>/* Your styles here */</style>
</head>
<body>
  <!-- Contract content with {{placeholders}} -->
</body>
</html>"
                rows={20}
                className="font-mono text-sm"
                required
              />
            </FormGroup>
            {isEdit && (
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={handlePreview}>
                  Preview with Sample Data
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <ButtonLink to="/contract-templates" variant="outline">
            Cancel
          </ButtonLink>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && previewHtml && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Template Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full min-h-[600px]"
                  title="Contract Preview"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 px-6 py-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.write(previewHtml);
                    win.document.close();
                  }
                }}
              >
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
