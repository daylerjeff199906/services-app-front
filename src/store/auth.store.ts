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
      isProfileComplete: false,
      isLoading: true,

      login: (user: User, services: TenantService[]) =>
        set({
          user,
          services,
          selectedService: services.length > 0 ? services[0] : null,
          isAuthenticated: true,
          isProfileComplete: !!(user.full_name && user.phone),
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          services: [],
          selectedService: null,
          isAuthenticated: false,
          isProfileComplete: false,
          isLoading: false,
        }),

      selectService: (service: TenantService | null) =>
        set({
          selectedService: service,
        }),

      setProfileComplete: (isComplete: boolean) =>
        set({
          isProfileComplete: isComplete,
        }),

      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
          isProfileComplete: user ? !!(user.full_name && user.phone) : false,
        }),

      setLoading: (isLoading: boolean) =>
        set({
          isLoading,
        }),

      setServices: (services: TenantService[]) =>
        set((state) => ({
          services,
          selectedService: state.selectedService 
            ? (services.find((s) => s.id === state.selectedService?.id) || null) 
            : (services.length > 0 ? services[0] : null),
        })),
    }),
    {
      name: "saas-auth-storage",
      partialize: (state) => ({
        user: state.user,
        services: state.services,
        selectedService: state.selectedService,
        isAuthenticated: state.isAuthenticated,
        isProfileComplete: state.isProfileComplete,
      }),
    }
  )
)

