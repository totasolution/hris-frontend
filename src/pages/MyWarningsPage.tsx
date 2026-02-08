import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function MyWarningsPage() {
  const [list, setList] = useState<api.WarningLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyWarnings()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load warnings'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Warnings"
        subtitle="Review issued warning letters and notices"
      />

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
                <TH>Warning Type</TH>
                <TH>Issued Date</TH>
                <TH>Description</TH>
              </TR>
            </THead>
            <TBody>
              {list.length === 0 ? (
                <TR>
                  <TD colSpan={3} className="py-12 text-center text-slate-400">
                    You have no warning letters.
                  </TD>
                </TR>
              ) : (
                list.map((w) => (
                  <TR key={w.id}>
                    <TD>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        w.type === 'SP3' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {w.type}
                      </span>
                    </TD>
                    <TD>{w.warning_date ? formatDate(w.warning_date) : '—'}</TD>
                    <TD className="max-w-md whitespace-normal text-slate-500">{w.description ?? '—'}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
