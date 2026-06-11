import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { loginSchema } from "../schemas/auth.schema"
import type { LoginInput } from "../schemas/auth.schema"
import { useAuthStore } from "../../../store/auth.store"

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to original page location after login, or fallback to /services selector
  const from = (location.state as any)?.from?.pathname || "/services"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Validate using Zod schema
    const result = loginSchema.safeParse({ email, password })

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginInput] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      return
    }

    try {
      // Mock API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Simulate a SAAS_ADMIN user with multiple tenant services
      const dummyUser = {
        id: "usr_1",
        email: email,
        full_name: "Director General",
        phone: null,
        bio: null,
        specialty: null,
        role: "SAAS_ADMIN" as const, 
      }

      const dummyServices = [
        { id: "srv_1", name: "Servicio de Consultas Médicas", slug: "consultas-medicas", description: "Clínica San José" },
        { id: "srv_2", name: "Servicio de Fisioterapia", slug: "fisioterapia", description: "Rehabilitación Integral" },
      ]

      login(dummyUser, dummyServices)
      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-[400px] p-8 bg-card border border-border rounded-xl shadow-lg">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Iniciar Sesión</h2>
        <p className="text-sm text-muted-foreground mt-1">Ingresa tus credenciales para administrar tus servicios</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md outline-none bg-background text-foreground focus:ring-2 focus:ring-ring/50 ${
              errors.email ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-ring"
            }`}
          />
          {errors.email && <p className="text-xs text-destructive mt-1 font-medium">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md outline-none bg-background text-foreground focus:ring-2 focus:ring-ring/50 ${
              errors.password ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-ring"
            }`}
          />
          {errors.password && <p className="text-xs text-destructive mt-1 font-medium">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? (
            <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
          ) : null}
          {isLoading ? "Validando..." : "Ingresar"}
        </button>
      </form>
    </div>
  )
}
