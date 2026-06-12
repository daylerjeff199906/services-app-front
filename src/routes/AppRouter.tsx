import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthGuard } from "@/routes/AuthGuard"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { PrivateLayout } from "@/layouts/PrivateLayout"
import { OfferServicesPage } from "@/pages/OfferServicesPage"
import { SearchPage } from "@/pages/SearchPage"
import { ServiceDetailPage } from "@/pages/ServiceDetailPage"
import { TodosPage } from "@/pages/TodosPage"
import { ProfileOnboardingPage } from "@/pages/ProfileOnboardingPage"
import { ProfileSettingsPage } from "@/pages/ProfileSettingsPage"
import { BusinessesPage } from "@/pages/BusinessesPage"
import { CreateBusinessPage } from "@/pages/CreateBusinessPage"
import { BusinessSettingsPage } from "@/pages/BusinessSettingsPage"
import { BusinessTeamPage } from "@/pages/BusinessTeamPage"
import { BusinessTeamInvitePage } from "@/pages/BusinessTeamInvitePage"
import { ServicesPage } from "@/pages/ServicesPage"
import { CreateServicePage } from "@/pages/CreateServicePage"
import { EditServicePage } from "@/pages/EditServicePage"
import { CategoriesPage } from "@/pages/CategoriesPage"
import { HoursPage } from "@/pages/HoursPage"
import { LocationsPage } from "@/pages/LocationsPage"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/ofrecer" element={<OfferServicesPage />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="/servicio/:id" element={<ServiceDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/todos" element={<TodosPage />} />

        {/* Profile Onboarding (Requires Auth but only if profile is incomplete) */}
        <Route
          path="/onboarding/profile"
          element={
            <AuthGuard requireCompleteProfile={false} allowIncompleteProfileOnly>
              <ProfileOnboardingPage />
            </AuthGuard>
          }
        />

        {/* Intranet / Gestor de Negocios (Requires Auth & Complete Profile) */}
        <Route
          path="/intranet/businesses"
          element={
            <AuthGuard>
              <BusinessesPage />
            </AuthGuard>
          }
        />

        <Route
          path="/intranet/businesses/new"
          element={
            <AuthGuard>
              <CreateBusinessPage />
            </AuthGuard>
          }
        />

        {/* Profile Settings (Requires Auth & Complete Profile, but NO Selected Service Needed) */}
        <Route
          path="/profile/settings"
          element={
            <AuthGuard requireSelectedService={false}>
              <ProfileSettingsPage />
            </AuthGuard>
          }
        />

        {/* Intranet Dashboard (Requires Auth, Complete Profile AND Active Service Selection) */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard requireSelectedService>
              <PrivateLayout />
            </AuthGuard>
          }
        >
          {/* Default dashboard path redirects or displays main dashboard */}
          <Route index element={<DashboardPage />} />

          {/* Example of Role-Restricted Inner Dashboard Route */}
          <Route
            path="admin-settings"
            element={
              <AuthGuard allowedRoles={["SAAS_ADMIN"]}>
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h2 className="text-xl font-bold mb-2">Administración SaaS</h2>
                  <p className="text-muted-foreground">Esta sección es visible únicamente para roles SAAS_ADMIN.</p>
                </div>
              </AuthGuard>
            }
          />

          <Route
            path="billing"
            element={
              <AuthGuard allowedRoles={["SAAS_ADMIN", "SERVICE_OWNER"]}>
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h2 className="text-xl font-bold mb-2">Facturación y Planes</h2>
                  <p className="text-muted-foreground">Esta sección es visible para SAAS_ADMIN y SERVICE_OWNER.</p>
                </div>
              </AuthGuard>
            }
          />

          {/* Business Settings Route */}
          <Route
            path="settings/business"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <BusinessSettingsPage />
              </AuthGuard>
            }
          />

          {/* Business Team Routes */}
          <Route
            path="settings/business/team"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <BusinessTeamPage />
              </AuthGuard>
            }
          />
          <Route
            path="settings/business/team/invite"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <BusinessTeamInvitePage />
              </AuthGuard>
            }
          />

          {/* Services & Categories Routes */}
          <Route
            path="services"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <ServicesPage />
              </AuthGuard>
            }
          />
          <Route
            path="services/new"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <CreateServicePage />
              </AuthGuard>
            }
          />
          <Route
            path="services/edit/:id"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <EditServicePage />
              </AuthGuard>
            }
          />
          <Route
            path="services/categories"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <CategoriesPage />
              </AuthGuard>
            }
          />

          {/* Agenda & Hours Routes */}
          <Route
            path="agenda/hours"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <HoursPage />
              </AuthGuard>
            }
          />
          <Route
            path="agenda/locations"
            element={
              <AuthGuard allowedRoles={["SERVICE_OWNER"]}>
                <LocationsPage />
              </AuthGuard>
            }
          />
        </Route>

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

