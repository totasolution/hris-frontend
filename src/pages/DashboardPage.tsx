import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { TenantAdminWidgets } from '../components/dashboard/TenantAdminWidgets';
import { HRDWidgets } from '../components/dashboard/HRDWidgets';
import { NewTicketsWidget } from '../components/dashboard/NewTicketsWidget';
import { IncomingRequestContractWidget } from '../components/dashboard/IncomingRequestContractWidget';
import { RecruiterWidgets } from '../components/dashboard/RecruiterWidgets';
import { InternalEmployeeWidgets } from '../components/dashboard/InternalEmployeeWidgets';
import { ExternalEmployeeWidgets } from '../components/dashboard/ExternalEmployeeWidgets';
import * as api from '../services/api';

/** Dashboard section visibility is driven by permissions defined in permission settings (Roles > Permissions). */
const DASHBOARD_ADMIN = 'dashboard:admin';
const DASHBOARD_RECRUITMENT = 'dashboard:recruitment';
const DASHBOARD_EMPLOYEE = 'dashboard:employee';
const DASHBOARD_TICKET = 'dashboard:ticket';
const DASHBOARD_REQUEST_CONTRACT = 'dashboard:requestContract';

export default function DashboardPage() {
  const { t } = useTranslation('pages');
  const { user, permissions = [] } = useAuth();
  const [employeeType, setEmployeeType] = useState<'internal' | 'external' | null>(null);
  const [loadingEmployeeSection, setLoadingEmployeeSection] = useState(false);

  const hasAdminSection = permissions.includes(DASHBOARD_ADMIN);
  const hasRecruitmentSection = permissions.includes(DASHBOARD_RECRUITMENT);
  const hasEmployeeSection = permissions.includes(DASHBOARD_EMPLOYEE);
  const hasTicketWidget = permissions.includes(DASHBOARD_TICKET);
  const hasRequestContractWidget = permissions.includes(DASHBOARD_REQUEST_CONTRACT);

  // For employee section we need employee type (internal vs external) to show the right view
  useEffect(() => {
    if (!hasEmployeeSection) {
      setLoadingEmployeeSection(false);
      return;
    }
    setLoadingEmployeeSection(true);
    api
      .getMyEmployee()
      .then((emp) => {
        if (emp) {
          setEmployeeType(emp.employee_type === 'internal' ? 'internal' : 'external');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEmployeeSection(false));
  }, [hasEmployeeSection]);

  const hasAnySection = hasAdminSection || hasRecruitmentSection || hasEmployeeSection || hasTicketWidget || hasRequestContractWidget;

  if (!hasAnySection) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-10 font-body">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-400">{t('dashboard.noPermission')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 font-body">
      {/* New tickets & Incoming request contract — visible when user has dashboard:ticket and/or dashboard:requestContract */}
      {(hasTicketWidget || hasRequestContractWidget) && (
        <section aria-label="Dashboard - Notifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {hasTicketWidget && <NewTicketsWidget permissions={permissions} />}
            {hasRequestContractWidget && <IncomingRequestContractWidget permissions={permissions} />}
          </div>
        </section>
      )}

      {/* Admin/HR section — visible if user has dashboard:admin (permission setting) */}
      {hasAdminSection && (
        <section aria-label="Dashboard - Admin/HR">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {t('dashboard.adminSection')}
            </span>
          </div>
          <div className="space-y-8">
            <TenantAdminWidgets permissions={permissions} />
            <HRDWidgets permissions={permissions} />
          </div>
        </section>
      )}

      {/* Recruitment section — visible if user has dashboard:recruitment (permission setting) */}
      {hasRecruitmentSection && (
        <section aria-label="Dashboard - Recruitment">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {t('dashboard.recruitmentSection')}
            </span>
          </div>
          <RecruiterWidgets permissions={permissions} />
        </section>
      )}

      {/* Employee/self-service section — visible if user has dashboard:employee (permission setting) */}
      {hasEmployeeSection && (
        <section aria-label="Dashboard - Employee">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {t('dashboard.employeeSection')}
            </span>
          </div>
          {loadingEmployeeSection ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-slate-400">{t('dashboard.loading')}</p>
            </div>
          ) : employeeType === 'internal' ? (
            <InternalEmployeeWidgets permissions={permissions} userId={user?.id} />
          ) : employeeType === 'external' ? (
            <ExternalEmployeeWidgets permissions={permissions} userId={user?.id} />
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-8 text-center">
              <p className="text-slate-500">
                {t('dashboard.noEmployeeRecord')}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
