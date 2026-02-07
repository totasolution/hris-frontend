// In production (e.g. Vercel), set VITE_API_BASE to API host (e.g. https://ponot.sigmasolusiservis.com). Local dev uses relative /api/v1 + Vite proxy.
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
  const res = await fetch(`${API_BASE}/tenant/company-info`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch company info');
  return data;
}

export async function updateTenantCompanyInfo(body: TenantCompanyInfo): Promise<TenantCompanyInfo> {
  const res = await fetch(`${API_BASE}/tenant/company-info`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
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
  const res = await fetch(`${API_BASE}/auth/refresh`, {
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
  const res = await fetch(`${API_BASE}/departments`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch departments');
  return data.data ?? [];
}

export async function getDepartment(id: number): Promise<Department> {
  const res = await fetch(`${API_BASE}/departments/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch department');
  return data;
}

export async function createDepartment(body: { name: string; code?: string; parent_id?: number }): Promise<Department> {
  const res = await fetch(`${API_BASE}/departments`, {
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
  const res = await fetch(`${API_BASE}/departments/${id}`, {
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
  const res = await fetch(`${API_BASE}/departments/${id}`, {
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
  const res = await fetch(`${API_BASE}/clients`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch clients');
  return data.data ?? [];
}

export async function getClient(id: number): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch client');
  return data;
}

export async function createClient(body: Partial<Client> & { name: string }): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients`, {
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
  const res = await fetch(`${API_BASE}/clients/${id}`, {
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
  const res = await fetch(`${API_BASE}/clients/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete client');
  }
}

// Projects
export type Project = {
  id: number;
  tenant_id: number;
  client_id: number;
  name: string;
  client_name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function getProjects(clientId?: number): Promise<Project[]> {
  const url = clientId ? `${API_BASE}/projects?client_id=${clientId}` : `${API_BASE}/projects`;
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch projects');
  return data.data ?? [];
}

export async function getProject(id: number): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch project');
  return data;
}

export async function createProject(body: Partial<Project> & { name: string; client_id: number }): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create project');
  return data;
}

export async function updateProject(id: number, body: Partial<Project> & { name: string; client_id: number }): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update project');
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete project');
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
  const res = await fetch(`${API_BASE}/permissions`, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/roles`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch roles');
  return data.data ?? [];
}

export async function getRole(id: number): Promise<Role> {
  const res = await fetch(`${API_BASE}/roles/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch role');
  return data;
}

export async function createRole(body: { name: string; slug?: string; description?: string }): Promise<Role> {
  const res = await fetch(`${API_BASE}/roles`, {
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
  const res = await fetch(`${API_BASE}/roles/${id}`, {
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
  const res = await fetch(`${API_BASE}/roles/${id}`, {
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
  const res = await fetch(`${API_BASE}/roles/${roleId}/permissions`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch role permissions');
  return data.permission_ids ?? [];
}

export async function setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/roles/${roleId}/permissions`, {
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
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/users/${id}`, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/users`, {
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
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update user');
  return data;
}

// Candidates
export type Candidate = {
  id: number;
  tenant_id: number;
  client_id?: number;
  project_id?: number;
  full_name: string;
  email: string;
  phone?: string;
  screening_status: string;
  screening_notes?: string;
  screening_rating?: number;
  submitted_to_client_at?: string;
  created_by?: number;
  pic_name?: string;
  client_name?: string;
  project_name?: string;
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
  project_id?: number;
  client_id?: number;
  status?: string;
  search?: string;
  created_by?: number;
  my_active_only?: boolean;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Candidate>> {
  const q = new URLSearchParams();
  if (params?.project_id) q.set('project_id', String(params.project_id));
  if (params?.client_id) q.set('client_id', String(params.client_id));
  if (params?.status) q.set('status', params.status);
  if (params?.created_by) q.set('created_by', String(params.created_by));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.my_active_only) q.set('my_active_only', 'true');
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/candidates?${q}` : `${API_BASE}/candidates`;
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/candidates/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch candidate');
  return data;
}

export async function createCandidate(body: {
  project_id?: number;
  full_name: string;
  email: string;
  phone?: string;
}): Promise<Candidate> {
  const res = await fetch(`${API_BASE}/candidates`, {
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
    project_id: number;
    full_name: string;
    email: string;
    phone: string;
    screening_status: string;
    screening_notes: string;
    screening_rating: number;
  }>
): Promise<Candidate> {
  const res = await fetch(`${API_BASE}/candidates/${id}`, {
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
  const res = await fetch(`${API_BASE}/candidates/${id}`, {
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
  by_project: { project_id?: number; project_name: string; count: number }[];
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
  project_id?: number;
}): Promise<RecruitmentStatistics> {
  const q = new URLSearchParams();
  if (params?.client_id) q.set('client_id', String(params.client_id));
  if (params?.project_id) q.set('project_id', String(params.project_id));
  const url = q.toString() ? `${API_BASE}/recruitment/statistics?${q}` : `${API_BASE}/recruitment/statistics`;
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch recruitment statistics');
  return data;
}

export async function getCandidateDocuments(candidateId: number): Promise<CandidateDocument[]> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/documents`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch documents');
  return data.data ?? [];
}

export async function uploadCandidateDocument(candidateId: number, file: File, type?: 'cv' | 'other'): Promise<CandidateDocument> {
  const form = new FormData();
  form.append('file', file);
  if (type) form.append('type', type);
  const token = getAccessToken();
  const h: HeadersInit = {};
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/documents`, {
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
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/documents/${documentId}/url`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get document URL');
  return data.url ?? '';
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
  address?: string;
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
  locked_at?: string;
  submitted_for_hrd_at?: string;
  hrd_approved_at?: string;
  hrd_rejected_at?: string;
  hrd_comment?: string;
  created_at: string;
  updated_at: string;
};

export async function createOnboardingLink(candidateId: number): Promise<OnboardingLink> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/onboarding-link`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create link');
  return data;
}

export async function getOnboardingByToken(token: string): Promise<{ link: OnboardingLink; candidate: Candidate }> {
  const res = await fetch(`${API_BASE}/public/onboarding/${token}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Link not found or expired');
  return data;
}

export async function submitOnboardingForm(token: string, formData: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_BASE}/public/onboarding/${token}/submit`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Submit failed');
}

export type KTPExtractedData = {
  full_name?: string;
  id_number?: string;
  birth_place?: string;
  birth_date?: string;
  address?: string;
  gender?: string;
  religion?: string;
  marital_status?: string;
  confidence?: number;
};

export type UploadDocumentResponse = {
  document: any;
  extracted_data?: KTPExtractedData;
  ocr_confidence?: number;
};

export async function uploadOnboardingDocument(token: string, file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/public/onboarding/${token}/upload-document`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Upload failed');
  return data;
}

export async function getOnboardingFormByCandidate(candidateId: number): Promise<OnboardingFormData> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/onboarding-form`, {
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
  | 'id_number' | 'address' | 'place_of_birth' | 'date_of_birth' | 'gender' | 'religion' | 'marital_status'
  | 'bank_name' | 'bank_account_number' | 'bank_account_holder' | 'npwp_number'
  | 'emergency_contact_name' | 'emergency_contact_relationship' | 'emergency_contact_phone'
>;

export async function updateOnboardingFormByCandidate(
  candidateId: number,
  payload: OnboardingFormDataEditable
): Promise<OnboardingFormData> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/onboarding-form`, {
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
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/employment-terms`, {
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
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/onboarding-link`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch link');
  return data;
}

export async function submitCandidateToClient(candidateId: number): Promise<Candidate> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/submit-to-client`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to submit candidate to client');
  return data;
}

export async function requestContract(candidateId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/request-contract`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to request contract');
}

export async function approveCandidate(candidateId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to approve');
}

export async function rejectCandidate(candidateId: number, comment: string): Promise<void> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to reject');
}

export async function hireCandidate(candidateId: number): Promise<{ employee: any; message: string }> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/hire`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to hire candidate');
  return data;
}

export async function getPendingHRDList(): Promise<OnboardingFormData[]> {
  const res = await fetch(`${API_BASE}/onboarding/pending-hrd`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
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
  project_id?: number;
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
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/employees/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch employee');
  return data;
}

export async function createEmployee(body: Partial<Employee> & { full_name: string; email: string }): Promise<Employee> {
  const res = await fetch(`${API_BASE}/employees`, {
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
  const res = await fetch(`${API_BASE}/employees/${id}`, {
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
  const res = await fetch(`${API_BASE}/employees/${employeeId}/documents`, {
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
  
  const res = await fetch(`${API_BASE}/employees/${employeeId}/documents`, {
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
  const res = await fetch(`${API_BASE}/employees/${employeeId}/documents/${documentId}/url`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get document URL');
  return data.url ?? '';
}

export async function deleteEmployeeDocument(employeeId: number, documentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/employees/${employeeId}/documents/${documentId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to delete document');
}

// Contract Templates
export type ContractTemplateType = 'pkwt' | 'pkwtt' | 'internship' | 'freelance' | 'other';

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
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch templates');
  return data.data ?? [];
}

export async function getContractTemplate(id: number): Promise<ContractTemplate> {
  const res = await fetch(`${API_BASE}/contract-templates/${id}`, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/contract-templates`, {
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
  const res = await fetch(`${API_BASE}/contract-templates/${id}`, {
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
  const res = await fetch(`${API_BASE}/contract-templates/${id}`, {
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
  const res = await fetch(`${API_BASE}/contract-templates/placeholders`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch placeholders');
  return data.data ?? [];
}

export async function previewContractTemplate(id: number, values: Record<string, string>): Promise<string> {
  const res = await fetch(`${API_BASE}/contract-templates/${id}/preview`, {
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
  candidate_id?: number;
  employee_id?: number;
  candidate_name?: string;
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
  candidate_id?: number;
  employee_id?: number;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Contract>> {
  const q = new URLSearchParams();
  if (params?.candidate_id) q.set('candidate_id', String(params.candidate_id));
  if (params?.employee_id) q.set('employee_id', String(params.employee_id));
  if (params?.status) q.set('status', params.status);
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.page) q.set('page', String(params.page));
  if (params?.per_page) q.set('per_page', String(params.per_page));
  const url = q.toString() ? `${API_BASE}/contracts?${q}` : `${API_BASE}/contracts`;
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/contracts/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch contract');
  return data;
}

export async function createContract(body: Partial<Contract>): Promise<Contract> {
  const res = await fetch(`${API_BASE}/contracts`, {
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
    candidate_id?: string;
    employee_id?: string;
    contract_number?: string;
    status?: string;
  }
): Promise<Contract> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.candidate_id) formData.append('candidate_id', options.candidate_id);
  if (options.employee_id) formData.append('employee_id', options.employee_id);
  if (options.contract_number) formData.append('contract_number', options.contract_number);
  if (options.status) formData.append('status', options.status);
  
  // Get auth token for Authorization header
  const token = getAccessToken();
  const h: HeadersInit = {};
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/contracts/upload`, {
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
  
  const res = await fetch(`${API_BASE}/contracts/${contractId}/file`, {
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
  const res = await fetch(`${API_BASE}/contracts/${id}`, {
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
  const res = await fetch(`${API_BASE}/contracts/${id}/url`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get URL');
  return data.url ?? '';
}

/** Generate document from contract draft (HTML, viewable in browser; you can Print to PDF). Only for draft contracts. */
export async function generateContractDocument(contractId: number): Promise<Contract> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/generate-pdf`, {
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
  const res = await fetch(`${API_BASE}/contracts/${contractId}/signing-link`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get signing link');
  return data;
}

/** Create a signing link for a contract and return the signing URL */
export async function createContractSigningLink(contractId: number): Promise<{ link: any; url: string }> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/signing-link`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
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
  generated_at: string;
  created_at: string;
};

export async function getPaklaringByEmployee(employeeId: number): Promise<PaklaringDocument[]> {
  const res = await fetch(`${API_BASE}/employees/${employeeId}/paklaring`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export async function getMyPaklaring(): Promise<PaklaringDocument[]> {
  const res = await fetch(`${API_BASE}/me/paklaring`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export async function getPaklaringPresignedUrl(id: number): Promise<string> {
  const res = await fetch(`${API_BASE}/paklaring/${id}/url`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to get URL');
  return data.url ?? '';
}

export async function createPaklaringForEmployee(employeeId: number, file_path: string): Promise<PaklaringDocument> {
  const res = await fetch(`${API_BASE}/employees/${employeeId}/paklaring`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ file_path }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create');
  return data;
}

// Warnings
export type WarningLetter = {
  id: number;
  tenant_id: number;
  employee_id: number;
  type: string;
  warning_date: string;
  description?: string;
  file_path?: string;
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
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/warnings/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch warning');
  return data;
}

export async function createWarning(body: {
  employee_id: number;
  type: string;
  warning_date: string;
  description?: string;
}): Promise<WarningLetter> {
  const res = await fetch(`${API_BASE}/warnings`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create warning');
  return data;
}

export async function getMyWarnings(): Promise<WarningLetter[]> {
  const res = await fetch(`${API_BASE}/me/warnings`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

// Tickets
export type Ticket = {
  id: number;
  tenant_id: number;
  author_id: number;
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
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/tickets/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch ticket');
  return { ticket: data.ticket, messages: data.messages ?? [] };
}

export async function createTicket(body: {
  department_id: number;
  subject: string;
  message: string;
}): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets`, {
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
  const res = await fetch(`${API_BASE}/tickets/${id}/status`, {
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
  const res = await fetch(`${API_BASE}/tickets/${id}/reply`, {
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
  const res = await fetch(`${API_BASE}/me/tickets`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export async function getDepartmentNewTickets(): Promise<Ticket[]> {
  const res = await fetch(`${API_BASE}/tickets/department/new`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch');
  return data.data ?? [];
}

export async function assignTicket(id: number): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets/${id}/assign`, {
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
  const res = await fetch(`${API_BASE}/faq/categories`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch categories');
  return data.data ?? [];
}

export async function getFAQ(id: number): Promise<FAQ> {
  const res = await fetch(`${API_BASE}/faq/${id}`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch FAQ');
  return data;
}

export async function getFAQs(categoryId?: number): Promise<FAQ[]> {
  const url = categoryId
    ? `${API_BASE}/faq?category_id=${categoryId}`
    : `${API_BASE}/faq`;
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch FAQs');
  return data.data ?? [];
}

export async function searchFAQ(q: string): Promise<FAQ[]> {
  const res = await fetch(`${API_BASE}/faq/search?q=${encodeURIComponent(q)}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to search');
  return data.data ?? [];
}

export async function createFAQCategory(body: { name: string; sort_order?: number }): Promise<FAQCategory> {
  const res = await fetch(`${API_BASE}/faq/categories`, {
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
  const res = await fetch(`${API_BASE}/faq/categories/${id}`, {
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
  const res = await fetch(`${API_BASE}/faq/categories/${id}`, {
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
  const res = await fetch(`${API_BASE}/faq`, {
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
  const res = await fetch(`${API_BASE}/faq/${id}`, {
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
  const res = await fetch(`${API_BASE}/faq/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message ?? 'Failed to delete FAQ');
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
  const res = await fetch(`${API_BASE}/notifications?${queryParams}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch notifications');
  return data.data || [];
}

export async function getNotification(id: number): Promise<Notification> {
  const res = await fetch(`${API_BASE}/notifications/${id}`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch notification');
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    credentials: 'include',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch unread count');
  return data.count || 0;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
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
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
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
  const res = await fetch(`${API_BASE}/notifications/${id}`, {
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
  const res = await fetch(`${API_BASE}/dashboard/stats`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to fetch dashboard stats');
  return data;
}

export async function getMyEmployee(): Promise<Employee | null> {
  const res = await fetch(`${API_BASE}/me/employee`, { credentials: 'include', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) {
    // Employee record might not exist for all users
    if (res.status === 404) return null;
    throw new Error(data?.error?.message ?? 'Failed to fetch employee record');
  }
  return data;
}
