import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthGuard } from "@/routes/AuthGuard"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ServiceSelectorPage } from "@/pages/ServiceSelectorPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { PrivateLayout } from "@/layouts/PrivateLayout"
import { OfferServicesPage } from "@/pages/OfferServicesPage"
import { SearchPage } from "@/pages/SearchPage"
import { ServiceDetailPage } from "@/pages/ServiceDetailPage"
import { TodosPage } from "@/pages/TodosPage"
import { ProfileOnboardingPage } from "@/pages/ProfileOnboardingPage"
import { ProfileSettingsPage } from "@/pages/ProfileSettingsPage"
import { BusinessesPage } from "@/pages/BusinessesPage"

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

        {/* Profile Settings (Requires Auth & Complete Profile, but NO Selected Service Needed) */}
        <Route
          path="/profile/settings"
          element={
            <AuthGuard requireSelectedService={false}>
              <ProfileSettingsPage />
            </AuthGuard>
          }
        />

        {/* Auth Required, but No Selected Service Needed yet */}
        <Route
          path="/services"
          element={
            <AuthGuard>
              <ServiceSelectorPage />
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
        </Route>

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

