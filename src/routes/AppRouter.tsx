import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ServiceSelectorPage } from "@/pages/ServiceSelectorPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { PrivateLayout } from "@/layouts/PrivateLayout"
import { OfferServicesPage } from "@/pages/OfferServicesPage"
import { SearchPage } from "@/pages/SearchPage"
import { ServiceDetailPage } from "@/pages/ServiceDetailPage"

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

        {/* Auth Required, but No Selected Service Needed yet */}
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ServiceSelectorPage />
            </ProtectedRoute>
          }
        />

        {/* Intranet Dashboard (Requires Auth AND Active Service Selection) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireSelectedService>
              <PrivateLayout />
            </ProtectedRoute>
          }
        >
          {/* Default dashboard path redirects or displays main dashboard */}
          <Route index element={<DashboardPage />} />

          {/* Example of Role-Restricted Inner Dashboard Route */}
          <Route
            path="admin-settings"
            element={
              <ProtectedRoute allowedRoles={["SAAS_ADMIN"]}>
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h2 className="text-xl font-bold mb-2">Administración SaaS</h2>
                  <p className="text-muted-foreground">Esta sección es visible únicamente para roles SAAS_ADMIN.</p>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="billing"
            element={
              <ProtectedRoute allowedRoles={["SAAS_ADMIN", "SERVICE_OWNER"]}>
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h2 className="text-xl font-bold mb-2">Facturación y Planes</h2>
                  <p className="text-muted-foreground">Esta sección es visible para SAAS_ADMIN y SERVICE_OWNER.</p>
                </div>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
