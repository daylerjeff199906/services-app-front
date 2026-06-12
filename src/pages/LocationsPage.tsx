import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { MapPin, Plus, Trash2, Pencil, AlertTriangle } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"

export function LocationsPage() {
  const navigate = useNavigate()
  const { selectedService } = useAuthStore()

  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Custom delete confirmation dialog state
  const [deleteLocId, setDeleteLocId] = useState<string | null>(null)
  const [deleteLocName, setDeleteLocName] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchLocations = async () => {
    if (!selectedService) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("business_locations")
        .select("*")
        .eq("business_id", selectedService.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setLocations(data || [])
    } catch (err) {
      console.error("Error loading locations:", err)
      toast.error("Error al cargar las ubicaciones.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }
    fetchLocations()
  }, [selectedService])

  const triggerDelete = (id: string, name: string) => {
    setDeleteLocId(id)
    setDeleteLocName(name)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteLocId) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("business_locations")
        .delete()
        .eq("id", deleteLocId)

      if (error) throw error

      setLocations((prev) => prev.filter((l) => l.id !== deleteLocId))
      toast.success(`El local "${deleteLocName}" ha sido eliminado.`)
      setDeleteLocId(null)
    } catch (err) {
      console.error("Error deleting location:", err)
      toast.error("No se pudo eliminar el local. Intenta nuevamente.")
    } finally {
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
    <div className="px-8 w-full mx-auto space-y-8 text-foreground pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          onBackClick={() => navigate("/dashboard/settings/business")}
          showBackButton
          title="Ubicaciones de Atención"
          description="Administra los locales físicos y sucursales donde ofreces tus servicios."
        />

        <Button
          onClick={() => navigate("new")}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-medium shrink-0"
        >
          <Plus className="size-4 mr-2" />
          Nuevo Local
        </Button>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-6">
          <h3 className="font-semibold text-sm mb-4">Sucursales del negocio</h3>
          
          {locations.length === 0 ? (
            <EmptyState
              title="No hay locales registrados"
              description="Agrega tu primera sucursal física para empezar a recibir citas en locales específicos."
              icon={MapPin}
              action={
                <Button
                  onClick={() => navigate("new")}
                  className="bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold"
                >
                  <Plus className="size-3.5 mr-1.5" />
                  Agregar primer local
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((loc) => {
                const hasCoordinates = loc.latitude !== null && loc.longitude !== null
                const hasContact = (loc.contact_numbers && loc.contact_numbers.length > 0) || loc.phone
                
                return (
                  <div
                    key={loc.id}
                    className="p-5 border border-border rounded-xl bg-muted/5 flex justify-between items-start gap-4 hover:border-foreground/20 transition-all shadow-2xs"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-[#10b981] shrink-0" />
                        <p className="font-bold text-sm text-foreground truncate">{loc.name}</p>
                      </div>
                      
                      <div className="space-y-1 pl-6">
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed truncate-2-lines">
                          {loc.address}
                        </p>
                        
                        <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                          {loc.city && (
                            <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded border border-border">
                              {loc.city}
                            </span>
                          )}
                          
                          {hasCoordinates && (
                            <span className="text-[9px] text-[#10b981] font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-[#10b981]/25 font-mono">
                              GPS: {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                            </span>
                          )}
                        </div>

                        {hasContact && (
                          <div className="text-xs text-muted-foreground/85 mt-2 flex flex-wrap gap-x-1.5 gap-y-1 items-center font-medium">
                            <span className="text-muted-foreground">📞</span>
                            {loc.contact_numbers && loc.contact_numbers.length > 0 ? (
                              <span className="font-mono">{loc.contact_numbers.join(" | ")}</span>
                            ) : (
                              <span className="font-mono">{loc.phone}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`edit/${loc.id}`)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 size-8"
                        title="Editar local"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => triggerDelete(loc.id, loc.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 size-8"
                        title="Eliminar local"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog Overlay */}
      {deleteLocId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-scale-in">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground tracking-tight flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive shrink-0" />
                ¿Eliminar sucursal de atención?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                ¿Estás seguro de que deseas eliminar el local <strong>"{deleteLocName}"</strong>? Se cancelará la asociación de este local a todos los servicios y citas de tu negocio.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteLocId(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
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
