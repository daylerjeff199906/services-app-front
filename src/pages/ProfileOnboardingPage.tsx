import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

// Validation schemas for each step
const stepOneSchema = z.object({
  name: z.string().min(3, "El nombre completo debe tener al menos 3 caracteres"),
  phone: z.string().regex(/^\+?[0-9\s\-()]{8,20}$/, "Introduce un número de teléfono válido (mínimo 8 dígitos)"),
})

const stepTwoSchema = z.object({
  specialty: z.string().min(2, "La especialidad debe tener al menos 2 caracteres"),
  bio: z.string().max(160, "La biografía no debe superar los 160 caracteres").optional(),
})


export function ProfileOnboardingPage() {
  const navigate = useNavigate()
  const { user, login } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(1)

  // Step 1 State
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  // Step 2 State
  const [specialty, setSpecialty] = useState("")
  const [bio, setBio] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill fields if available
  useEffect(() => {
    if (user) {
      if (user.full_name) setName(user.full_name)
      if (user.phone) setPhone(user.phone)
      if (user.bio) setBio(user.bio)
      if (user.specialty) setSpecialty(user.specialty)
    }
  }, [user])

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = stepOneSchema.safeParse({ name, phone })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setCurrentStep(2)
  }

  const handleBackStep = () => {
    setErrors({})
    setCurrentStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setIsSubmitting(true)

    const result = stepTwoSchema.safeParse({ specialty, bio })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    try {
      if (!user?.id) {
        setFormError("No se encontró sesión activa de usuario.")
        setIsSubmitting(false)
        return
      }

      // Update public.profiles in Supabase
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          phone: phone,
          specialty: specialty,
          bio: bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Fetch existing user businesses through business_user_roles relation table
      const { data: roleBizRelations } = await supabase
        .from("business_user_roles")
        .select(`
          business_id,
          businesses:business_id (
            id,
            name,
            description
          )
        `)
        .eq("user_id", user.id)

      const formattedServices = (roleBizRelations || [])
        .map((r: any) => r.businesses)
        .filter(Boolean)
        .map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.name.toLowerCase().replace(/\s+/g, "-"),
          description: b.description || "",
        }))

      // Sync local Zustand store
      login(
        {
          ...user,
          full_name: name,
          phone: phone,
          specialty: specialty,
          bio: bio || null,
        },
        formattedServices
      )

      // Redirect to workspaces management dashboard
      navigate("/intranet/businesses", { replace: true })
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || "Error al completar tu perfil. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    useAuthStore.getState().logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">

      {/* Left Column: Containerless Open Form Area */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 lg:p-24 max-w-2xl w-full mx-auto md:mx-0">

        {/* Brand Header */}
        <div>
          <div className=" text-2xl text-[#059669] tracking-tighter flex items-center gap-1.5 w-fit">
            Gesti
          </div>
        </div>

        {/* Form Body - Open layout, no card background, no shadows */}
        <div className="my-auto py-12 max-w-md w-full">

          {/* Progress Indicators */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${currentStep >= 1 ? "bg-[#059669]" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${currentStep >= 2 ? "bg-[#059669]" : "bg-muted"}`} />
          </div>

          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Paso {currentStep} de 2
          </span>

          {currentStep === 1 ? (
            <div className="animate-fade-in">
              <h1 className="text-3xl  tracking-tight mb-2">Ayúdanos a conocerte</h1>
              <p className="text-sm text-muted-foreground mb-8">
                Ingresa tu nombre completo y teléfono de contacto para configurar tu perfil.
              </p>

              {formError && (
                <div className="mb-6 p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
                  {formError}
                </div>
              )}

              <form onSubmit={handleNextStep} className="space-y-5">
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={errors.name ? "border-destructive focus:ring-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1 font-semibold">{errors.name}</p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">Número de Teléfono</FieldLabel>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={errors.phone ? "border-destructive focus:ring-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive mt-1 font-semibold">{errors.phone}</p>
                    )}
                  </Field>

                  <div className="pt-4">
                    <Button type="submit" className="w-full font-semibold py-2.5">
                      Siguiente paso
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h1 className="text-3xl  tracking-tight mb-2">Cuéntanos sobre tu negocio</h1>
              <p className="text-sm text-muted-foreground mb-8">
                Define tu especialidad y agrega una breve descripción profesional para tus clientes.
              </p>

              {formError && (
                <div className="mb-6 p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="specialty">Especialidad / Profesión</FieldLabel>
                    <Input
                      id="specialty"
                      type="text"
                      placeholder="Fisioterapia, Medicina General, Consultoría"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className={errors.specialty ? "border-destructive focus:ring-destructive" : ""}
                      disabled={isSubmitting}
                    />
                    {errors.specialty && (
                      <p className="text-xs text-destructive mt-1 font-semibold">{errors.specialty}</p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bio">Biografía Profesional (Opcional)</FieldLabel>
                    <textarea
                      id="bio"
                      rows={3}
                      placeholder="Fisioterapeuta con 5 años de experiencia especializado en rehabilitación deportiva..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring/50"
                      disabled={isSubmitting}
                      maxLength={160}
                    />
                    {errors.bio ? (
                      <p className="text-xs text-destructive mt-1 font-semibold">{errors.bio}</p>
                    ) : (
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>Una breve descripción de tu perfil.</span>
                        <span>{bio.length}/160</span>
                      </div>
                    )}
                  </Field>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleBackStep}
                      className="flex-1 py-2 px-4 border border-border text-sm font-semibold rounded-md hover:bg-muted transition-colors"
                      disabled={isSubmitting}
                    >
                      Atrás
                    </button>
                    <Button
                      type="submit"
                      className="flex-1 font-semibold py-2.5 flex items-center justify-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        "Completar Perfil"
                      )}
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t border-border">
          <span>{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-destructive hover:underline font-semibold"
          >
            Cerrar Sesión
          </button>
        </div>

      </div>

      {/* Right Column: Premium SVG Graphic Banner (Desktop Only) */}
      <div className="hidden md:flex flex-1 bg-muted border-l border-border relative overflow-hidden items-center justify-center p-12">
        <div className="max-w-md w-full text-center flex flex-col items-center select-none">

          {/* Beautiful Custom Flat Dashboard SVG */}
          <svg className="w-64 h-64 mb-8" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background elements */}
            <rect x="20" y="40" width="160" height="120" rx="8" fill="var(--background)" stroke="var(--border)" strokeWidth="2" />
            <line x1="20" y1="70" x2="180" y2="70" stroke="var(--border)" strokeWidth="2" />

            {/* Dots representing window controls */}
            <circle cx="35" cy="55" r="4" fill="var(--destructive)" />
            <circle cx="47" cy="55" r="4" fill="var(--accent-foreground)" />
            <circle cx="59" cy="55" r="4" fill="#059669" />

            {/* Grid metrics (Flat layout representation) */}
            <rect x="35" y="85" width="40" height="30" rx="4" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" />
            <rect x="85" y="85" width="80" height="30" rx="4" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" />

            {/* Flat graph vectors */}
            <rect x="35" y="125" width="130" height="20" rx="4" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" />
            <circle cx="50" cy="135" r="5" fill="#059669" />
            <line x1="65" y1="135" x2="150" y2="135" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
          </svg>

          <h2 className="text-2xl  tracking-tight text-foreground mb-3">
            Gestiona todo en un solo lugar
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Configura tu horario, administra clientes y expande tu negocio con nuestro panel unificado y libre de distracciones.
          </p>
        </div>
      </div>

    </div>
  )
}
