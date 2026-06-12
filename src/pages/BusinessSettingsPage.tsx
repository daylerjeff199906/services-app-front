import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, ShieldAlert, Trash2 } from "lucide-react"

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
  const [isIndependent, setIsIndependent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [members, setMembers] = useState<Member[]>([])
  const [copiedId, setCopiedId] = useState(false)

  // Locations state
  const [locations, setLocations] = useState<any[]>([])
  const [newLocName, setNewLocName] = useState("")
  const [newLocAddress, setNewLocAddress] = useState("")
  const [newLocCity, setNewLocCity] = useState("")
  const [newLocPhone, setNewLocPhone] = useState("")
  const [isAddingLocation, setIsAddingLocation] = useState(false)

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
        // Fetch current business details
        const { data: bizData, error: bizError } = await supabase
          .from("businesses")
          .select("id, name, description, is_active, is_independent")
          .eq("id", selectedService.id)
          .single()

        if (bizError) throw bizError

        if (bizData) {
          setName(bizData.name)
          setDescription(bizData.description || "")
          setIsActive(bizData.is_active ?? true)
          setIsIndependent(bizData.is_independent ?? false)
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !newLocName.trim() || !newLocAddress.trim()) return
    setIsAddingLocation(true)
    try {
      const { data, error } = await supabase
        .from("business_locations")
        .insert({
          business_id: selectedService.id,
          name: newLocName.trim(),
          address: newLocAddress.trim(),
          city: newLocCity.trim() || null,
          phone: newLocPhone.trim() || null
        })
        .select()
        .single()

      if (error) throw error
      setLocations([...locations, data])
      setNewLocName("")
      setNewLocAddress("")
      setNewLocCity("")
      setNewLocPhone("")
      alert("Local agregado con éxito.")
    } catch (err) {
      console.error("Error adding location:", err)
      alert("Error al agregar el local. ¿Ejecutaste el script SQL en Supabase?")
    } finally {
      setIsAddingLocation(false)
    }
  }

  const handleDeleteLocation = async (locId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este local?")) return
    try {
      const { error } = await supabase
        .from("business_locations")
        .delete()
        .eq("id", locId)

      if (error) throw error
      setLocations(locations.filter((loc) => loc.id !== locId))
    } catch (err) {
      console.error("Error deleting location:", err)
      alert("Error al eliminar el local.")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name,
          description,
          is_active: isActive,
          is_independent: isIndependent,
        })
        .eq("id", selectedService.id)

      if (error) throw error

      // Update in local store state too
      const updatedServices = services.map((s) =>
        s.id === selectedService.id
          ? { ...s, name, description, isActive, isIndependent }
          : s
      )
      setServices(updatedServices)
      selectService({ ...selectedService, name, description, isActive, isIndependent })

      alert("Cambios guardados con éxito.")
    } catch (err) {
      console.error("Error saving business details:", err)
      alert("Error al guardar los cambios.")
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
    <div className="px-8 max-w-4xl mx-auto space-y-10 text-foreground">
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

          {/* Tipo de Negocio / Independiente */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Tipo de establecimiento</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">¿Es un local físico o un servicio a domicilio / independiente?</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full flex items-center justify-start gap-3">
              <button
                type="button"
                onClick={() => setIsIndependent(!isIndependent)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isIndependent ? "bg-[#10b981]" : "bg-muted"
                }`}
                disabled={isSubmitting}
              >
                <span
                  className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isIndependent ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                {isIndependent ? "Negocio Independiente / A domicilio (Sin local físico)" : "Establecimiento con Locales/Sucursales"}
              </span>
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

          {/* Submit panel */}
          <div className="bg-muted/10 px-6 py-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-medium"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>

      {/* Locales y Sucursales (Only if business is NOT independent) */}
      {!isIndependent && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Locales y Sucursales</h2>
          
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            {/* List Locations */}
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-sm mb-4">Ubicaciones actuales</h3>
              {locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay locales registrados en este negocio. Agrega el primero a continuación.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locations.map((loc) => (
                    <div key={loc.id} className="p-4 border border-border rounded-lg bg-muted/5 flex justify-between items-start gap-4 animate-fade-in">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{loc.name}</p>
                        <p className="text-xs text-muted-foreground">{loc.address}</p>
                        {loc.city && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">{loc.city}</span>}
                        {loc.phone && <p className="text-xs text-muted-foreground mt-1">📞 {loc.phone}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 size-8"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Location Form */}
            <form onSubmit={handleAddLocation} className="p-6 bg-muted/5 space-y-4">
              <h3 className="font-semibold text-sm">Agregar nuevo local / sucursal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nombre del local *</label>
                  <Input
                    required
                    type="text"
                    placeholder="Ej. Sede Central, Sucursal Norte"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Dirección física *</label>
                  <Input
                    required
                    type="text"
                    placeholder="Calle, Avenida, Número..."
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Ciudad (Opcional)</label>
                  <Input
                    type="text"
                    placeholder="Ej. Lima, Arequipa"
                    value={newLocCity}
                    onChange={(e) => setNewLocCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Teléfono de contacto (Opcional)</label>
                  <Input
                    type="text"
                    placeholder="Ej. +51 999 999 999"
                    value={newLocPhone}
                    onChange={(e) => setNewLocPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isAddingLocation}
                  className="bg-[#10b981] hover:bg-[#059669] text-white font-medium"
                >
                  {isAddingLocation ? "Agregando..." : "Agregar Local"}
                </Button>
              </div>
            </form>
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
