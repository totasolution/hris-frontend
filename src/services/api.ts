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
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function getClients(): Promise<Client[]> {
  const res = await authFetch(`${API_BASE}/clients`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch clients');
  return data.data ?? [];
}

export async function getClient(id: number): Promise<Client> {
  const res = await authFetch(`${API_BASE}/clients/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch client');
  return data;
}

export async function createClient(body: Partial<Client> & { name: string }): Promise<Client> {
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
export async function getUsers(params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse<User>> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  if (params?.search?.trim()) q.set('search', params.search.trim());
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
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Candidate>> {
  const q = new URLSearchParams();
  if (params?.client_id) q.set('client_id', String(params.client_id));
  if (params?.status) q.set('status', params.status);
  if (params?.created_by) q.set('created_by', String(params.created_by));
  if (params?.search?.trim()) q.set('search', params.search.trim());
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
  totals: {
    all: number;
    active: number;
    hired: number;
    rejected: number;
    new_this_month: number;
    hired_this_month: number;
  };
};

export async function getRecruitmentStatistics(params?: {
  client_id?: number;
  year?: number;
  month?: number;
}): Promise<RecruitmentStatistics> {
  const q = new URLSearchParams();
  if (params?.client_id) q.set('client_id', String(params.client_id));
  if (params?.year) q.set('year', String(params.year));
  if (params?.month) q.set('month', String(params.month));
  const url = q.toString() ? `${API_BASE}/recruitment/statistics?${q}` : `${API_BASE}/recruitment/statistics`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch recruitment statistics');
  return data;
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
  address?: string;           // KTP/ID address
  domicile_address?: string;  // Domicile address (alamat domisili)
  place_of_birth?: string;
  date_of_birth?: string;
  gender?: string;
  religion?: string;
  marital_status?: string;

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

export async function uploadOnboardingDocument(token: string, file: File, type: 'ktp' | 'kk' | 'skck' = 'ktp'): Promise<UploadDocumentResponse> {
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
  | 'id_number' | 'address' | 'domicile_address' | 'place_of_birth' | 'date_of_birth' | 'gender' | 'religion' | 'marital_status'
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

export async function approveCandidate(candidateId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/candidates/${candidateId}/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
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
  token: string;
  created_at: string;
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
  employee_number?: string;
  department_id?: number;
  client_id?: number;
  full_name: string;
  email: string;
  company_email?: string;
  phone?: string;
  status: string;
  hire_date?: string;
  join_date?: string;
  termination_type?: string;
  termination_date?: string;
  termination_reason?: string;
  // Personal Information
  identification_id?: string;
  id_expired_date?: string;
  birthdate?: string;
  place_of_birth?: string;
  gender?: string;
  marital_status?: string;
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
  emergency_phone?: string;
  // Address
  address?: string;
  village?: string;
  sub_district?: string;
  district?: string;
  province?: string;
  zip_code?: string;
  // Role & placement
  position?: string;
  placement_location?: string;
  // BPJS (Indonesian social security)
  bpjstk_id?: string;  // BPJS Tenaga Kerja ID
  bpjsks_id?: string;  // BPJS Kesehatan ID
  created_at: string;
  updated_at: string;
};

export async function getEmployees(params?: {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Employee>> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search?.trim()) q.set('search', params.search.trim());
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

// Contract Templates
export type ContractTemplateType = 'pkwt' | 'pkwtt' | 'partnership' | 'internship' | 'freelance' | 'other' | 'payslip' | 'paklaring' | 'warning_sp1' | 'warning_sp2' | 'warning_sp3';

export type ContractTemplate = {
  id: number;
  tenant_id: number;
  name: string;
  contract_type: ContractTemplateType;
  description?: string;
  content: string;
  placeholders?: string[];
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
};

export async function getContractTemplates(params?: {
  contract_type?: ContractTemplateType;
  active_only?: boolean;
}): Promise<ContractTemplate[]> {
  const q = new URLSearchParams();
  if (params?.contract_type) q.set('contract_type', params.contract_type);
  if (params?.active_only) q.set('active_only', 'true');
  const url = q.toString() ? `${API_BASE}/contract-templates?${q}` : `${API_BASE}/contract-templates`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch templates');
  return data.data ?? [];
}

export async function getContractTemplate(id: number): Promise<ContractTemplate> {
  const res = await authFetch(`${API_BASE}/contract-templates/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch template');
  return data;
}

export async function createContractTemplate(body: {
  name: string;
  contract_type: ContractTemplateType;
  description?: string;
  content: string;
  is_active?: boolean;
}): Promise<ContractTemplate> {
  const res = await authFetch(`${API_BASE}/contract-templates`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create template');
  return data;
}

export async function updateContractTemplate(
  id: number,
  body: {
    name?: string;
    contract_type?: ContractTemplateType;
    description?: string;
    content?: string;
    is_active?: boolean;
  }
): Promise<ContractTemplate> {
  const res = await authFetch(`${API_BASE}/contract-templates/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update template');
  return data;
}

export async function deleteContractTemplate(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/contract-templates/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete template');
  }
}

export async function getContractTemplatePlaceholders(): Promise<string[]> {
  const res = await authFetch(`${API_BASE}/contract-templates/placeholders`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch placeholders');
  return data.data ?? [];
}

export async function previewContractTemplate(id: number, values: Record<string, string>): Promise<string> {
  const res = await authFetch(`${API_BASE}/contract-templates/${id}/preview`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(values),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to preview template');
  }
  return res.text();
}

// Contracts
export type Contract = {
  id: number;
  tenant_id: number;
  employee_id?: number;
  employee_name?: string;
  template_id?: number;
  contract_number?: string;
  status: string;
  file_path?: string;
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
  type: string;
  document_number?: string | null;
  warning_date: string;
  duration_months?: number;
  description?: string;
  file_path?: string;
  company_policy_file_path?: string;
  additional_reference_file_path?: string;
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
};

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
  const res = await authFetch(`${API_BASE}/payslips/bulk-csv`, {
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
  const res = await authFetch(`${API_BASE}/payslips/template-csv`, {
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
  title: string;
  body: string;
  published_from?: string | null;
  published_until?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementCreate = {
  title: string;
  body: string;
  published_from?: string | null;
  published_until?: string | null;
};

export type AnnouncementUpdate = {
  title?: string;
  body?: string;
  published_from?: string | null;
  published_until?: string | null;
};

export async function getAnnouncements(params?: { publishedOnly?: boolean }): Promise<Announcement[]> {
  const q = params?.publishedOnly ? '?published_only=true' : '';
  const res = await authFetch(`${API_BASE}/announcements${q}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch announcements');
  return data.data ?? [];
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
