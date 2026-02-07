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
export const DASHBOARD_SECTION_PERMISSIONS = ['dashboard:admin', 'dashboard:recruitment', 'dashboard:employee'] as const;

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', permissionsAny: [...DASHBOARD_SECTION_PERMISSIONS], group: 'home', icon: 'home' },
  { label: 'My Space', path: '/me', permission: 'my_space:read', group: 'home', icon: 'my-space', exact: true },
  { label: 'Recruitment Board', path: '/recruitment/board', permission: 'recruitment:read', group: 'recruitment', icon: 'board' },
  { label: 'Candidates', path: '/candidates', permission: 'recruitment:read', group: 'recruitment', icon: 'candidates' },
  { label: 'Recruitment Statistics', path: '/recruitment/statistics', permission: 'recruitment:statistics', group: 'recruitment', icon: 'chart' },
  { label: 'Pending HRD', path: '/onboarding/pending-hrd', permission: 'onboarding:approve', group: 'recruitment', icon: 'pending' },
  { label: 'Employees', path: '/employees', permission: 'employee:read', group: 'people', icon: 'employees' },
  { label: 'Contracts', path: '/contracts', permission: 'contract:read', group: 'people', icon: 'contracts' },
  { label: 'Contract Templates', path: '/contract-templates', permission: 'contract_template:read', group: 'setup', icon: 'contracts' },
  { label: 'Company Settings', path: '/company-settings', permission: 'tenant:read', group: 'setup', icon: 'clients' },
  { label: 'Warnings', path: '/warnings', permission: 'warning:read', group: 'people', icon: 'warnings' },
  { label: 'Tickets', path: '/tickets', permission: 'ticket:read', group: 'support', icon: 'tickets' },
  { label: 'FAQ', path: '/faq', permission: 'faq:read', group: 'support', icon: 'faq', exact: true },
  { label: 'Manage FAQ', path: '/faq/admin', permission: 'faq:manage', group: 'support', icon: 'faq' },
  { label: 'Departments', path: '/departments', permission: 'department:manage', group: 'setup', icon: 'departments' },
  { label: 'Clients', path: '/clients', permission: 'client:manage', group: 'setup', icon: 'clients' },
  { label: 'Projects', path: '/projects', permission: 'project:manage', group: 'setup', icon: 'projects' },
  { label: 'Users', path: '/users', permission: 'user:read', group: 'setup', icon: 'users' },
  { label: 'Roles', path: '/roles', permission: 'role:manage', group: 'setup', icon: 'roles' },
];

export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  home: 'Home',
  recruitment: 'Recruitment',
  people: 'People',
  support: 'Support',
  setup: 'Settings',
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
