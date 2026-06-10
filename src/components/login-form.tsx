"use client"

import React, { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { loginSchema } from "@/features/auth/schemas/auth.schema"
import type { LoginInput } from "@/features/auth/schemas/auth.schema"
import { useAuthStore } from "@/store/auth.store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as any)?.from?.pathname || "/services"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

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
      await new Promise((resolve) => setTimeout(resolve, 800))

      const dummyUser = {
        id: "usr_1",
        email: email,
        name: "Director General",
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
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold font-sans">Iniciar Sesión</h1>
          <p className="text-sm text-balance text-muted-foreground font-sans">
            Ingresa tu correo abajo para acceder a tu cuenta
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn("bg-background", errors.email && "border-destructive")}
          />
          {errors.email && <p className="text-xs text-destructive mt-1 font-semibold">{errors.email}</p>}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <a
              href="#"
              className="ml-auto text-xs underline-offset-4 hover:underline text-muted-foreground"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn("bg-background", errors.password && "border-destructive")}
          />
          {errors.password && <p className="text-xs text-destructive mt-1 font-semibold">{errors.password}</p>}
        </Field>
        <Field>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Validando..." : "Ingresar"}
          </Button>
        </Field>
        <FieldSeparator>O continuar con</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" className="w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            GitHub
          </Button>
          <FieldDescription className="text-center mt-4 text-xs">
            ¿No tienes una cuenta?{" "}
            <Link to="/register" className="underline underline-offset-4 font-semibold text-primary">
              Regístrate
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
