import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getVisibleNavItems,
  NAV_GROUP_LABELS,
  type NavGroupId,
  type NavItem,
} from '../config/nav';
import { NotificationBell } from './NotificationBell';

const GROUP_ORDER: NavGroupId[] = ['home', 'recruitment', 'people', 'support', 'setup'];

function groupNavItems(items: NavItem[]): Map<NavGroupId, NavItem[]> {
  const map = new Map<NavGroupId, NavItem[]>();
  for (const g of GROUP_ORDER) map.set(g, []);
  for (const item of items) {
    const list = map.get(item.group);
    if (list) list.push(item);
  }
  return map;
}

function getIcon(iconName?: string) {
  switch (iconName) {
    case 'home':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'board':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case 'candidates':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'pending':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'employees':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'contracts':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'warnings':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'tickets':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
    case 'faq':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'my-space':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'departments':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'clients':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'projects':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'roles':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'chart':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}

export default function AppLayout() {
  const { user, tenant, roles, permissions = [], logout } = useAuth();
  const location = useLocation();
  const navItems = getVisibleNavItems(roles || [], permissions || []);
  const grouped = groupNavItems(navItems);

  const roleLabel = roles[0]?.replace(/_/g, ' ') ?? 'Member';
  const firstName = user?.full_name?.split(' ')[0] ?? 'User';

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-body">
      {/* Sidebar - Official 3S Style */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200/60 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex h-24 shrink-0 items-center gap-4 px-8">
          <Link to="/dashboard" className="flex items-center gap-4 group">
            <div className="h-12 w-12 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform duration-300">
              <img src="/logo-sigma.png" alt="" className="h-7 w-auto object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-brand-dark tracking-tighter leading-none font-headline">Sigma<span className="text-brand">HR</span></span>
              {/* <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Solusi Servis</span> */}
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide" aria-label="Main">
          {GROUP_ORDER.map((groupId) => {
            const items = grouped.get(groupId) ?? [];
            if (items.length === 0) return null;
            const label = NAV_GROUP_LABELS[groupId];
            return (
              <div key={groupId} className="space-y-3">
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                  {label}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const isActive = item.exact
                      ? location.pathname === item.path
                      : location.pathname === item.path ||
                        (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                            isActive
                              ? 'bg-brand text-white shadow-xl shadow-brand/20 translate-x-1'
                              : 'text-slate-500 hover:bg-brand-lighter hover:text-brand'
                          }`}
                        >
                          <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand'}`}>
                            {getIcon(item.icon)}
                          </div>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 pl-72 flex flex-col">
        {/* Top Header - Sharp & Contextual */}
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20 px-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-brand-dark tracking-tight font-headline">
              {location.pathname === '/dashboard' ? `Hello, ${firstName}` : 
               navItems
                .filter((n) => location.pathname === n.path || location.pathname.startsWith(n.path + '/'))
                .sort((a, b) => b.path.length - a.path.length)[0]?.label ?? 'HRIS'}
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              {location.pathname === '/dashboard' ? 'Welcome back to your workspace' : 'Management System'}
            </p>
          </div>

          <div className="flex items-center gap-8">
            {/* Notifications */}
            <NotificationBell />

            <div className="h-10 w-px bg-slate-200/60" />

            {/* Localisation Switcher */}
            <div className="flex items-center bg-slate-100/80 rounded-xl p-1 border border-slate-200/50">
              <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-white shadow-sm text-brand transition-all">EN</button>
              <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg text-slate-400 hover:text-slate-600 transition-all">ID</button>
            </div>

            <div className="h-10 w-px bg-slate-200/60" />

            {/* Logged User Info */}
            <div className="flex items-center gap-4 group cursor-pointer relative">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-brand-dark leading-none">{user?.full_name}</p>
                <p className="text-[10px] font-bold text-brand uppercase tracking-[0.15em] mt-1.5">{roleLabel}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-brand-lighter flex items-center justify-center text-brand font-black text-lg border-2 border-white shadow-lg shadow-brand/5 group-hover:scale-105 transition-transform duration-300">
                {user?.full_name?.charAt(0) ?? 'U'}
              </div>
              
              {/* Profile Dropdown */}
              <div className="absolute top-[calc(100%+1rem)] right-0 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-4 z-50 translate-y-2 group-hover:translate-y-0">
                <div className="px-6 py-3 border-b border-slate-50 mb-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Organization</p>
                  <p className="text-sm font-bold text-brand-dark truncate">{tenant?.name}</p>
                </div>
                <div className="px-2">
                  <button
                    onClick={logout}
                    className="w-full text-left px-6 py-4 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors flex items-center gap-3 group/logout"
                  >
                    <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center group-hover/logout:bg-red-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-10 py-12">
          <Outlet />
        </main>
      </div>

      {/* Sticky Help / Open Ticket button — always visible for authenticated users */}
      <Link
        to={`/tickets/new?return=${encodeURIComponent(location.pathname)}`}
          className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-xl shadow-brand/30 hover:scale-105 hover:shadow-2xl hover:shadow-brand/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          title="Open ticket / Help"
          aria-label="Open support ticket"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Link>
    </div>
  );
}
