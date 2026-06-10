import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthState, User, TenantService } from "../types/auth.types"

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      services: [],
      selectedService: null,
      isAuthenticated: false,

      login: (user: User, services: TenantService[]) =>
        set({
          user,
          services,
          selectedService: services.length > 0 ? services[0] : null,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          services: [],
          selectedService: null,
          isAuthenticated: false,
        }),

      selectService: (service: TenantService | null) =>
        set({
          selectedService: service,
        }),
    }),
    {
      name: "saas-auth-storage",
    }
  )
)
