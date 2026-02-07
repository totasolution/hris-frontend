import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { WarningLetter } from '../services/api';
import * as api from '../services/api';

export default function WarningsPage() {
  const [list, setList] = useState<WarningLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [employees, setEmployees] = useState<api.Employee[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getWarnings({
        employee_id: employeeId ? parseInt(employeeId, 10) : undefined,
        search: search.trim() || undefined,
        page,
        per_page: perPage,
      });
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load warnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [employeeId, search, page]);

  useEffect(() => {
    api.getEmployees({ per_page: 1000 }).then((r) => setEmployees(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Warning Letters"
        subtitle="Track employee performance and conduct"
        actions={<ButtonLink to="/warnings/new">New Warning</ButtonLink>}
      />

      <div className="flex gap-4 items-center flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-64">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="w-64">
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={String(e.id)}>{e.full_name}</option>
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
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH>
                <TH>Type</TH>
                <TH>Date</TH>
                <TH>Description</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    No warnings found.
                  </TD>
                </TR>
              ) : (
                list.map((w) => (
                  <TR key={w.id}>
                    <TD className="font-bold text-[#0f172a]">
                      {employees.find(e => e.id === w.employee_id)?.full_name ?? `ID: ${w.employee_id}`}
                    </TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        w.type === 'SP3' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {w.type}
                      </span>
                    </TD>
                    <TD>{w.warning_date ? new Date(w.warning_date).toLocaleDateString() : '—'}</TD>
                    <TD className="max-w-xs truncate">{w.description ?? '—'}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}
