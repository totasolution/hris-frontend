import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { NewTicketsWidget } from '../components/dashboard/NewTicketsWidget';
import { IncomingRequestContractWidget } from '../components/dashboard/IncomingRequestContractWidget';
import { LatestAnnouncementsWidget } from '../components/dashboard/LatestAnnouncementsWidget';

/** Dashboard shows only widgets granted via Roles > Permissions. */
const DASHBOARD_TICKET = 'dashboard:ticket';
const DASHBOARD_REQUEST_CONTRACT = 'dashboard:requestContract';
const ANNOUNCEMENT_READ = 'announcement:read';

export default function DashboardPage() {
  const { t } = useTranslation('pages');
  const { permissions = [] } = useAuth();

  const hasTicketWidget = permissions.includes(DASHBOARD_TICKET);
  const hasRequestContractWidget = permissions.includes(DASHBOARD_REQUEST_CONTRACT);
  const hasAnnouncements = permissions.includes(ANNOUNCEMENT_READ);

  const hasAnyWidget = hasTicketWidget || hasRequestContractWidget || hasAnnouncements;

  if (!hasAnyWidget) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 font-body">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-400">{t('dashboard.noPermission')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 font-body">
      <section aria-label="Dashboard">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {hasTicketWidget && <NewTicketsWidget permissions={permissions} />}
          {hasRequestContractWidget && <IncomingRequestContractWidget permissions={permissions} />}
          {hasAnnouncements && <LatestAnnouncementsWidget permissions={permissions} />}
        </div>
      </section>
    </div>
  );
}
