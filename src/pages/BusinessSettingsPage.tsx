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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [members, setMembers] = useState<Member[]>([])
  const [copiedId, setCopiedId] = useState(false)

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
          .select("id, name, description, is_active")
          .eq("id", selectedService.id)
          .single()

        if (bizError) throw bizError

        if (bizData) {
          setName(bizData.name)
          setDescription(bizData.description || "")
          setIsActive(bizData.is_active ?? true)
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
        setMembers(formatted)
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
        })
        .eq("id", selectedService.id)

      if (error) throw error

      // Update in local store state too
      const updatedServices = services.map((s) =>
        s.id === selectedService.id
          ? { ...s, name, description, isActive }
          : s
      )
      setServices(updatedServices)
      selectService({ ...selectedService, name, description, isActive })

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
