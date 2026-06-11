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

// Zod validation schema for Business/Workspace creation
const businessSchema = z.object({
  name: z.string().min(3, "El nombre del negocio debe tener al menos 3 caracteres"),
  slug: z.string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "El slug solo debe contener letras minúsculas, números y guiones"),
  description: z.string().optional(),
})

type BusinessInput = z.infer<typeof businessSchema>

export function BusinessesPage() {
  const navigate = useNavigate()
  const { user, services, setServices, selectService, logout } = useAuthStore()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingList, setIsLoadingList] = useState(true)
  
  // Form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessInput, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch businesses from database
  const fetchBusinesses = async () => {
    if (!user?.id) return
    setIsLoadingList(true)
    try {
      const { data, error } = await supabase
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

      if (error) throw error

      const formatted = (data || [])
        .map((row: any) => row.businesses)
        .filter(Boolean)
        .map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.name.toLowerCase().replace(/\s+/g, "-"),
          description: b.description || "",
        }))
      setServices(formatted)
    } catch (err) {
      console.error("Error loading businesses:", err)
    } finally {
      setIsLoadingList(false)
    }
  }

  useEffect(() => {
    fetchBusinesses()
  }, [user])

  // Auto-generate slug from name
  useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "")     // Keep only alphanumeric, spaces, and hyphens
      .replace(/\s+/g, "-")            // Replace spaces with hyphens
      .replace(/-+/g, "-")             // Deduplicate hyphens
    
    setSlug(generatedSlug)
  }, [name])

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setIsSubmitting(true)

    const result = businessSchema.safeParse({ name, slug, description })

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof BusinessInput, string>> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof BusinessInput] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    try {
      if (!user?.id) throw new Error("Sesión de usuario no válida.")

      // Insert new business row
      const { data: bizData, error: insertError } = await supabase
        .from("businesses")
        .insert([{
          name,
          description
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Assign user role to the newly created business
      const { error: roleError } = await supabase
        .from("business_user_roles")
        .insert([{
          business_id: bizData.id,
          user_id: user.id,
          role: user.role || 'SERVICE_OWNER'
        }])

      if (roleError) throw roleError

      // Reset form and close modal
      setName("")
      setSlug("")
      setDescription("")
      setIsModalOpen(false)
      
      // Refresh list
      await fetchBusinesses()
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || "Error al crear el negocio. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectBusiness = (biz: any) => {
    selectService(biz)
    navigate("/dashboard", { replace: true })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      
      {/* Top Navigation Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-extrabold text-xl text-[#059669] tracking-tighter">
              Gesti
            </span>
            <span className="text-xs px-2.5 py-1 bg-muted text-muted-foreground border border-border font-medium rounded-full">
              SaaS Intranet
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="hidden md:inline text-muted-foreground">
              Hola, <strong className="text-foreground">{user?.full_name || user?.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold py-1.5 px-3 border border-border hover:bg-muted transition-colors rounded-md text-destructive"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header Title + Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mis Espacios de Trabajo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona o crea un negocio para administrar tus servicios y agenda.
            </p>
          </div>

          {services.length > 0 && (
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Crear Negocio
            </Button>
          )}
        </div>

        {/* Loading Spinner */}
        {isLoadingList ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-muted-foreground mt-3 font-medium">Cargando negocios...</span>
          </div>
        ) : services.length === 0 ? (
          
          /* Visual Flat Empty State */
          <div className="w-full border-2 border-dashed border-border rounded-xl p-12 text-center bg-card flex flex-col items-center max-w-2xl mx-auto animate-fade-in">
            <div className="size-16 rounded-full bg-muted border border-border flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Aún no tienes negocios registrados</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-8 leading-relaxed">
              Comienza creando tu primer espacio de trabajo para configurar tus servicios y empezar a recibir clientes.
            </p>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-6 font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Crear mi primer negocio
            </Button>
          </div>
        ) : (
          
          /* Businesses grid layout using simple flat borders, no shadows */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {services.map((biz) => (
              <div 
                key={biz.id}
                className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold text-lg tracking-tight truncate">{biz.name}</h3>
                    <span className="text-xs px-2 py-0.5 border border-border bg-muted text-muted-foreground font-mono rounded-md truncate max-w-[120px]">
                      /{biz.slug}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 min-h-[60px]">
                    {biz.description || "Sin descripción disponible."}
                  </p>
                </div>

                <button
                  onClick={() => handleSelectBusiness(biz)}
                  className="w-full py-2 border border-primary hover:bg-primary/5 text-primary text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  Administrar
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Creation Modal (pure CSS-like logic, no shadows) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Title */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Crear Nuevo Negocio</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Define los detalles de tu nuevo espacio de trabajo.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-muted-foreground hover:text-foreground text-xl p-1 font-mono transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Error Banner */}
            {formError && (
              <div className="mb-4 p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
                {formError}
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="biz-name">Nombre del Negocio</FieldLabel>
                  <Input 
                    id="biz-name"
                    type="text"
                    placeholder="Clínica dental DentalSmile"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1 font-semibold">{errors.name}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="biz-slug">Identificador URL (Slug)</FieldLabel>
                  <div className="flex items-stretch rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring/50">
                    <span className="bg-muted px-3 border-r border-border text-xs text-muted-foreground flex items-center font-mono select-none">
                      /
                    </span>
                    <input 
                      id="biz-slug"
                      type="text"
                      placeholder="dentalsmile"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="flex-1 px-3 py-2 text-sm bg-transparent border-0 outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.slug ? (
                    <p className="text-xs text-destructive mt-1 font-semibold">{errors.slug}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-1">Este identificador único formará parte de la dirección de acceso a tu negocio.</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="biz-desc">Descripción (Opcional)</FieldLabel>
                  <textarea 
                    id="biz-desc"
                    rows={3}
                    placeholder="Describe los servicios que ofrece tu espacio de trabajo..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring/50"
                    disabled={isSubmitting}
                  />
                </Field>
              </FieldGroup>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border text-sm font-semibold rounded-md hover:bg-muted transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center"
                >
                  {isSubmitting ? "Creando..." : "Crear Negocio"}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
