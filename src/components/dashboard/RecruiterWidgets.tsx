import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from './StatCard';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import * as api from '../../services/api';

type RecruiterWidgetsProps = {
  permissions: string[];
};

export function RecruiterWidgets({ permissions }: RecruiterWidgetsProps) {
  const [stats, setStats] = useState({
    activeCandidates: 0,
    submittedToClient: 0,
    onboardingQueue: 0,
    activeProjects: 0,
  });
  const [projects, setProjects] = useState<api.Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [candidates, projs] = await Promise.all([
          api.getCandidates({ per_page: 1000 }).then((r) => r.data),
          api.getProjects(),
        ]);

        const submitted = candidates.filter((c) => c.screening_status === 'submitted');
        const onboarding = candidates.filter((c) => c.screening_status === 'onboarding');

        setStats({
          activeCandidates: candidates.length,
          submittedToClient: submitted.length,
          onboardingQueue: onboarding.length,
          activeProjects: projs.filter((p) => p.status === 'active').length,
        });
        setProjects(projs.filter((p) => p.status === 'active').slice(0, 5));
      } catch (err) {
        console.error('Failed to load recruiter dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-brand-dark p-10 text-white shadow-2xl transition-all hover:shadow-brand/10">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-brand/20 blur-[100px] group-hover:bg-brand/30 transition-colors" />
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] font-headline">
              Recruitment Pipeline
            </span>
            <div className="mt-10 grid grid-cols-3 gap-8">
              <div>
                <p className="text-5xl font-black text-brand tracking-tighter font-headline">
                  {loading ? '...' : stats.activeCandidates}
                </p>
                <p className="mt-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-tight">
                  Active<br />Candidates
                </p>
              </div>
              <div>
                <p className="text-5xl font-black text-white tracking-tighter font-headline">
                  {loading ? '...' : stats.submittedToClient}
                </p>
                <p className="mt-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-tight">
                  Submitted<br />to Client
                </p>
              </div>
              <div>
                <p className="text-5xl font-black text-white tracking-tighter font-headline">
                  {loading ? '...' : stats.onboardingQueue}
                </p>
                <p className="mt-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-tight">
                  Onboarding<br />Queue
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 flex gap-4">
            <Link
              to="/recruitment/board"
              className="inline-flex items-center justify-center rounded-2xl bg-brand px-8 py-4 text-sm font-bold text-white transition-all hover:bg-brand-dark active:scale-95 shadow-lg shadow-brand/20"
            >
              Open Kanban Board
            </Link>
            <Link
              to="/candidates/new"
              className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-95 border border-white/10"
            >
              Add Candidate
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          loading={loading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          link="/projects"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity
          title="Active Projects"
          subtitle="Projects you're managing"
          items={projects.map((project) => ({
            id: project.id,
            title: project.name,
            subtitle: project.client_name || 'No client',
            link: `/projects/${project.id}`,
          }))}
          loading={loading}
          emptyMessage="No active projects"
          viewAllLink="/projects"
        />
      </div>

      <QuickActions
        actions={[
          { label: 'Add Candidate', path: '/candidates/new', variant: 'primary', permission: 'candidate:create' },
          { label: 'View Board', path: '/recruitment/board', variant: 'secondary' },
          { label: 'Manage Projects', path: '/projects', variant: 'secondary', permission: 'project:read' },
        ]}
        userPermissions={permissions}
      />
    </div>
  );
}
