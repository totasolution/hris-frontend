/**
 * Navigation config aligned with PRD/BRD personas and HRIS_UI_DESIGN.md.
 * Sidebar groups: home, setup, recruitment, people, support.
 * Role slugs match backend roles.slug (e.g. tenant_admin, hrd, recruiter).
 */

export type NavGroupId = 'home' | 'setup' | 'recruitment' | 'people' | 'support';

export type NavItem = {
  label: string;
  path: string;
  /** @deprecated Not used; visibility is permission-only. */
  roles?: string[];
  /** Permission required to see this item. Format: "resource:action" e.g., "ticket:read". */
  permission?: string;
  /** If set, user must have at least one of these permissions to see the item. */
  permissionsAny?: string[];
  /** Sidebar group. Items in same group are rendered together. */
  group: NavGroupId;
  /** Icon name from Heroicons or SVG path */
  icon?: string;
  /** When true, match path exactly (no prefix match). Use when item has child routes like /faq vs /faq/admin */
  exact?: boolean;
};

/** Dashboard visible when user has any dashboard section permission (defined in permission settings). */
export const DASHBOARD_SECTION_PERMISSIONS = [
  'dashboard:admin',
  'dashboard:recruitment',
  'dashboard:employee',
  'dashboard:ticket',
  'dashboard:requestContract',
] as const;

/** Translation keys for nav item labels (resolved with useTranslation('nav')). */
export const NAV_ITEMS: NavItem[] = [
  { label: 'dashboard', path: '/dashboard', permissionsAny: [...DASHBOARD_SECTION_PERMISSIONS], group: 'home', icon: 'home' },
  { label: 'mySpace', path: '/me', permission: 'my_space:read', group: 'home', icon: 'my-space', exact: true },
  { label: 'recruitmentStatistics', path: '/recruitment/statistics', permission: 'recruitment:statistics', group: 'recruitment', icon: 'chart' },
  { label: 'recruitmentBoard', path: '/recruitment/board', permission: 'recruitment:read', group: 'recruitment', icon: 'board' },
  { label: 'candidates', path: '/candidates', permission: 'recruitment:read', group: 'recruitment', icon: 'candidates' },
  { label: 'pendingHrd', path: '/onboarding/pending-hrd', permissionsAny: ['rc:view', 'rc:approve'], group: 'recruitment', icon: 'pending' },
  { label: 'employees', path: '/employees', permission: 'employee:read', group: 'people', icon: 'employees' },
  { label: 'payslips', path: '/payslips', permission: 'payslip:read', group: 'people', icon: 'payslip' },
  { label: 'contracts', path: '/contracts', permission: 'contract:read', group: 'people', icon: 'contracts' },
  { label: 'paklaring', path: '/paklaring', permission: 'paklaring:read', group: 'people', icon: 'paklaring' },
  { label: 'contractTemplates', path: '/contract-templates', permission: 'contract_template:read', group: 'setup', icon: 'contracts' },
  { label: 'companySettings', path: '/company-settings', permission: 'tenant:read', group: 'setup', icon: 'clients' },
  { label: 'warnings', path: '/warnings', permission: 'warning:read', group: 'people', icon: 'warnings' },
  { label: 'tickets', path: '/tickets', permission: 'ticket:read', group: 'support', icon: 'tickets' },
  { label: 'announcements', path: '/announcements', permission: 'announcement:read', group: 'support', icon: 'megaphone', exact: true },
  { label: 'faq', path: '/faq', permission: 'faq:read', group: 'support', icon: 'faq', exact: true },
  { label: 'manageFaq', path: '/faq/admin', permission: 'faq:manage', group: 'support', icon: 'faq' },
  { label: 'departments', path: '/departments', permission: 'department:manage', group: 'setup', icon: 'departments' },
  { label: 'clients', path: '/clients', permission: 'client:manage', group: 'setup', icon: 'clients' },
  { label: 'projects', path: '/projects', permission: 'project:manage', group: 'setup', icon: 'projects' },
  { label: 'users', path: '/users', permission: 'user:read', group: 'setup', icon: 'users' },
  { label: 'roles', path: '/roles', permission: 'role:manage', group: 'setup', icon: 'roles' },
];

/** Translation keys for nav group labels (resolved with useTranslation('nav')). */
export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  home: 'groupHome',
  recruitment: 'groupRecruitment',
  people: 'groupPeople',
  support: 'groupSupport',
  setup: 'groupSetup',
};

/**
 * User can see nav item based on permissions only (roles are ignored):
 * - Item has permissionsAny: user must have at least one of those permissions
 * - Item has permission: user must have that permission
 * - Item has neither: not shown
 */
export function canSeeNavItem(item: NavItem, _userRoles: string[] = [], userPermissions: string[] = []): boolean {
  if (item.permissionsAny && item.permissionsAny.length > 0) {
    return !!(userPermissions && item.permissionsAny.some((p) => userPermissions.includes(p)));
  }
  if (item.permission) {
    return !!(userPermissions && userPermissions.includes(item.permission));
  }
  return false;
}

export function getVisibleNavItems(userRoles: string[] = [], userPermissions: string[] = []): NavItem[] {
  return NAV_ITEMS.filter((item) => canSeeNavItem(item, userRoles, userPermissions));
}
