import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { StateStorage } from "zustand/middleware"
import type { AuthState, User, TenantService } from "../types/auth.types"

// Simple XOR + Base64 encryption/decryption for client-side storage obfuscation
const ENCRYPTION_KEY = "gesti-secure-key"

function encrypt(text: string): string {
  let result = ""
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
  }
  return btoa(unescape(encodeURIComponent(result)))
}

function decrypt(encoded: string): string {
  try {
    const text = decodeURIComponent(escape(atob(encoded)))
    let result = ""
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    }
    return result
  } catch (e) {
    return ""
  }
}

// Custom cookie storage for Zustand
const cookieStorage: StateStorage = {
  getItem: (name): string | null => {
    const cookies = document.cookie.split("; ")
    const cookie = cookies.find((row) => row.startsWith(`${name}=`))
    if (!cookie) return null
    const val = cookie.split("=")[1]
    return decrypt(val) || null
  },
  setItem: (name, value): void => {
    const encrypted = encrypt(value)
    const date = new Date()
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
    document.cookie = `${name}=${encrypted}; expires=${date.toUTCString()}; path=/; SameSite=Strict; Secure`
  },
  removeItem: (name): void => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`
  }
}

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
      storage: createJSONStorage(() => cookieStorage),
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

