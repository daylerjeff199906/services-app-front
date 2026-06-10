import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import type { UserRole } from "../types/auth.types"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireSelectedService?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireSelectedService = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, selectedService } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    // Redirect to login, storing current page location to redirect back after success
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role is not allowed, redirect to unauthorized/landing page
    return <Navigate to="/" replace />
  }

  if (requireSelectedService && !selectedService) {
    // Service selector is required but no service has been selected
    return <Navigate to="/services" replace />
  }

  return <>{children}</>
}
