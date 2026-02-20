import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import type { Employee } from '../services/api';
import * as api from '../services/api';

export default function PaklaringCreatePage() {
  const { t } = useTranslation(['pages', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('employeeId');
  const { permissions = [] } = useAuth();
  const canCreate = permissions.includes('paklaring:create');
  const toast = useToast();

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState<Employee[]>([]);
  const [employeeSearching, setEmployeeSearching] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [lastWorkingDate, setLastWorkingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchEmployees = useCallback(async (term: string) => {
    if (!term.trim()) {
      setEmployeeSearchResults([]);
      return;
    }
    setEmployeeSearching(true);
    try {
      const r = await api.getEmployees({ search: term.trim(), per_page: 20 });
      setEmployeeSearchResults(r.data);
    } catch {
      setEmployeeSearchResults([]);
    } finally {
      setEmployeeSearching(false);
    }
  }, []);

  const employeeSearchDebounced = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout>;
    return (term: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => searchEmployees(term), 300);
    };
  }, [searchEmployees]);

  useEffect(() => {
    if (employeeSearch.trim()) employeeSearchDebounced(employeeSearch);
    else setEmployeeSearchResults([]);
  }, [employeeSearch, employeeSearchDebounced]);

  // Pre-select employee from query
  useEffect(() => {
    if (!preselectedId || selectedEmployee) return;
    const id = parseInt(preselectedId, 10);
    if (isNaN(id)) return;
    api.getEmployee(id).then((emp) => setSelectedEmployee(emp)).catch(() => {});
  }, [preselectedId]);

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEmployeeSearch(emp.full_name);
    setEmployeeSearchResults([]);
  };

  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedEmployee) {
      setError(t('pages:paklaring.selectEmployee'));
      return;
    }
    if (!lastWorkingDate.trim()) {
      setError(t('pages:paklaring.lastWorkingDateRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await api.createPaklaringForEmployee(selectedEmployee.id, lastWorkingDate.trim());
      toast.success(t('pages:paklaring.paklaringGenerated'));
      navigate('/paklaring');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages:paklaring.uploadFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title={t('pages:paklaring.generateModalTitle')} />
        <Card>
          <CardBody>
            <p className="text-slate-600">You don&apos;t have permission to generate paklaring.</p>
            <Link to="/paklaring" className="text-brand font-medium mt-2 inline-block">
              ← {t('pages:paklaring.title')}
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeader
        title={t('pages:paklaring.generateModalTitle')}
        subtitle={t('pages:paklaring.createSubtitle')}
      />

      <Link to="/paklaring" className="text-sm font-medium text-brand hover:underline">
        ← {t('pages:paklaring.title')}
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              {t('pages:paklaring.employeeLabel')}
            </h3>
            {!selectedEmployee ? (
              <>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder={t('pages:paklaring.searchByNamePlaceholder')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  autoFocus
                />
                {employeeSearching && (
                  <p className="text-sm text-slate-500">{t('pages:paklaring.searching')}</p>
                )}
                {!employeeSearching && employeeSearch.trim() && (
                  <ul className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {employeeSearchResults.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-slate-500">{t('pages:paklaring.noEmployeesFound')}</li>
                    ) : (
                      employeeSearchResults.map((e) => (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectEmployee(e)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 text-slate-700"
                          >
                            <span className="font-medium">{e.full_name}</span>
                            {e.email && <span className="text-slate-500 ml-2">({e.email})</span>}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-800">{selectedEmployee.full_name}</p>
                    {selectedEmployee.email && (
                      <p className="text-sm text-slate-600">{selectedEmployee.email}</p>
                    )}
                    {selectedEmployee.employee_number && (
                      <p className="text-xs text-slate-500">NIP: {selectedEmployee.employee_number}</p>
                    )}
                    {(selectedEmployee.position || selectedEmployee.placement_location) && (
                      <p className="text-sm text-slate-600 mt-1">
                        {[selectedEmployee.position, selectedEmployee.placement_location].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={handleClearEmployee}>
                    Change
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {selectedEmployee && (
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {t('pages:paklaring.lastWorkingDate')}
              </h3>
              <Input
                type="date"
                value={lastWorkingDate}
                onChange={(e) => setLastWorkingDate(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                {t('pages:paklaring.lastWorkingDateHelp')}
              </p>
            </CardBody>
          </Card>
        )}

        {selectedEmployee && (
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/paklaring')}>
              {t('common:cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('pages:paklaring.generating') : t('pages:paklaring.generate')}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
