import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import type { Employee } from '../services/api';
import * as api from '../services/api';

export default function EmployeesPage() {
  const { permissions = [] } = useAuth();
  const canEditEmployee = permissions.includes('employee:update');
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEmployees({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page,
        per_page: perPage,
      });
      setList(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, search, page]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce directory"
        actions={
          permissions.includes('employee:create') ? (
            <ButtonLink to="/employees/new">Add Employee</ButtonLink>
          ) : undefined
        }
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="terminated">Terminated</option>
            <option value="resigned">Resigned</option>
            <option value="contract_ended">Contract Ended</option>
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
                <TH>Full Name</TH>
                <TH>Email Address</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-12 text-center text-slate-400">
                    No employees found.
                  </TD>
                </TR>
              ) : (
                list.map((e) => (
                  <TR key={e.id}>
                    <TD className="font-bold text-[#0f172a]">
                      <Link to={`/employees/${e.id}`} className="hover:text-brand transition-colors">
                        {e.full_name}
                      </Link>
                    </TD>
                    <TD>{e.email}</TD>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {e.status.replace('_', ' ')}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/employees/${e.id}`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors inline-block"
                          title="View Employee"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        {canEditEmployee && (
                          <Link
                            to={`/employees/${e.id}/edit`}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors inline-block"
                            title="Edit Employee"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </TD>
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
