// In production (e.g. Vercel), set VITE_API_BASE to API host (e.g. https://ponot.sigmasolusiservis.com). Local dev uses relative /api/v1 + Vite proxy.
import { downloadBlob, parseFilenameFromDisposition } from '../utils/download';

const API_BASE = (() => {
  const base = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
  return base ? `${base}/api/v1` : '/api/v1';
})();

export type User = {
  id: number;
  tenant_id?: number;
  employee_id?: number;
  email: string;
  full_name: string;
  phone?: string;
  username?: string;
  user_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Tenant = {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  company_name?: string;
  company_address?: string;
  company_representative_name?: string;
  company_representative_title?: string;
  created_at: string;
  updated_at: string;
};

export type TenantCompanyInfo = {
  company_name?: string;
  company_address?: string;
  company_representative_name?: string;
  company_representative_title?: string;
};

export async function getTenantCompanyInfo(): Promise<TenantCompanyInfo> {
  const res = await authFetch(`${API_BASE}/tenant/company-info`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch company info');
  return data;
}

export async function updateTenantCompanyInfo(body: TenantCompanyInfo): Promise<TenantCompanyInfo> {
  const res = await authFetch(`${API_BASE}/tenant/company-info`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update company info');
  return data;
}

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
  tenant?: Tenant;
  roles: string[];
  permissions?: string[]; // Format: "resource:action" e.g., "ticket:read"
};

export type LoginInput = {
  email: string;
  password: string;
};

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? 'Login failed';
    throw new Error(msg);
  }
  return data;
}

export async function refresh(refreshToken: string): Promise<LoginResponse> {
  const res = await authFetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? 'Refresh failed';
    throw new Error(msg);
  }
  return data;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/users/me/password`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to change password');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant');
  localStorage.removeItem('roles');
  localStorage.removeItem('permissions');
}

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return h;
}

let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  // For FormData, do not set Content-Type so the browser sets multipart/form-data with boundary
  const isFormData = init.body != null && init.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? (getAccessToken() ? { Authorization: `Bearer ${getAccessToken()!}` } : {})
    : { ...(authHeaders() as Record<string, string>) };
  const opts: RequestInit = {
    ...init,
    credentials: 'include',
    headers: { ...headers, ...(init.headers as Record<string, string>) },
  };
  const res = await fetch(input, opts);
  if (res.status === 401) {
    if (unauthorizedHandler) unauthorizedHandler();
    throw new Error('Unauthorized');
  }
  return res;
}

// Departments
export type Department = {
  id: number;
  tenant_id: number;
  name: string;
  code?: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
};

export async function getDepartments(): Promise<Department[]> {
  const res = await authFetch(`${API_BASE}/departments`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch departments');
  return data.data ?? [];
}

export async function getDepartment(id: number): Promise<Department> {
  const res = await authFetch(`${API_BASE}/departments/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch department');
  return data;
}

