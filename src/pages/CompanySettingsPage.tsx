import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Input, Textarea, Label, FormGroup } from '../components/Input';
import { useToast } from '../components/Toast';
import * as api from '../services/api';

export default function CompanySettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeTitle, setRepresentativeTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const info = await api.getTenantCompanyInfo();
        setCompanyName(info.company_name || '');
        setCompanyAddress(info.company_address || '');
        setRepresentativeName(info.company_representative_name || '');
        setRepresentativeTitle(info.company_representative_title || '');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load company info');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateTenantCompanyInfo({
        company_name: companyName || undefined,
        company_address: companyAddress || undefined,
        company_representative_name: representativeName || undefined,
        company_representative_title: representativeTitle || undefined,
      });
      toast.success('Company information updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
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
        title="Company Information"
        subtitle="Manage your company details for use in contracts and documents"
      />

      <Card>
        <CardHeader title="Company Details" />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormGroup>
              <Label>Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="PT Example Company"
              />
              <p className="text-xs text-slate-400 mt-1">
                This name will appear in contract documents as the employer/company name
              </p>
            </FormGroup>

            <FormGroup>
              <Label>Company Address</Label>
              <Textarea
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10220"
                rows={3}
              />
              <p className="text-xs text-slate-400 mt-1">
                Full company address for legal documents
              </p>
            </FormGroup>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup>
                <Label>Representative Name</Label>
                <Input
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder="John Director"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Name of the person representing the company
                </p>
              </FormGroup>

              <FormGroup>
                <Label>Representative Title</Label>
                <Input
                  value={representativeTitle}
                  onChange={(e) => setRepresentativeTitle(e.target.value)}
                  placeholder="Human Resources Director"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Job title/position of the representative
                </p>
              </FormGroup>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Company Information'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="bg-blue-50 border-blue-100">
        <CardBody>
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How this information is used</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Company name and address appear in contract templates as <code className="bg-blue-100 px-1 rounded">{"{{company_name}}"}</code> and <code className="bg-blue-100 px-1 rounded">{"{{company_address}}"}</code></li>
            <li>Representative name and title appear as <code className="bg-blue-100 px-1 rounded">{"{{company_representative}}"}</code> and <code className="bg-blue-100 px-1 rounded">{"{{representative_position}}"}</code></li>
            <li>This information is automatically filled in when generating contract documents</li>
            <li>Update this information whenever your company details change</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
