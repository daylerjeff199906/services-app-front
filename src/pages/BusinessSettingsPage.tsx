import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, ShieldAlert, Trash2 } from "lucide-react"
import { FormFooter } from "@/components/ui/form-footer"
import { toast } from "sonner"

interface Member {
  role: string
  userId: string
  profile: {
    id: string
    full_name: string | null
    username: string | null
  } | null
}

export function BusinessSettingsPage() {
  const navigate = useNavigate()
  const { selectedService, selectService, services, setServices, user } = useAuthStore()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isIndependent, setIsIndependent] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [members, setMembers] = useState<Member[]>([])
  const [copiedId, setCopiedId] = useState(false)

  // Contact numbers state
  const [contactNumbers, setContactNumbers] = useState<{ number: string; label: string }[]>([])
  const [newPhone, setNewPhone] = useState("")
  const [newPhoneLabel, setNewPhoneLabel] = useState("WhatsApp")

  // Social media links state
  const [socialLinks, setSocialLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState("")

  // Locations state
  const [locations, setLocations] = useState<any[]>([])

  // Danger Zone Deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      try {
        // Fetch current business details with fallback
        let bizData: any = null
        try {
          const { data, error } = await supabase
            .from("businesses")
            .select("id, name, description, is_active, is_independent, contact_numbers, social_links")
            .eq("id", selectedService.id)
            .single()

          if (error) {
            // Fallback if social_links doesn't exist
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("businesses")
              .select("id, name, description, is_active, is_independent, contact_numbers")
              .eq("id", selectedService.id)
              .single()

            if (fallbackError) {
              // Fallback if contact_numbers column doesn't exist yet either
              const { data: minData, error: minError } = await supabase
                .from("businesses")
                .select("id, name, description, is_active, is_independent")
                .eq("id", selectedService.id)
                .single()

              if (minError) throw minError
              bizData = minData
            } else {
              bizData = fallbackData
            }
          } else {
            bizData = data
          }
        } catch (bizSelectErr) {
          console.error("Failed to select business details, fallback used:", bizSelectErr)
        }

        if (bizData) {
          setName(bizData.name)
          setDescription(bizData.description || "")
          setIsActive(bizData.is_active ?? true)
          setIsIndependent(bizData.is_independent ?? null)
          
          // Deserialize contact numbers
          const parsedContacts = (bizData.contact_numbers || []).map((item: string) => {
            if (item.includes("|")) {
              const [label, number] = item.split("|")
              return { label, number }
            }
            return { label: "WhatsApp", number: item }
          })
          setContactNumbers(parsedContacts)
          setSocialLinks(bizData.social_links || [])
        }

        // Fetch team members
        const { data: membersData, error: membersError } = await supabase
          .from("business_user_roles")
          .select(`
            role,
            user_id,
            profiles:user_id (
              id,
              full_name,
              username
            )
          `)
          .eq("business_id", selectedService.id)

        if (membersError) throw membersError

        const formatted = (membersData || []).map((m: any) => ({
          role: m.role,
          userId: m.user_id,
          profile: m.profiles,
        }))

        // Ensure the logged-in user is always in the list
        if (user && !formatted.some((m) => m.userId === user.id)) {
          formatted.push({
            role: "OWNER",
            userId: user.id,
            profile: {
              id: user.id,
              full_name: user.full_name || null,
              username: user.email?.split("@")[0] || "usuario",
            },
          })
        }

        setMembers(formatted)

        // Fetch locations defensively
        try {
          const { data: locData, error: locError } = await supabase
            .from("business_locations")
            .select("*")
            .eq("business_id", selectedService.id)

          if (!locError) {
            setLocations(locData || [])
          }
        } catch (e) {
          console.error("Locations table not ready yet:", e)
        }
      } catch (err) {
        console.error("Error loading settings data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedService, navigate])

  const handleAddPhone = (e: React.MouseEvent) => {
    e.preventDefault()
    const trimmed = newPhone.trim()
    if (!trimmed) return
    if (contactNumbers.some((c) => c.number === trimmed)) {
      toast.error("Este número de teléfono ya está agregado.")
      return
    }
    setContactNumbers([...contactNumbers, { number: trimmed, label: newPhoneLabel }])
    setNewPhone("")
  }

  const handleRemovePhone = (indexToRemove: number) => {
    setContactNumbers(contactNumbers.filter((_, i) => i !== indexToRemove))
  }

  const handleAddLink = (e: React.MouseEvent) => {
    e.preventDefault()
    const trimmed = newLink.trim()
    if (!trimmed) return
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("El enlace debe comenzar con http:// o https://")
      return
    }
    if (socialLinks.includes(trimmed)) {
      toast.error("Este enlace de red social ya está agregado.")
      return
    }
    setSocialLinks([...socialLinks, trimmed])
    setNewLink("")
  }

  const handleRemoveLink = (indexToRemove: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== indexToRemove))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return

    setIsSubmitting(true)
    try {
      const serializedContacts = contactNumbers.map((c) => `${c.label}|${c.number}`)

      // Try updating with everything
      const { error } = await supabase
        .from("businesses")
        .update({
          name,
          description,
          is_active: isActive,
          is_independent: isIndependent,
          contact_numbers: serializedContacts,
          social_links: socialLinks,
        })
        .eq("id", selectedService.id)

      if (error) {
        // Fallback 1: Try without social_links
        console.warn("Update with social_links failed, trying fallback without it...", error)
        const { error: errorFallback1 } = await supabase
          .from("businesses")
          .update({
            name,
            description,
            is_active: isActive,
            is_independent: isIndependent,
            contact_numbers: serializedContacts,
          })
          .eq("id", selectedService.id)

        if (errorFallback1) {
          // Fallback 2: Try without contact_numbers either
          console.warn("Update with contact_numbers failed, trying bare minimum...", errorFallback1)
          const { error: errorFallback2 } = await supabase
            .from("businesses")
            .update({
              name,
              description,
              is_active: isActive,
              is_independent: isIndependent,
            })
            .eq("id", selectedService.id)

          if (errorFallback2) throw errorFallback2
          toast.warning("Cambios guardados (excepto números y redes, aplica la consulta SQL en Supabase).")
        } else {
          toast.warning("Cambios guardados (excepto redes sociales, aplica la consulta SQL en Supabase).")
        }
      } else {
        toast.success("Ajustes del negocio guardados con éxito.")
      }

      // Update in local store state too
      const updatedServices = services.map((s) =>
        s.id === selectedService.id
          ? { ...s, name, description, isActive, isIndependent }
          : s
      )
      setServices(updatedServices)
      selectService({ ...selectedService, name, description, isActive, isIndependent })
    } catch (err) {
      console.error("Error saving business details:", err)
      toast.error("Error al guardar los cambios.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBusiness = async () => {
    if (!selectedService || confirmName !== selectedService.name) return

    setIsDeleting(true)
    setDeleteError(null)
    try {
      // Delete business from database (Foreign keys handle cascade delete)
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", selectedService.id)

      if (error) throw error

      // Update store services list
      const remaining = services.filter((s) => s.id !== selectedService.id)
      setServices(remaining)

      // Clear selection
      selectService(null)

      // Redirect to intranet businesses selector
      setShowDeleteModal(false)
      navigate("/intranet/businesses", { replace: true })
    } catch (err: any) {
      console.error("Error deleting business:", err)
      setDeleteError(err.message || "Error al eliminar el negocio.")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-64 bg-muted border border-border rounded-xl mt-8" />
      </div>
    )
  }

  return (
    <div className="px-8 max-w-4xl mx-auto space-y-10 text-foreground pb-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight">
          Ajustes del Proyecto
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Configuración general y ciclo de vida de tu espacio de trabajo.
        </p>
      </div>

      {/* General Settings Card */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Configuración general</h2>

        <form onSubmit={handleSave} className="border border-border rounded-xl bg-card overflow-hidden">
          {/* Project Name */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Nombre del proyecto</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Se muestra en todo el panel de control.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Project ID (Read Only) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">ID del proyecto</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Referencia única utilizada en APIs y URLs.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full flex items-center gap-2">
              <Input
                type="text"
                value={selectedService?.id || ""}
                readOnly
                className="font-mono text-xs bg-muted/30 select-all"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(selectedService?.id || "")}
                className="shrink-0 size-9"
              >
                {copiedId ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Descripción</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Resumen del propósito y servicios ofrecidos.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring/50"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Números de contacto */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Números de contacto</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Agrega uno o varios números telefónicos para que tus clientes puedan contactarte.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full space-y-3">
              <div className="flex items-center gap-2">
                <select
                  value={newPhoneLabel}
                  onChange={(e) => setNewPhoneLabel(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-2 py-1 text-xs outline-none text-foreground shrink-0 w-24"
                  disabled={isSubmitting}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Llamadas">Llamadas</option>
                  <option value="Principal">Principal</option>
                  <option value="Personal">Personal</option>
                  <option value="Otro">Otro</option>
                </select>
                <Input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ej. +51 987 654 321"
                  disabled={isSubmitting}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newPhone.trim();
                      if (trimmed) {
                        if (contactNumbers.some(c => c.number === trimmed)) {
                          alert("Este número ya está agregado.");
                          return;
                        }
                        setContactNumbers([...contactNumbers, { number: trimmed, label: newPhoneLabel }]);
                        setNewPhone("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddPhone}
                  disabled={isSubmitting || !newPhone.trim()}
                  className="bg-[#10b981] hover:bg-[#059669] text-white shrink-0"
                >
                  Agregar
                </Button>
              </div>

              {contactNumbers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {contactNumbers.map((c, idx) => (
                    <div
                      key={`${c.number}-${idx}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-full text-xs font-medium animate-fade-in"
                    >
                      <span className="text-[10px] uppercase font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded">
                        {c.label}
                      </span>
                      <span className="font-mono text-muted-foreground">{c.number}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(idx)}
                        disabled={isSubmitting}
                        className="text-muted-foreground hover:text-destructive transition-colors border-0 bg-transparent p-0 cursor-pointer ml-1"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Negocio / Independiente */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Tipo de establecimiento</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">¿Es un local físico o un servicio a domicilio / independiente?</p>
            </div>
            <div className="md:w-2/3 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => !isSubmitting && setIsIndependent(false)}
                className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex flex-col gap-1.5 select-none ${
                  isIndependent === false
                    ? "bg-[#10b981]/5 border-[#10b981] ring-1 ring-[#10b981]"
                    : "bg-card border-border hover:border-border/80 hover:bg-muted/5"
                }`}
              >
                <span className="font-semibold text-sm text-foreground">Local físico / Sucursal</span>
                <span className="text-xs text-muted-foreground leading-normal">
                  Tengo un local, consultorio, oficina o tienda física donde atiendo a mis clientes.
                </span>
              </div>

              <div
                onClick={() => !isSubmitting && setIsIndependent(true)}
                className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex flex-col gap-1.5 select-none ${
                  isIndependent === true
                    ? "bg-[#10b981]/5 border-[#10b981] ring-1 ring-[#10b981]"
                    : "bg-card border-border hover:border-border/80 hover:bg-muted/5"
                }`}
              >
                <span className="font-semibold text-sm text-foreground">Servicio a domicilio / Independiente</span>
                <span className="text-xs text-muted-foreground leading-normal">
                  Atiendo a domicilio, de forma virtual o no requiero un local físico para mis citas.
                </span>
              </div>
            </div>
          </div>

          {/* Active status */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Estado de publicación</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Determina si el negocio está activo y es público.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full flex items-center gap-2">
              <select
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                disabled={isSubmitting}
              >
                <option value="active">Activo</option>
                <option value="inactive">No público / Inactivo</option>
              </select>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Redes sociales y enlaces</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Agrega enlaces a tus perfiles de redes sociales o sitio web externo.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Ej. https://instagram.com/mi_negocio"
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newLink.trim();
                      if (trimmed) {
                        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
                          alert("El enlace debe comenzar con http:// o https://");
                          return;
                        }
                        if (socialLinks.includes(trimmed)) {
                          alert("Este enlace ya está agregado.");
                          return;
                        }
                        setSocialLinks([...socialLinks, trimmed]);
                        setNewLink("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddLink}
                  disabled={isSubmitting || !newLink.trim()}
                  className="bg-[#10b981] hover:bg-[#059669] text-white shrink-0"
                >
                  Agregar
                </Button>
              </div>

              {socialLinks.length > 0 && (
                <div className="space-y-2 pt-1">
                  {socialLinks.map((link, idx) => (
                    <div
                      key={`${link}-${idx}`}
                      className="flex items-center justify-between px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs font-medium animate-fade-in"
                    >
                      <span className="truncate max-w-[300px] text-muted-foreground">{link}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        disabled={isSubmitting}
                        className="text-muted-foreground hover:text-destructive transition-colors border-0 bg-transparent p-0 cursor-pointer ml-2"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit panel */}
          <FormFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-medium"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </FormFooter>
        </form>
      </div>

      {/* Locales y Sucursales (Only if business is NOT independent) */}
      {isIndependent === false && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Locales y Sucursales</h2>

          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-medium text-sm text-foreground">Sedes físicas de atención</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium font-sans">
                  {locations.length === 0
                    ? "No hay locales registrados en este negocio."
                    : `Tienes ${locations.length} ${locations.length === 1 ? 'local registrado' : 'locales registrados'} en este negocio.`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/agenda/locations")}
                className="shrink-0 font-medium"
              >
                Gestionar locales
              </Button>
            </div>

            {locations.length > 0 && (
              <div className="border-t border-border">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/5 text-muted-foreground text-xs uppercase font-semibold">
                      <th className="px-6 py-3">Local</th>
                      <th className="px-6 py-3">Dirección</th>
                      <th className="px-6 py-3 text-right">Contacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {locations.slice(0, 3).map((loc) => {
                      const rawContact = loc.contact_numbers && loc.contact_numbers.length > 0
                        ? loc.contact_numbers[0]
                        : loc.phone || "Sin contacto"
                      const firstContact = rawContact.includes('|') ? rawContact.split('|')[1] : rawContact
                      return (
                        <tr key={loc.id} className="hover:bg-muted/5 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-foreground">{loc.name}</span>
                            {loc.city && (
                              <span className="ml-2 text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded border border-border uppercase text-muted-foreground">
                                {loc.city}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                            {loc.address}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground font-mono">
                            {firstContact}
                          </td>
                        </tr>
                      )
                    })}
                    {locations.length > 3 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-3 text-center text-xs text-muted-foreground font-medium bg-muted/5">
                          Y {locations.length - 3} locales más...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Access Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Acceso al proyecto</h2>

        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-medium text-sm text-foreground">Acceso a toda la organización</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                Todos los {members.length} miembros de la organización pueden acceder a este proyecto.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/settings/business/team")}
              className="shrink-0 font-medium"
            >
              Gestionar miembros
            </Button>
          </div>

          <div className="border-t border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/5 text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-3">Miembro</th>
                  <th className="px-6 py-3 text-right">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => {
                  const isCurrentUser = m.profile?.id === user?.id
                  return (
                    <tr key={`${m.userId}-${m.role}`} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <span className="font-medium text-foreground">
                          {m.profile?.full_name || "Usuario Gesti"}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded border border-border uppercase tracking-wider text-muted-foreground">
                            Tú
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-xs text-muted-foreground">
                        {m.role === "OWNER" ? "Owner" : m.role === "MANAGER" ? "Administrator" : "Developer"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-destructive tracking-tight flex items-center gap-2">
          <ShieldAlert className="size-5 text-destructive" />
          Zona de Peligro
        </h2>

        <div className="border border-destructive/20 rounded-xl bg-destructive/5 overflow-hidden p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">Eliminar este proyecto</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl font-medium">
              Una vez que elimines este negocio, se eliminarán permanentemente todas las configuraciones, colaboradores, registros y servicios asociados. No se puede recuperar.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 font-medium"
          >
            <Trash2 className="size-4 mr-2" />
            Eliminar Negocio
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal Dialog Overlay */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-scale-in">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground tracking-tight flex items-center gap-2">
                <ShieldAlert className="size-5 text-destructive shrink-0" />
                ¿Estás completamente seguro?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Esta acción <strong>NO</strong> se puede deshacer. Se eliminará de forma irreversible el negocio <strong>{selectedService?.name}</strong> de los servidores de Gesti.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded">
                {deleteError}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">
                Por favor, escribe <strong className="text-foreground">{selectedService?.name}</strong> para confirmar:
              </label>
              <Input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Nombre del negocio"
                className="font-mono text-sm"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmName("")
                  setDeleteError(null)
                }}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={confirmName !== selectedService?.name || isDeleting}
                onClick={handleDeleteBusiness}
                className="font-semibold"
              >
                {isDeleting ? "Eliminando..." : "Eliminar permanentemente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