export async function createDepartment(body: { name: string; code?: string; parent_id?: number }): Promise<Department> {
  const res = await authFetch(`${API_BASE}/departments`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create department');
  return data;
}

export async function updateDepartment(
  id: number,
  body: { name: string; code?: string; parent_id?: number }
): Promise<Department> {
  const res = await authFetch(`${API_BASE}/departments/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update department');
  return data;
}

export async function deleteDepartment(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/departments/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete department');
  }
}

// Clients
export type Client = {
  id: number;
  tenant_id: number;
  name: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  address_unit?: string;
  rt_rw?: string;
  province?: string;
  district?: string;
  sub_district?: string;
  kelurahan?: string;
  zip_code?: string;
  agreement_start_date?: string;
  agreement_end_date?: string;
  spk_number?: string;
  spk_document_url?: string;
  npwp_number?: string;
  npwp_document_url?: string;
  nib_number?: string;
  nib_document_url?: string;
  payroll_cut_off_start?: number;
  payroll_cut_off_end?: number;
  payment_date?: number;
  logo_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function getClients(options?: { activeOnly?: boolean }): Promise<Client[]> {
  const path = options?.activeOnly ? `${API_BASE}/clients?active_only=true` : `${API_BASE}/clients`;
  const res = await authFetch(path, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch clients');
  return data.data ?? [];
}

export async function getClientsPaginated(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  active_only?: boolean;
}): Promise<PaginatedResponse<Client>> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.active_only) q.set('active_only', 'true');
  const url = q.toString() ? `${API_BASE}/clients?${q}` : `${API_BASE}/clients`;
  const res = await authFetch(url, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch clients');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export async function getClient(id: number): Promise<Client> {
  const res = await authFetch(`${API_BASE}/clients/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch client');
  return data;
}

export async function createClient(body: { name: string; company_phone?: string; company_email?: string; company_website?: string; status?: string }): Promise<Client> {
  const res = await authFetch(`${API_BASE}/clients`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create client');
  return data;
}

export async function patchClient(id: number, body: Partial<Client>): Promise<Client> {
  const res = await authFetch(`${API_BASE}/clients/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update client');
  return data;
}

export async function updateClient(id: number, body: Partial<Client> & { name: string }): Promise<Client> {
  const res = await authFetch(`${API_BASE}/clients/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update client');
  return data;
}

export type ClientDocType = 'spk' | 'npwp' | 'nib';

export async function uploadClientDocument(clientId: number, docType: ClientDocType, file: File): Promise<{ document_url: string }> {
  const form = new FormData();
  form.append('doc_type', docType);
  form.append('file', file);
  const res = await authFetch(`${API_BASE}/clients/${clientId}/documents`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to upload document');
  return data;
}

export async function getClientDocumentURL(clientId: number, docType: ClientDocType): Promise<string> {
  const res = await authFetch(`${API_BASE}/clients/${clientId}/documents/${docType}/url`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get document URL');
  return data.url ?? '';
}

export async function deleteClient(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/clients/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete client');
  }
}

// Permissions (read-only list)
export type Permission = {
  id: number;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
};

export async function getPermissions(): Promise<Permission[]> {
  const res = await authFetch(`${API_BASE}/permissions`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch permissions');
  return data.data ?? [];
}

// Roles
export type Role = {
  id: number;
  tenant_id?: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export async function getRoles(): Promise<Role[]> {
  const res = await authFetch(`${API_BASE}/roles`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch roles');
  return data.data ?? [];
}

export async function getRole(id: number): Promise<Role> {
  const res = await authFetch(`${API_BASE}/roles/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch role');
  return data;
}

export async function createRole(body: { name: string; slug?: string; description?: string }): Promise<Role> {
  const res = await authFetch(`${API_BASE}/roles`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create role');
  return data;
}

export async function updateRole(id: number, body: { name: string; slug?: string; description?: string }): Promise<Role> {
  const res = await authFetch(`${API_BASE}/roles/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update role');
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/roles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete role');
  }
}

export async function getRolePermissionIds(roleId: number): Promise<number[]> {
  const res = await authFetch(`${API_BASE}/roles/${roleId}/permissions`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch role permissions');
  return data.permission_ids ?? [];
}

export async function setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
  const res = await authFetch(`${API_BASE}/roles/${roleId}/permissions`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ permission_ids: permissionIds }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to set role permissions');
  }
}

// Paginated response type
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

// Users (list, get, create, update – tenant-scoped)
export async function getUsers(params?: { page?: number; per_page?: number; search?: string; role_slug?: string }): Promise<PaginatedResponse<User>> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.role_slug) q.set('role_slug', params.role_slug);
  const url = q.toString() ? `${API_BASE}/users?${q}` : `${API_BASE}/users`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch users');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export type UserDetail = {
  user: User;
  role_ids: number[];
  department_ids: number[];
};

export async function getUser(id: number): Promise<UserDetail> {
  const res = await authFetch(`${API_BASE}/users/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch user');
  return data;
}

export async function createUser(body: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  username?: string;
  user_type?: string;
  status?: string;
  role_ids?: number[];
  department_ids?: number[];
}): Promise<User> {
  const res = await authFetch(`${API_BASE}/users`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create user');
  return data;
}

export async function updateUser(
  id: number,
  body: {
    full_name: string;
    phone?: string;
    username?: string;
    status?: string;
    employee_id?: number | null;
    role_ids?: number[];
    department_ids?: number[];
  }
): Promise<User> {
  const res = await authFetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update user');
  return data;
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/users/${userId}/password`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to reset password');
}

// Candidates
/** Employment type: pkwt (PKWT) or partnership (Mitra Kerja) */
export type CandidateEmploymentType = 'pkwt' | 'partnership';

export type Candidate = {
  id: number;
  tenant_id: number;
  client_id?: number;
  full_name: string;
  email: string;
  phone?: string;
  employment_type?: CandidateEmploymentType | null;
  ojt_option?: boolean;
  position?: string | null;
  placement_location?: string | null;
  province_id?: string | null;
  district_id?: string | null;
  sub_district_id?: string | null;
  village_id?: string | null;
  branch?: string | null;
  package?: string | null; // Comma-separated: bpjskes,bpjsket,bpjsbpu,insurance,overtime
  screening_status: string;
  screening_notes?: string;
  screening_rating?: number;
  submitted_to_client_at?: string;
  created_by?: number;
  pic_name?: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
};

/** Indonesian province (for placement location). */
export type Province = {
  id: number;
  code: string;
  name: string;
};

export async function getProvinces(params?: { search?: string }): Promise<Province[]> {
  const q = new URLSearchParams();
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const url = q.toString() ? `${API_BASE}/provinces?${q}` : `${API_BASE}/provinces`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch provinces');
  return Array.isArray(data?.data) ? data.data : [];
}

export type CandidateDocument = {
  id: number;
  tenant_id: number;
  candidate_id: number;
  type: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: number;
  created_at: string;
};

export async function getCandidates(params?: {
  client_id?: number;
  status?: string;
  search?: string;
  created_by?: number;
  created_from?: string;
  created_to?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Candidate>> {
  const q = new URLSearchParams();
  if (params?.client_id) q.set('client_id', String(params.client_id));
  if (params?.status) q.set('status', params.status);
  if (params?.created_by) q.set('created_by', String(params.created_by));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.created_from) q.set('created_from', params.created_from);
  if (params?.created_to) q.set('created_to', params.created_to);
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/candidates?${q}` : `${API_BASE}/candidates`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch candidates');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export async function getCandidate(id: number): Promise<Candidate> {
  const res = await authFetch(`${API_BASE}/candidates/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch candidate');
  return data;
}

export async function createCandidate(body: {
  client_id?: number;
  full_name: string;
  email: string;
  phone?: string;
  employment_type?: CandidateEmploymentType;
  ojt_option?: boolean;
  position?: string;
  placement_location?: string;
  province_id?: string;
  district_id: string;
  sub_district_id?: string;
  village_id?: string;
  branch?: string;
  package?: string;
}): Promise<Candidate> {
  const res = await authFetch(`${API_BASE}/candidates`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create candidate');
  return data;
}

export async function updateCandidate(
  id: number,
  body: Partial<{
    client_id: number;
    full_name: string;
    email: string;
    phone: string;
    employment_type: CandidateEmploymentType | null;
    ojt_option: boolean;
    position: string;
    placement_location: string;
    province_id: string;
    district_id: string;
    sub_district_id: string;
    village_id: string;
    branch: string;
    package: string;
    screening_status: string;
    screening_notes: string;
    screening_rating: number;
  }>
): Promise<Candidate> {
  const res = await authFetch(`${API_BASE}/candidates/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update candidate');
  return data;
}

export async function deleteCandidate(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/candidates/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete candidate');
  }
}

// Recruitment Statistics
export type RecruitmentStatistics = {
  by_status: Record<string, number>;
  by_client: { client_id?: number; client_name: string; count: number }[];
  by_pic: { pic_id?: number; pic_name: string; count: number }[];
  by_pic_stages: {
    pic_id?: number;
    pic_name: string;
    screening: number;
    rejected: number;
    ojt: number;
    contract_requested: number;
    hired: number;
  }[];
  totals: {
    all: number;
    active: number;
    hired: number;
    rejected: number;
    new_this_period: number;
    hired_this_period: number;
  };
};

export async function getRecruitmentStatistics(params?: {
  client_id?: number;
  province_id?: string;
  period?: 'week' | 'month';
  year?: number;
  month?: number;
  week?: number;
}): Promise<RecruitmentStatistics> {
  const q = new URLSearchParams();
  if (params?.client_id) q.set('client_id', String(params.client_id));
  if (params?.province_id) q.set('province_id', params.province_id);
  if (params?.period) q.set('period', params.period);
  if (params?.year) q.set('year', String(params.year));
  if (params?.month) q.set('month', String(params.month));
  if (params?.week) q.set('week', String(params.week));
  const url = q.toString() ? `${API_BASE}/recruitment/statistics?${q}` : `${API_BASE}/recruitment/statistics`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch recruitment statistics');
  return data;
}

/** XLSX: hired + contract_requested candidates with an assigned recruiter (PIC), same filters as recruitment statistics. */
export async function downloadRecruitmentHiredByRecruiterReport(params?: {
  client_id?: number;
  province_id?: string;
  period?: 'week' | 'month';
  year?: number;
  month?: number;
  week?: number;
}): Promise<void> {
  const q = new URLSearchParams();
  if (params?.client_id) q.set('client_id', String(params.client_id));
  if (params?.province_id) q.set('province_id', params.province_id);
  if (params?.period) q.set('period', params.period);
  if (params?.year) q.set('year', String(params.year));
  if (params?.month) q.set('month', String(params.month));
  if (params?.week) q.set('week', String(params.week));
  const base = `${API_BASE}/recruitment/statistics/hired-by-recruiter-report`;
  const url = q.toString() ? `${base}?${q}` : base;
  const res = await authFetch(url, {
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const filename = parseFilenameFromDisposition(disposition) ?? 'recruitment-hired-by-recruiter.xlsx';
  downloadBlob(blob, filename);
}

export async function getCandidateDocuments(candidateId: number): Promise<CandidateDocument[]> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/documents`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch documents');
  return data.data ?? [];
}

export type CandidateDocumentType = 'cv' | 'ktp' | 'kk' | 'skck' | 'other';

export async function uploadCandidateDocument(candidateId: number, file: File, type: CandidateDocumentType): Promise<CandidateDocument> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  const token = getAccessToken();
  const h: HeadersInit = {};
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/documents`, {
    method: 'POST',
    credentials: 'include',
    headers: h,
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to upload document');
  return data;
}

export async function getCandidateDocumentUrl(candidateId: number, documentId: number): Promise<string> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/documents/${documentId}/url`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get document URL');
  return data.url ?? '';
}

export async function deleteCandidateDocument(candidateId: number, documentId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/documents/${documentId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.error as { message?: string })?.message ?? 'Failed to delete document');
}

// Onboarding
export type OnboardingLink = {
  id: number;
  tenant_id: number;
  candidate_id: number;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
};

export type OnboardingFormData = {
  id: number;
  tenant_id: number;
  candidate_id: number;
  candidate_name?: string;

  // Personal Info
  id_number?: string;
  ktp_rt_rw?: string;
  ktp_province?: string;
  ktp_district?: string;
  ktp_sub_district?: string;
  address?: string;               // KTP street/detail address
  domicile_rt_rw?: string;
  domicile_province?: string;
  domicile_district?: string;
  domicile_sub_district?: string;
  domicile_address?: string;      // Domicile street/detail address
  domicile_same_as_ktp?: boolean;
  place_of_birth?: string;
  date_of_birth?: string;
  gender?: string;
  religion?: string;
  marital_status?: string;
  phone_no?: string;
  child_number?: number;

  // Financial Info
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  npwp_number?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;

  // Employment Terms (filled by recruiter)
  employment_start_date?: string;
  employment_duration_months?: number;
  employment_salary?: string;
  employment_positional_allowance?: string;
  employment_transport_allowance?: string;
  employment_comm_allowance?: string;
  employment_misc_allowance?: string;
  employment_bpjs_kes?: string;
  employment_bpjs_tku?: string;
  employment_bpjs_bpu?: string;
  employment_insurance_provider?: string;
  employment_insurance_no?: string;
  employment_overtime_nominal?: string;

  /** Candidate packages (from candidates.package), included in GET onboarding-form response */
  package?: string;

  submitted_at?: string;
  data_reviewed_at?: string;
  locked_at?: string;
  submitted_for_hrd_at?: string;
  hrd_approved_at?: string;
  hrd_rejected_at?: string;
  hrd_comment?: string;
  created_at: string;
  updated_at: string;

  /** Declaration checklist (KETENTUAN + SANKSI + final); stored as JSON */
  declaration_checklist?: DeclarationChecklistData;
};

/** Single item in KETENTUAN or SANKSI with optional sub-items (display only; one checkbox per item). */
export type DeclarationChecklistItem = {
  id: string;
  text: string;
  subItems?: string[];
  checked: boolean;
};

/** Final declaration paragraph with one checkbox. */
export type DeclarationFinalItem = {
  text: string;
  checked: boolean;
};

export type DeclarationChecklistData = {
  ketentuan: DeclarationChecklistItem[];
  sanksi: DeclarationChecklistItem[];
  finalDeclaration: DeclarationFinalItem;
};

export async function createOnboardingLink(candidateId: number): Promise<OnboardingLink> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/onboarding-link`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create link');
  return data;
}

// Regions from DB (public - no auth): provinces, districts, sub-districts.
export type RegionItem = { id: string; name: string };
export async function getRegionsProvinces(search?: string): Promise<RegionItem[]> {
  const q = new URLSearchParams();
  if (search?.trim()) q.set('search', search.trim());
  const url = q.toString() ? `${API_BASE}/provinces?${q}` : `${API_BASE}/provinces`;
  const res = await fetch(url, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch provinces');
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map((p: { id: number; name: string }) => ({ id: String(p.id), name: p.name }));
}
export async function getRegionsDistricts(provinceId: string, search?: string): Promise<RegionItem[]> {
  const q = new URLSearchParams({ province_id: provinceId });
  if (search?.trim()) q.set('search', search.trim());
  const res = await fetch(`${API_BASE}/districts?${q}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch districts');
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map((d: { id: number; name: string }) => ({ id: String(d.id), name: d.name }));
}
export async function getRegionsSubDistricts(districtId: string, search?: string): Promise<RegionItem[]> {
  const q = new URLSearchParams({ district_id: districtId });
  if (search?.trim()) q.set('search', search.trim());
  const res = await fetch(`${API_BASE}/sub-districts?${q}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch sub-districts');
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map((s: { id: number; name: string }) => ({ id: String(s.id), name: s.name }));
}
export async function getRegionsVillages(subDistrictId: string, search?: string): Promise<RegionItem[]> {
  const q = new URLSearchParams({ sub_district_id: subDistrictId });
  if (search?.trim()) q.set('search', search.trim());
  const res = await fetch(`${API_BASE}/villages?${q}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch villages');
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map((v: { id: number; name: string }) => ({ id: String(v.id), name: v.name }));
}

export async function getOnboardingByToken(token: string): Promise<{ link: OnboardingLink; candidate: Candidate }> {
  const res = await authFetch(`${API_BASE}/public/onboarding/${token}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Link not found or expired');
  return data;
}
export async function getOnboardingFormByToken(token: string): Promise<OnboardingFormData> {
  const res = await authFetch(`${API_BASE}/public/onboarding/${token}/form`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch onboarding form');
  return data;
}
export async function submitOnboardingForm(token: string, formData: Record<string, unknown>): Promise<void> {
  const res = await authFetch(`${API_BASE}/public/onboarding/${token}/submit`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Submit failed');
}

export type KTPExtractedData = {
  province?: string;
  district?: string;
  nik?: string;
  name?: string;
  place_dob?: string;
  gender?: string;
  address_1?: string;
  address_2?: string;
  address_3?: string;
  address_4?: string;
  religion?: string;
  married_status?: string;
  occupation?: string;
  nationality?: string;
  valid_until?: string;
  confidence?: number;
  /** @deprecated use nik */
  id_number?: string;
  /** @deprecated use name */
  full_name?: string;
  /** @deprecated use place_dob */
  birth_place?: string;
  /** @deprecated use place_dob */
  birth_date?: string;
  /** @deprecated use address_1..address_4 */
  address?: string;
  /** @deprecated use married_status */
  marital_status?: string;
};

export type UploadDocumentResponse = {
  document: any;
  extracted_data?: KTPExtractedData;
  ocr_confidence?: number;
};

const ONBOARDING_MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadOnboardingDocument(token: string, file: File, type: 'ktp' | 'kk' | 'skck' = 'ktp'): Promise<UploadDocumentResponse> {
  if (file.size > ONBOARDING_MAX_FILE_BYTES) {
    throw new Error(`Ukuran file maksimal 5MB. File Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const res = await authFetch(`${API_BASE}/public/onboarding/${token}/upload-document`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Upload failed');
  return data;
}

export async function getOnboardingFormByCandidate(candidateId: number): Promise<OnboardingFormData> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/onboarding-form`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch form');
  return data;
}

/** Editable onboarding form fields (recruiter can review and update after candidate submission). */
export type OnboardingFormDataEditable = Pick<
  OnboardingFormData,
  | 'id_number' | 'ktp_rt_rw' | 'ktp_province' | 'ktp_district' | 'ktp_sub_district' | 'address' | 'domicile_address' | 'domicile_same_as_ktp'
  | 'place_of_birth' | 'date_of_birth' | 'gender' | 'religion' | 'marital_status' | 'phone_no' | 'child_number'
  | 'bank_name' | 'bank_account_number' | 'bank_account_holder' | 'npwp_number'
  | 'emergency_contact_name' | 'emergency_contact_relationship' | 'emergency_contact_phone'
>;

export async function updateOnboardingFormByCandidate(
  candidateId: number,
  payload: OnboardingFormDataEditable
): Promise<OnboardingFormData> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/onboarding-form`, {
    method: 'PUT',
    credentials: 'include',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update form');
  return data;
}

export type EmploymentTermsInput = {
  employment_start_date?: string;
  employment_duration_months?: number;
  employment_salary?: string;
  employment_positional_allowance?: string;
  employment_transport_allowance?: string;
  employment_comm_allowance?: string;
  employment_misc_allowance?: string;
  employment_bpjs_kes?: string;
  employment_bpjs_tku?: string;
  employment_bpjs_bpu?: string;
  employment_insurance_provider?: string;
  employment_insurance_no?: string;
  employment_overtime_nominal?: string;
};

export async function updateEmploymentTerms(
  candidateId: number,
  payload: EmploymentTermsInput
): Promise<OnboardingFormData> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/employment-terms`, {
    method: 'PUT',
    credentials: 'include',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update employment terms');
  return data;
}

export async function getOnboardingLinkByCandidate(candidateId: number): Promise<OnboardingLink> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/onboarding-link`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch link');
  return data;
}

export async function submitCandidateToClient(candidateId: number): Promise<Candidate> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/submit-to-client`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to submit candidate to client');
  return data;
}

export async function requestContract(candidateId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/request-contract`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to request contract');
}

export async function approveCandidate(
  candidateId: number,
  body: { nip: string; contract_number?: string; status?: string }
): Promise<void> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to approve');
}

export async function rejectCandidate(candidateId: number, comment: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to reject');
}

export async function getPendingHRDList(): Promise<OnboardingFormData[]> {
  const res = await authFetch(`${API_BASE}/onboarding/pending-hrd`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

/** Count of onboarding links sent >2 days ago not yet submitted (for nav badge). */
export async function getOnboardingFollowUpCount(): Promise<number> {
  const res = await authFetch(`${API_BASE}/onboarding/follow-up-count`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) return 0;
  return typeof data.count === 'number' ? data.count : 0;
}

export type OnboardingStatusItem = {
  candidate_id: number;
  candidate_name: string;
  client_name: string;
  pic_name?: string;
  /** Candidate recruitment screening status (e.g. onboarding, hired, rejected). Used for UI conditions only. */
  screening_status?: string;
  token: string;
  created_at: string;
  expires_at?: string;
  status: 'new' | 'need_follow_up';
};

export async function getOnboardingStatusList(params?: {
  search?: string;
  client_id?: number;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<OnboardingStatusItem>> {
  const q = new URLSearchParams();
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.client_id) q.set('client_id', String(params.client_id));
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/onboarding/status?${q}` : `${API_BASE}/onboarding/status`;
  const res = await authFetch(url, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

// Employees
export type Employee = {
  id: number;
  tenant_id: number;
  user_id?: number;
  candidate_id?: number;
  employee_type: string;
  employment_contract_type?: 'pkwt' | 'partnership' | null; // From candidate when hired; selects embedded PKWT vs Partnership HTML
  /** Contract length in months (from candidate employment terms / onboarding on hire). */
  contract_duration_months?: number | null;
  employee_number?: string;
  department_id?: number;
  client_id?: number;
  client_name?: string;
  full_name: string;
  email: string;
  company_email?: string;
  phone?: string;
  status: string;
  hire_date?: string;
  join_date?: string;
  termination_type?: string;
  termination_date?: string;
  last_working_date?: string;
  termination_reason?: string;
  // Personal Information
  identification_id?: string;
  id_expired_date?: string;
  birthdate?: string;
  place_of_birth?: string;
  gender?: string;
  marital_status?: string;
  tax_status?: string;
  child_number?: number;
  religion?: string;
  // Financial & Tax
  npwp?: string;
  salary?: string;
  bank_name?: string;
  bank_account?: string;
  bank_account_holder?: string;
  bank_id?: number;
  // Emergency Contact
  emergency_contact?: string;
  emergency_contact_relationship?: string;
  emergency_phone?: string;
  // Address
  address?: string;           // KTP address (alamat sesuai KTP)
  rt_rw?: string;             // RT/RW e.g. 01/02
  domicile_address?: string;  // Domicile street / full
  domicile_rt_rw?: string;
  domicile_province?: string;
  domicile_district?: string;
  domicile_sub_district?: string;
  domicile_zip_code?: string;
  village?: string;
  sub_district?: string;
  district?: string;
  province?: string;
  zip_code?: string;
  // Role & placement
  position?: string;
  placement_location?: string;
  placement_district_id?: string;
  placement_sub_district_id?: string;
  placement_village_id?: string;
  branch?: string;
  // BPJS (Indonesian social security)
  bpjstk_id?: string;  // BPJS Tenaga Kerja ID
  bpjsks_id?: string;  // BPJS Kesehatan ID
  bpjs_bpu?: string;   // BPJS BPU ID
  // Employment allowances
  positional_allowance?: string;  // Tunjangan Jabatan
  transport_allowance?: string;   // Tunjangan Transportasi
  comm_allowance?: string;       // Tunjangan Komunikasi
  misc_allowance?: string;       // Tunjangan Lain-lain
  annual_leave_nominal?: string;
  insurance_provider?: string;
  insurance_no?: string;
  overtime_nominal?: string;
  created_at: string;
  updated_at: string;
};

export type EmployeeEducation = {
  id?: number;
  tenant_id?: number;
  employee_id?: number;
  last_education?: string;
  major?: string;
  graduation_year?: string;
  school_name?: string;
  gpa?: string;
  city?: string;
  created_at?: string;
  updated_at?: string;
};

export type EmployeeFamily = {
  id?: number;
  tenant_id?: number;
  employee_id?: number;
  family_card_number?: string;
  father_name?: string;
  mother_name?: string;
  wife_name?: string;
  child1_name?: string;
  child2_name?: string;
  child3_name?: string;
  created_at?: string;
  updated_at?: string;
};

export type EmployeeInformationPayload = {
  employee_number?: string | null;
  department_id?: number | null;
  client_id?: number | null;
  email?: string | null;
  company_email?: string | null;
  phone?: string | null;
  status?: string | null;
  hire_date?: string | null;
  join_date?: string | null;
  termination_type?: string | null;
  last_working_date?: string | null;
  termination_reason?: string | null;
  position?: string | null;
  placement_location?: string | null;
  branch?: string | null;
  employment_contract_type?: string | null;
  contract_duration_months?: number | null;
};

export type EmployeePersonalPayload = {
  identification_id?: string | null;
  id_expired_date?: string | null;
  birthdate?: string | null;
  place_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  child_number?: number | null;
  religion?: string | null;
};

export type EmployeeFinancialPayload = {
  tax_status?: string | null;
  npwp?: string | null;
  salary?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  bank_account_holder?: string | null;
  bank_id?: number | null;
  bpjstk_id?: string | null;
  bpjsks_id?: string | null;
  bpjs_bpu?: string | null;
  positional_allowance?: string | null;
  transport_allowance?: string | null;
  comm_allowance?: string | null;
  misc_allowance?: string | null;
  annual_leave_nominal?: string | null;
  insurance_provider?: string | null;
  insurance_no?: string | null;
  overtime_nominal?: string | null;
};

export type EmployeeEmergencyPayload = {
  emergency_contact?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_phone?: string | null;
};

export type EmployeeAddressPayload = {
  address?: string | null;
  rt_rw?: string | null;
  village?: string | null;
  sub_district?: string | null;
  district?: string | null;
  province?: string | null;
  zip_code?: string | null;
  domicile_address?: string | null;
  domicile_rt_rw?: string | null;
  domicile_province?: string | null;
  domicile_district?: string | null;
  domicile_sub_district?: string | null;
  domicile_zip_code?: string | null;
};

export async function getEmployees(params?: {
  employee_type?: 'internal' | 'external';
  status?: string;
  search?: string;
  client_id?: number;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Employee>> {
  const q = new URLSearchParams();
  if (params?.employee_type) q.set('employee_type', params.employee_type);
  if (params?.status) q.set('status', params.status);
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.client_id != null) q.set('client_id', String(params.client_id));
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/employees?${q}` : `${API_BASE}/employees`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch employees');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export async function getEmployee(id: number): Promise<Employee> {
  const res = await authFetch(`${API_BASE}/employees/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch employee');
  return data;
}

export async function createEmployee(body: Partial<Employee> & { full_name: string; email: string }): Promise<Employee> {
  const res = await authFetch(`${API_BASE}/employees`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create employee');
  return data;
}

export async function updateEmployee(id: number, body: Partial<Employee>): Promise<Employee> {
  const res = await authFetch(`${API_BASE}/employees/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update employee');
  return data;
}

export async function updateEmployeeInformation(id: number, body: EmployeeInformationPayload): Promise<Employee> {
  const res = await authFetch(`${API_BASE}/employees/${id}/employee-information`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update employee information');
  return data;
}

export async function updatePersonalInformation(id: number, body: EmployeePersonalPayload): Promise<Employee> {
  const res = await authFetch(`${API_BASE}/employees/${id}/personal-information`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update personal information');
  return data;
}

export async function updateFinancialInformation(id: number, body: EmployeeFinancialPayload): Promise<Employee> {
  const res = await authFetch(`${API_BASE}/employees/${id}/financial-information`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update financial information');
  return data;
}

export async function updateEmergencyContact(id: number, body: EmployeeEmergencyPayload): Promise<Employee> {
  const res = await authFetch(`${API_BASE}/employees/${id}/emergency-contact`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update emergency contact');
  return data;
}

export async function updateAddressInformation(id: number, body: EmployeeAddressPayload): Promise<Employee> {
  const res = await authFetch(`${API_BASE}/employees/${id}/address-information`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update address information');
  return data;
}

export async function getEmployeeEducation(employeeId: number): Promise<EmployeeEducation> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/education`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch employee education');
  return data ?? {};
}

export async function updateEmployeeEducation(employeeId: number, body: EmployeeEducation): Promise<EmployeeEducation> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/education`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update employee education');
  return data ?? {};
}

export async function getEmployeeFamily(employeeId: number): Promise<EmployeeFamily> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/family`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch employee family');
  return data ?? {};
}

export async function updateEmployeeFamily(employeeId: number, body: EmployeeFamily): Promise<EmployeeFamily> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/family`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update employee family');
  return data ?? {};
}

/** Download employees as XLSX for the given client (client_id required). Includes all employee data. */
export async function downloadEmployees(clientId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/employees/download?client_id=${clientId}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const rawFilename = parseFilenameFromDisposition(disposition) ?? `employees-client-${clientId}.xlsx`;
  const filename = rawFilename.toLowerCase().endsWith('.csv')
    ? `${rawFilename.slice(0, -4)}.xlsx`
    : rawFilename.toLowerCase().endsWith('.xlsx')
      ? rawFilename
      : `${rawFilename}.xlsx`;
  const xlsxBlob = new Blob([blob], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(xlsxBlob, filename);
}

// Employee Documents
export type EmployeeDocument = {
  id: number;
  tenant_id: number;
  employee_id: number;
  type: 'cv' | 'ktp' | 'other';
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: number;
  created_at: string;
};

export async function getEmployeeDocuments(employeeId: number): Promise<EmployeeDocument[]> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/documents`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch employee documents');
  return data.data ?? [];
}

export async function uploadEmployeeDocument(employeeId: number, file: File, type?: 'cv' | 'ktp' | 'other'): Promise<EmployeeDocument> {
  const formData = new FormData();
  formData.append('file', file);
  if (type) formData.append('type', type);
  
  const token = getAccessToken();
  const h: HeadersInit = {};
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/documents`, {
    method: 'POST',
    credentials: 'include',
    headers: h,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to upload document');
  return data;
}

export async function getEmployeeDocumentUrl(employeeId: number, documentId: number): Promise<string> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/documents/${documentId}/url`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get document URL');
  return data.url ?? '';
}

export async function deleteEmployeeDocument(employeeId: number, documentId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/documents/${documentId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to delete document');
}

// Contracts
export type Contract = {
  id: number;
  tenant_id: number;
  employee_id?: number;
  employee_name?: string;
  contract_number?: string;
  status: string;
  file_path?: string;
  contract_signed_url?: string; // Link to signed document by 3rd party (template-based only)
  template_ref?: string;
  sent_at?: string;
  signed_at?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
};

export async function getContracts(params?: {
  employee_id?: number;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Contract>> {
  const q = new URLSearchParams();
  if (params?.employee_id) q.set('employee_id', String(params.employee_id));
  if (params?.status) q.set('status', params.status);
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/contracts?${q}` : `${API_BASE}/contracts`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch contracts');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export async function getContract(id: number): Promise<Contract> {
  const res = await authFetch(`${API_BASE}/contracts/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch contract');
  return data;
}

/** Rendered HTML for the contract draft (embedded PKWT / Partnership layout). */
export async function getContractDraftHtml(id: number): Promise<string> {
  const res = await authFetch(`${API_BASE}/contracts/${id}/draft/html`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    let msg = 'Failed to load draft HTML';
    try {
      const data = await res.json();
      msg = data?.error?.message ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.text();
}

export async function createContract(body: Partial<Contract>): Promise<Contract> {
  const res = await authFetch(`${API_BASE}/contracts`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create contract');
  return data;
}

export async function uploadManualContract(
  file: File,
  options: {
    employee_id?: string;
    contract_number?: string;
    status?: string;
  }
): Promise<Contract> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.employee_id) formData.append('employee_id', options.employee_id);
  if (options.contract_number) formData.append('contract_number', options.contract_number);
  if (options.status) formData.append('status', options.status);
  
  // Get auth token for Authorization header
  const token = getAccessToken();
  const h: HeadersInit = {};
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  
  const res = await authFetch(`${API_BASE}/contracts/upload`, {
    method: 'POST',
    credentials: 'include',
    headers: h,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to upload contract');
  return data;
}

export async function updateContractFile(contractId: number, file: File): Promise<Contract> {
  const formData = new FormData();
  formData.append('file', file);
  
  // Get auth token for Authorization header
  const token = getAccessToken();
  const h: HeadersInit = {};
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  
  const res = await authFetch(`${API_BASE}/contracts/${contractId}/file`, {
    method: 'PUT',
    credentials: 'include',
    headers: h,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update contract file');
  return data;
}

export async function updateContract(id: number, body: Partial<Contract>): Promise<Contract> {
  const res = await authFetch(`${API_BASE}/contracts/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update contract');
  return data;
}

export async function getContractPresignedUrl(id: number): Promise<string> {
  const res = await authFetch(`${API_BASE}/contracts/${id}/url`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get URL');
  return data.url ?? '';
}

/** Download contract document via backend (streams from MinIO). Uses auth; triggers file save in browser. */
export async function downloadContractDocument(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/contracts/${id}/download`, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const filename = parseFilenameFromDisposition(disposition) ?? `contract-${id}.pdf`;
  downloadBlob(blob, filename);
}

/** Generate document from contract draft (HTML, viewable in browser; you can Print to PDF). Only for draft contracts. */
export async function generateContractDocument(contractId: number): Promise<Contract> {
  const res = await authFetch(`${API_BASE}/contracts/${contractId}/generate-pdf`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to generate document');
  return data;
}

/** Get the signing link for a contract (if it exists) */
export async function getContractSigningLink(contractId: number): Promise<{ link: any; url: string }> {
  const res = await authFetch(`${API_BASE}/contracts/${contractId}/signing-link`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get signing link');
  return data;
}

/** Create a signing link for a contract and return the signing URL (candidateId is the signer) */
export async function createContractSigningLink(contractId: number, candidateId: number): Promise<{ link: any; url: string }> {
  const res = await authFetch(`${API_BASE}/contracts/${contractId}/signing-link`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ candidate_id: candidateId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create signing link');
  return data;
}

// Paklaring
export type PaklaringDocument = {
  id: number;
  tenant_id: number;
  employee_id: number;
  file_path: string;
  last_working_date?: string | null;
  document_number?: string | null;
  generated_at: string;
  created_at: string;
  employee_name?: string;
};

export async function getPaklarings(params?: {
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<PaklaringDocument>> {
  const q = new URLSearchParams();
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/paklaring?${q}` : `${API_BASE}/paklaring`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch paklarings');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export async function getPaklaringByEmployee(employeeId: number): Promise<PaklaringDocument[]> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/paklaring`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export async function getMyPaklaring(): Promise<PaklaringDocument[]> {
  const res = await authFetch(`${API_BASE}/me/paklaring`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export async function getPaklaringPresignedUrl(id: number): Promise<string> {
  const res = await authFetch(`${API_BASE}/paklaring/${id}/url`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get URL');
  return data.url ?? '';
}

/** Generate and create a paklaring document for an employee (no file upload; document is auto-generated from template). */
export async function createPaklaringForEmployee(
  employeeId: number,
  last_working_date: string,
  document_number: string
): Promise<PaklaringDocument> {
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/paklaring`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ last_working_date, document_number: document_number.trim() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to generate paklaring');
  return data;
}

/** Upload a PDF file to generate/register a paklaring for an employee. */
export async function uploadPaklaringForEmployee(
  employeeId: number,
  file: File,
  last_working_date?: string | null
): Promise<PaklaringDocument> {
  const form = new FormData();
  form.append('file', file);
  if (last_working_date) form.append('last_working_date', last_working_date);
  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await authFetch(`${API_BASE}/employees/${employeeId}/paklaring/upload`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to upload paklaring');
  return data;
}

/** Delete a paklaring document and its file from storage. */
export async function deletePaklaring(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/paklaring/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? 'Failed to delete paklaring');
  }
}

// Warnings
export type WarningLetter = {
  id: number;
  tenant_id: number;
  employee_id: number;
  employee_name?: string;
  type: string;
  status?: string;
  document_number?: string | null;
  warning_date: string;
  duration_months?: number;
  description?: string;
  file_path?: string;
  company_policy_file_path?: string;
  additional_reference_file_path?: string;
  employee_acknowledged_at?: string;
  employee_acknowledged_by?: number;
  created_by?: number;
  created_at: string;
};

export async function getWarnings(params?: {
  employee_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<WarningLetter>> {
  const q = new URLSearchParams();
  if (params?.employee_id) q.set('employee_id', String(params.employee_id));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/warnings?${q}` : `${API_BASE}/warnings`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch warnings');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export async function getWarning(id: number): Promise<WarningLetter> {
  const res = await authFetch(`${API_BASE}/warnings/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch warning');
  return data;
}

export async function createWarning(body: {
  employee_id: number;
  type: string;
  warning_date: string;
  duration_months: number;
  description?: string;
  company_policy_file_path?: string;
  additional_reference_file_path?: string;
}): Promise<WarningLetter> {
  const res = await authFetch(`${API_BASE}/warnings`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create warning');
  return data;
}

/** Create warning with optional file uploads (Company Policy Reference, Additional Reference). Use FormData with fields: employee_id, type, warning_date, duration_months, description?, company_policy (file), additional_reference (file). */
export async function createWarningWithFiles(formData: FormData): Promise<WarningLetter> {
  const res = await authFetch(`${API_BASE}/warnings`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create warning');
  return data;
}

export async function getMyWarnings(): Promise<WarningLetter[]> {
  const res = await authFetch(`${API_BASE}/me/warnings`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

/** Get presigned URL for warning letter PDF (for preview in new tab). */
export async function getWarningPresignedUrl(id: number): Promise<string> {
  const res = await authFetch(`${API_BASE}/warnings/${id}/url`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Failed to get URL');
  }
  return (data as { url?: string }).url ?? '';
}

/** Get presigned URL for a warning attachment (company_policy or additional_reference). */
export async function getWarningAttachmentPresignedUrl(
  id: number,
  type: 'company_policy' | 'additional_reference'
): Promise<string> {
  const res = await authFetch(`${API_BASE}/warnings/${id}/attachments/${type}/url`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Failed to get URL');
  }
  return (data as { url?: string }).url ?? '';
}

/** Download warning letter PDF. Triggers file save in browser. */
export async function downloadWarningDocument(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/warnings/${id}/download`, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const filename = parseFilenameFromDisposition(disposition) ?? `warning-${id}.pdf`;
  downloadBlob(blob, filename);
}

/** Regenerate warning letter PDF from template. Returns updated warning. */
export async function generateWarningDocument(id: number): Promise<WarningLetter> {
  const res = await authFetch(`${API_BASE}/warnings/${id}/generate-pdf`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to generate document');
  return data;
}

/** Download a warning attachment (company_policy or additional_reference). */
export async function downloadWarningAttachment(
  id: number,
  type: 'company_policy' | 'additional_reference'
): Promise<void> {
  const res = await authFetch(`${API_BASE}/warnings/${id}/attachments/${type}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const filename = parseFilenameFromDisposition(disposition) ?? `warning-${id}-${type}.pdf`;
  downloadBlob(blob, filename);
}

/** Acknowledge (sign) a warning letter as the warned employee. */
export async function acknowledgeWarning(id: number): Promise<WarningLetter> {
  const res = await authFetch(`${API_BASE}/warnings/${id}/acknowledge`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Failed to acknowledge warning');
  }
  return data as WarningLetter;
}

// Payslips
export type Payslip = {
  id: number;
  tenant_id: number;
  employee_id: number;
  year: number;
  month: number;
  period_label: string;
  file_path: string;
  created_by?: number;
  created_at: string;
  employee_name?: string;
  identification_id?: string;
  employee_number?: string;
  client_name?: string;
};

export type PayslipUpload = {
  id: number;
  tenant_id: number;
  uploaded_by?: number;
  uploaded_by_name?: string;
  file_name?: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  created_at: string;
};

export type PayslipUploadRow = {
  id: number;
  payslip_upload_id: number;
  row_number: number;
  status: 'success' | 'error';
  error_message?: string;
  payslip_id?: number;
  created_at: string;
};

export type PayslipUploadDetail = {
  upload: PayslipUpload;
  rows: PayslipUploadRow[];
  total_rows: number;
  page: number;
  limit: number;
};

export type PayslipUploadListResult = {
  data: PayslipUpload[];
  total: number;
  page: number;
  limit: number;
};

/** List payslip CSV uploads for the current tenant (paginated). Default page=1, limit=20. */
export async function listPayslipUploads(opts?: { page?: number; limit?: number }): Promise<PayslipUploadListResult> {
  const params = new URLSearchParams();
  if (opts?.page != null) params.set('page', String(opts.page));
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  const q = params.toString() ? `?${params}` : '';
  const res = await authFetch(`${API_BASE}/payslip-uploads${q}`);
  const data = await res.json();
  if (!res.ok) throw new Error((data?.error as { message?: string })?.message ?? 'Failed to list uploads');
  return {
    data: Array.isArray(data.data) ? data.data : [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? 20,
  };
}

/** Get one payslip upload with paginated per-row results (page 1-based, default limit 50). */
export async function getPayslipUploadDetail(
  id: number,
  opts?: { page?: number; limit?: number }
): Promise<PayslipUploadDetail> {
  const params = new URLSearchParams();
  if (opts?.page != null) params.set('page', String(opts.page));
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  const q = params.toString() ? `?${params}` : '';
  const res = await authFetch(`${API_BASE}/payslip-uploads/${id}${q}`);
  const data = await res.json();
  if (!res.ok) throw new Error((data?.error as { message?: string })?.message ?? 'Failed to load upload detail');
  const payload = data.data as {
    upload?: PayslipUpload;
    rows?: PayslipUploadRow[];
    total_rows?: number;
    page?: number;
    limit?: number;
  };
  return {
    upload: payload?.upload ?? (payload as unknown as PayslipUpload),
    rows: Array.isArray(payload?.rows) ? payload.rows : [],
    total_rows: payload?.total_rows ?? 0,
    page: payload?.page ?? 1,
    limit: payload?.limit ?? 50,
  };
}

export async function getPayslips(params?: {
  employee_id?: number;
  year?: number;
  month?: number;
}): Promise<Payslip[]> {
  const q = new URLSearchParams();
  if (params?.employee_id) q.set('employee_id', String(params.employee_id));
  if (params?.year) q.set('year', String(params.year));
  if (params?.month) q.set('month', String(params.month));
  const url = q.toString() ? `${API_BASE}/payslips?${q}` : `${API_BASE}/payslips`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch payslips');
  return data.data ?? [];
}

export async function deletePayslipsByPeriod(year: number, month: number): Promise<{ deleted: number }> {
  const q = new URLSearchParams();
  q.set('year', String(year));
  q.set('month', String(month));
  const res = await authFetch(`${API_BASE}/payslips/period?${q.toString()}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? 'Failed to delete payslips for period');
  }
  return { deleted: data?.deleted ?? 0 };
}

export async function getMyPayslips(): Promise<Payslip[]> {
  const res = await authFetch(`${API_BASE}/me/payslips`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export type BulkUploadPayslipEntry = { employee_id: number; year: number; month: number };

export async function bulkUploadPayslips(
  entries: BulkUploadPayslipEntry[],
  files: File[]
): Promise<{ data: Payslip[]; count: number; failed: string[] }> {
  const form = new FormData();
  form.append('entries', JSON.stringify(entries));
  files.forEach((f) => form.append('files', f));
  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await authFetch(`${API_BASE}/payslips/bulk`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Bulk upload failed');
  return { data: data.data ?? [], count: data.count ?? 0, failed: data.failed ?? [] };
}

/** Upload a CSV file containing multiple payslips (matched by employee NIK). */
export async function bulkUploadPayslipsFromCSV(
  file: File
): Promise<{ data: Payslip[]; count: number; failed: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await authFetch(`${API_BASE}/payslip-uploads/bulk-csv`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Bulk upload failed');
  return { data: data.data ?? [], count: data.count ?? 0, failed: data.failed ?? [] };
}

/** Download the standard payslip CSV template. */
export async function downloadPayslipCSVTemplate(): Promise<Blob> {
  const res = await authFetch(`${API_BASE}/payslip-uploads/template-csv`, {
    method: 'GET',
  });
  if (!res.ok) {
    const data = await res.text();
    throw new Error(data || 'Failed to download template');
  }
  return await res.blob();
}

export async function getPayslipPresignedUrl(id: number): Promise<string> {
  const res = await authFetch(`${API_BASE}/payslips/${id}/url`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get download URL');
  return data.url;
}

/** Download payslip PDF via backend (streams with application/pdf and .pdf filename so browser saves as PDF). */
export async function downloadPayslipDocument(id: number, fallbackFilename?: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/payslips/${id}/download`, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const filename = parseFilenameFromDisposition(disposition) ?? fallbackFilename ?? `payslip-${id}.pdf`;
  downloadBlob(blob, filename);
}

// Tickets
export type Ticket = {
  id: number;
  tenant_id: number;
  author_id: number;
  author_name?: string;
  department_id: number;
  assignee_id?: number;
  assignee_name?: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name?: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export async function getTickets(params?: {
  department_id?: number;
  status?: string;
  author_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Ticket>> {
  const q = new URLSearchParams();
  if (params?.department_id) q.set('department_id', String(params.department_id));
  if (params?.status) q.set('status', params.status ?? '');
  if (params?.author_id) q.set('author_id', String(params.author_id));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/tickets?${q}` : `${API_BASE}/tickets`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch tickets');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export async function getTicket(id: number): Promise<{ ticket: Ticket; messages: TicketMessage[] }> {
  const res = await authFetch(`${API_BASE}/tickets/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch ticket');
  return { ticket: data.ticket, messages: data.messages ?? [] };
}

export async function createTicket(body: {
  department_id: number;
  subject: string;
  message: string;
}): Promise<Ticket> {
  const res = await authFetch(`${API_BASE}/tickets`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create ticket');
  return data;
}

export async function updateTicketStatus(id: number, status: string): Promise<Ticket> {
  const res = await authFetch(`${API_BASE}/tickets/${id}/status`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update status');
  return data;
}

export async function replyTicket(id: number, body: string, isInternal: boolean): Promise<TicketMessage> {
  const res = await authFetch(`${API_BASE}/tickets/${id}/reply`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ body, is_internal: isInternal }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to reply');
  return data;
}

export async function getMyTickets(): Promise<Ticket[]> {
  const res = await authFetch(`${API_BASE}/me/tickets`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export async function getDepartmentNewTickets(): Promise<Ticket[]> {
  const res = await authFetch(`${API_BASE}/tickets/department/new`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export async function assignTicket(id: number): Promise<Ticket> {
  const res = await authFetch(`${API_BASE}/tickets/${id}/assign`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to assign');
  return data;
}

// FAQ
export type FAQCategory = {
  id: number;
  tenant_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FAQ = {
  id: number;
  tenant_id: number;
  category_id?: number;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function getFAQCategories(): Promise<FAQCategory[]> {
  const res = await authFetch(`${API_BASE}/faq/categories`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch categories');
  return data.data ?? [];
}

export async function getFAQ(id: number): Promise<FAQ> {
  const res = await authFetch(`${API_BASE}/faq/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch FAQ');
  return data;
}

export async function getFAQs(categoryId?: number): Promise<FAQ[]> {
  const url = categoryId
    ? `${API_BASE}/faq?category_id=${categoryId}`
    : `${API_BASE}/faq`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch FAQs');
  return data.data ?? [];
}

export async function searchFAQ(q: string): Promise<FAQ[]> {
  const res = await authFetch(`${API_BASE}/faq/search?q=${encodeURIComponent(q)}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to search');
  return data.data ?? [];
}

export async function createFAQCategory(body: { name: string; sort_order?: number }): Promise<FAQCategory> {
  const res = await authFetch(`${API_BASE}/faq/categories`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create category');
  return data;
}

export async function updateFAQCategory(
  id: number,
  body: { name: string; sort_order?: number }
): Promise<FAQCategory> {
  const res = await authFetch(`${API_BASE}/faq/categories/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update category');
  return data;
}

export async function deleteFAQCategory(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/faq/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete category');
  }
}

export async function createFAQ(body: {
  category_id?: number;
  question: string;
  answer: string;
  sort_order?: number;
}): Promise<FAQ> {
  const res = await authFetch(`${API_BASE}/faq`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create FAQ');
  return data;
}

export async function updateFAQ(
  id: number,
  body: { category_id?: number; question: string; answer: string; sort_order?: number }
): Promise<FAQ> {
  const res = await authFetch(`${API_BASE}/faq/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update FAQ');
  return data;
}

export async function deleteFAQ(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/faq/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete FAQ');
  }
}

// Announcements
export type Announcement = {
  id: number;
  tenant_id: number;
  client_id?: number | null;
  title: string;
  body: string;
  published_from?: string | null;
  published_until?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementCreate = {
  client_id?: number | null;
  title: string;
  body: string;
  published_from?: string | null;
  published_until?: string | null;
};

export type AnnouncementUpdate = {
  client_id?: number | null;
  title?: string;
  body?: string;
  published_from?: string | null;
  published_until?: string | null;
};

export type AnnouncementsResponse = {
  data: Announcement[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export async function getAnnouncements(params?: { publishedOnly?: boolean; page?: number; per_page?: number }): Promise<AnnouncementsResponse> {
  const search = new URLSearchParams();
  if (params?.publishedOnly) search.set('published_only', 'true');
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.per_page != null) search.set('per_page', String(params.per_page));
  const q = search.toString() ? `?${search.toString()}` : '';
  const res = await authFetch(`${API_BASE}/announcements${q}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch announcements');
  return {
    data: data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    per_page: data.per_page ?? 10,
    total_pages: data.total_pages ?? 1,
  };
}

export async function getAnnouncement(id: number): Promise<Announcement> {
  const res = await authFetch(`${API_BASE}/announcements/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch announcement');
  return data;
}

export async function createAnnouncement(body: AnnouncementCreate): Promise<Announcement> {
  const res = await authFetch(`${API_BASE}/announcements`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create announcement');
  return data;
}

export async function updateAnnouncement(id: number, body: AnnouncementUpdate): Promise<Announcement> {
  const res = await authFetch(`${API_BASE}/announcements/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update announcement');
  return data;
}

export async function deleteAnnouncement(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/announcements/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete announcement');
  }
}

// Notifications
export type Notification = {
  id: number;
  tenant_id?: number;
  user_id: number;
  type: string;
  title: string;
  body?: string;
  link_url?: string;
  read_at?: string;
  created_at: string;
};

export async function getNotifications(params?: { unread?: boolean; limit?: number }): Promise<Notification[]> {
  const queryParams = new URLSearchParams();
  if (params?.unread) queryParams.set('unread', 'true');
  if (params?.limit) queryParams.set('limit', String(params.limit));
  const res = await authFetch(`${API_BASE}/notifications?${queryParams}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch notifications');
  return data.data || [];
}

export async function getNotification(id: number): Promise<Notification> {
  const res = await authFetch(`${API_BASE}/notifications/${id}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch notification');
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await authFetch(`${API_BASE}/notifications/unread-count`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch unread count');
  return data.count || 0;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to mark notification as read');
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const res = await authFetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to mark all notifications as read');
  }
}

export async function deleteNotification(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete notification');
  }
}

// Dashboard
export type DashboardStats = {
  role: string;
  employee_type?: 'internal' | 'external';
  widgets: {
    [key: string]: {
      title: string;
      data: any;
      permissions: string[];
    };
  };
  quick_actions: {
    label: string;
    path: string;
    permission: string;
  }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await authFetch(`${API_BASE}/dashboard/stats`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch dashboard stats');
  return data;
}

export async function getMyEmployee(): Promise<Employee | null> {
  const res = await authFetch(`${API_BASE}/me/employee`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) {
    // Employee record might not exist for all users
    if (res.status === 404) return null;
    throw new Error(data?.error?.message ?? 'Failed to fetch employee record');
  }
  return data;
}

/** Onboarding declaration checklist for the current user (My Profile). */
export type MyOnboardingDeclarationsResponse = {
  declaration_checklist: DeclarationChecklistData | null;
  submitted_at?: string | null;
};

export async function getMyOnboardingDeclarations(): Promise<MyOnboardingDeclarationsResponse> {
  const res = await authFetch(`${API_BASE}/me/onboarding-declarations`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load onboarding declarations');
  return data as MyOnboardingDeclarationsResponse;
}
