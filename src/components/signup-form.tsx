"use client"

import React, { useState } from "react"
import { Link } from "react-router-dom"
import { registerSchema } from "@/features/auth/schemas/auth.schema"
import type { RegisterInput } from "@/features/auth/schemas/auth.schema"
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
import { supabase } from "@/utils/supabase"
import { Eye, EyeOff } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const setLoading = useAuthStore((state) => state.setLoading)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Password strength criteria checks
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setFormSuccess(null)
    setIsLoading(true)
    setLoading(true)

    // Validate using Zod schema
    const result = registerSchema.safeParse({ name, email, password, confirmPassword })

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterInput] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      setLoading(false)
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (authError) {
        setFormError(authError.message || "Error al registrar la cuenta.")
        setIsLoading(false)
        setLoading(false)
        return
      }

      const sessionUser = authData.user

      if (!sessionUser) {
        setFormError("No se pudo obtener la información de registro.")
        setIsLoading(false)
        setLoading(false)
        return
      }

      // Create a profile for the user
      const newProfile = {
        id: sessionUser.id,
        full_name: name,
        phone: null,
        specialty: null,
        bio: null,
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([newProfile])

      if (profileError) {
        console.error("Error creating profile:", profileError)
      }

      // Assign global role to the user
      const { error: roleError } = await supabase
        .from("user_global_roles")
        .insert([{ user_id: sessionUser.id, role: "SERVICE_OWNER" }])

      if (roleError) {
        console.error("Error assigning global role:", roleError)
      }

      // Sign out from Supabase to ensure they log in explicitly as requested
      await supabase.auth.signOut()

      setFormSuccess("¡Tu cuenta ha sido creada exitosamente! Ahora puedes iniciar sesión para completar tu perfil.")
    } catch (err: any) {
      console.error(err)
      setFormError("Ocurrió un error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  if (formSuccess) {
    return (
      <form onSubmit={(e) => e.preventDefault()} className={cn("flex flex-col gap-6 text-center animate-fade-in", className)} {...props}>
        <div className="flex flex-col items-center gap-1.5 py-4">
          <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center mb-4 text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-2xl  font-sans">¡Registro Exitoso!</h1>
          <p className="text-sm text-balance text-muted-foreground font-sans mt-2 leading-relaxed">
            {formSuccess}
          </p>
        </div>

        <div className="pt-2">
          <Link to="/login"
            className="w-full block">
            <Button
              variant="link"
              className="w-full font-semibold">
              Ir a Iniciar Sesión
            </Button>
          </Link>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl  font-sans">Crear una Cuenta</h1>
          <p className="text-sm text-balance text-muted-foreground font-sans">
            Completa los siguientes campos para registrarte
          </p>
        </div>
        {formError && (
          <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center animate-fade-in">
            {formError}
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={cn("bg-background", errors.name && "border-destructive")}
          />
          {errors.name && <p className="text-xs text-destructive mt-1 font-semibold">{errors.name}</p>}
        </Field>
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
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <div className="relative flex items-center">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn("bg-background pr-10", errors.password && "border-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors outline-none focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Password Strength Progress Indicator */}
          <div className="flex gap-1 mt-2.5">
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strengthScore >= 1 ? (strengthScore === 1 ? 'bg-destructive' : strengthScore === 2 ? 'bg-amber-500' : strengthScore === 3 ? 'bg-yellow-500' : 'bg-emerald-500') : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strengthScore >= 2 ? (strengthScore === 2 ? 'bg-amber-500' : strengthScore === 3 ? 'bg-yellow-500' : 'bg-emerald-500') : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strengthScore >= 3 ? (strengthScore === 3 ? 'bg-yellow-500' : 'bg-emerald-500') : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strengthScore >= 4 ? 'bg-emerald-500' : 'bg-border'}`} />
          </div>

          {/* Criteria Checklist */}
          <ul className="mt-2.5 space-y-1 text-[10px]">
            <li className={`flex items-center gap-2 transition-colors duration-300 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
              <span className={`size-1.5 rounded-full transition-colors duration-300 ${hasMinLength ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              Mínimo 8 caracteres
            </li>
            <li className={`flex items-center gap-2 transition-colors duration-300 ${hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
              <span className={`size-1.5 rounded-full transition-colors duration-300 ${hasUppercase ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              Al menos una letra mayúscula
            </li>
            <li className={`flex items-center gap-2 transition-colors duration-300 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
              <span className={`size-1.5 rounded-full transition-colors duration-300 ${hasNumber ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              Al menos un número
            </li>
            <li className={`flex items-center gap-2 transition-colors duration-300 ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
              <span className={`size-1.5 rounded-full transition-colors duration-300 ${hasSpecialChar ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              Al menos un carácter especial (@$!%*?&)
            </li>
          </ul>

          {errors.password && <p className="text-xs text-destructive mt-1 font-semibold">{errors.password}</p>}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirmar Contraseña</FieldLabel>
          <div className="relative flex items-center">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn("bg-background pr-10", errors.confirmPassword && "border-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors outline-none focus:outline-none"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive mt-1 font-semibold">{errors.confirmPassword}</p>}
        </Field>
        <Field>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
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
          <FieldDescription className="px-6 text-center mt-4 text-xs">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="underline underline-offset-4 font-semibold text-primary">
              Inicia sesión
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
