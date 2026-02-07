import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import AppLayout from './components/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ClientFormPage from './pages/ClientFormPage';
import ClientsPage from './pages/ClientsPage';
import DepartmentFormPage from './pages/DepartmentFormPage';
import DepartmentsPage from './pages/DepartmentsPage';
import LoginPage from './pages/LoginPage';
import ProjectFormPage from './pages/ProjectFormPage';
import ProjectsPage from './pages/ProjectsPage';
import RoleFormPage from './pages/RoleFormPage';
import RolePermissionsPage from './pages/RolePermissionsPage';
import RolesPage from './pages/RolesPage';
import UserFormPage from './pages/UserFormPage';
import UsersPage from './pages/UsersPage';
import CandidatesPage from './pages/CandidatesPage';
import RecruitmentBoardPage from './pages/RecruitmentBoardPage';
import RecruitmentStatisticsPage from './pages/RecruitmentStatisticsPage';
import CandidateFormPage from './pages/CandidateFormPage';
import CandidateDetailPage from './pages/CandidateDetailPage';
import OnboardingFormPage from './pages/OnboardingFormPage';
import ContractSigningPage from './pages/ContractSigningPage';
import PendingHRDPage from './pages/PendingHRDPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import ContractsPage from './pages/ContractsPage';
import ContractFormPage from './pages/ContractFormPage';
import ContractTemplatesPage from './pages/ContractTemplatesPage';
import ContractTemplateFormPage from './pages/ContractTemplateFormPage';
import WarningsPage from './pages/WarningsPage';
import WarningFormPage from './pages/WarningFormPage';
import MyDocumentsPage from './pages/MyDocumentsPage';
import MySpacePage from './pages/MySpacePage';
import MyWarningsPage from './pages/MyWarningsPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import NewTicketPage from './pages/NewTicketPage';
import MyTicketsPage from './pages/MyTicketsPage';
import FAQPage from './pages/FAQPage';
import FAQAdminPage from './pages/FAQAdminPage';
import FAQFormPage from './pages/FAQFormPage';
import NotificationsPage from './pages/NotificationsPage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding/:token" element={<OnboardingFormPage />} />
      <Route path="/public/contracts/sign/:token" element={<ContractSigningPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="departments/new" element={<DepartmentFormPage />} />
        <Route path="departments/:id/edit" element={<DepartmentFormPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<ClientFormPage />} />
        <Route path="clients/:id/edit" element={<ClientFormPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="projects/:id/edit" element={<ProjectFormPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="roles/new" element={<RoleFormPage />} />
        <Route path="roles/:id/edit" element={<RoleFormPage />} />
        <Route path="roles/:id/permissions" element={<RolePermissionsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/new" element={<UserFormPage />} />
        <Route path="users/:id/edit" element={<UserFormPage />} />
        <Route path="recruitment/board" element={<RecruitmentBoardPage />} />
        <Route path="recruitment/statistics" element={<RecruitmentStatisticsPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="candidates/new" element={<CandidateFormPage />} />
        <Route path="candidates/:id" element={<CandidateDetailPage />} />
        <Route path="candidates/:id/edit" element={<CandidateFormPage />} />
        <Route path="onboarding/pending-hrd" element={<PendingHRDPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/new" element={<EmployeeFormPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="employees/:id/edit" element={<EmployeeFormPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="contracts/new" element={<ContractFormPage />} />
        <Route path="contracts/:id/edit" element={<ContractFormPage />} />
        <Route path="contract-templates" element={<ContractTemplatesPage />} />
        <Route path="contract-templates/new" element={<ContractTemplateFormPage />} />
        <Route path="contract-templates/:id/edit" element={<ContractTemplateFormPage />} />
        <Route path="company-settings" element={<CompanySettingsPage />} />
        <Route path="warnings" element={<WarningsPage />} />
        <Route path="warnings/new" element={<WarningFormPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<NewTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="faq/admin" element={<FAQAdminPage />} />
        <Route path="faq/new" element={<FAQFormPage />} />
        <Route path="faq/:id/edit" element={<FAQFormPage />} />
        <Route path="me" element={<MySpacePage />} />
        <Route path="me/documents" element={<MyDocumentsPage />} />
        <Route path="me/warnings" element={<MyWarningsPage />} />
        <Route path="me/tickets" element={<MyTicketsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
