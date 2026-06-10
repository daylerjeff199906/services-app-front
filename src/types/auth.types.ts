export type UserRole = "SAAS_ADMIN" | "SERVICE_OWNER"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface TenantService {
  id: string
  name: string
  slug: string
  description?: string
}

export interface AuthState {
  user: User | null
  services: TenantService[]
  selectedService: TenantService | null
  isAuthenticated: boolean
  login: (user: User, services: TenantService[]) => void
  logout: () => void
  selectService: (service: TenantService | null) => void
}
