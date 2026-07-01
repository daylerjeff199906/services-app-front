import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import {
  Search,
  Plus,
  FolderEdit,
  Edit,
  Trash2
} from "lucide-react"

interface Category {
  id: string
  name: string
  description: string | null
  display_order: number
}

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  duration: number
  is_active: boolean
  category_id: string | null
  image_url: string | null
}

export function ServicesPage() {
  const navigate = useNavigate()
  const { selectedService } = useAuthStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  // Delete confirmation dialog states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")

  const loadData = async (search: string, status: string) => {
    if (!selectedService) return
    setIsLoading(true)
    try {
      // 1. Fetch categories
      const { data: cats, error: catsError } = await supabase
        .from("service_categories")
        .select("id, name, description, display_order")
        .eq("business_id", selectedService.id)
        .order("display_order", { ascending: true })

      if (catsError) throw catsError
      setCategories(cats || [])

      // 2. Fetch services from backend with filters
      let query = supabase
        .from("services")
        .select(`
          id,
          name,
          description,
          price,
          currency,
          duration_minutes,
          is_active,
          category_id
        `)
        .eq("business_id", selectedService.id)

      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`)
      }

      if (status === "active") {
        query = query.eq("is_active", true)
      } else if (status === "inactive") {
        query = query.eq("is_active", false)
      }

      const { data: servs, error: servsError } = await query

      if (servsError) throw servsError

      // 3. Fetch main cover images from multimedia table
      const { data: mediaData, error: mediaError } = await supabase
        .from("multimedia")
        .select("service_id, url")
        .eq("business_id", selectedService.id)
        .eq("is_main", true)

      if (mediaError) {
        console.warn("Could not load multimedia items:", mediaError)
      }

      const mapped = (servs || []).map((s: any) => {
        const mainImage = (mediaData || []).find((m: any) => m.service_id === s.id)
        return {
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          currency: s.currency || "USD",
          duration: s.duration_minutes ?? s.duration ?? 30,
          is_active: s.is_active,
          category_id: s.category_id,
          image_url: mainImage ? mainImage.url : null,
        }
      })

      setServices(mapped)
    } catch (err) {
      console.error("Error loading services:", err)
      toast.error("Error de carga", {
        description: "No se pudieron obtener los servicios desde el servidor."
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger loadData when searchQuery or statusFilter changes with debounce
  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }
    const handler = setTimeout(() => {
      loadData(searchQuery, statusFilter)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery, statusFilter, selectedService, navigate])

  const executeDeleteService = async () => {
    if (!deleteConfirmId) return
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", deleteConfirmId)

      if (error) throw error

      toast.success("Servicio eliminado", {
        description: `El servicio "${deleteConfirmName}" ha sido eliminado del catálogo.`
      })

      setServices(services.filter((s) => s.id !== deleteConfirmId))
    } catch (err) {
      console.error("Error deleting service:", err)
      toast.error("Error de eliminación", {
        description: "Ocurrió un error al intentar eliminar el servicio."
      })
    } finally {
      setDeleteConfirmId(null)
      setDeleteConfirmName("")
    }
  }

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === "PEN" ? "S/ " : currency === "EUR" ? "€" : "$";
    return `${symbol}${Number(price).toFixed(2)}`;
  }

  return (
    <div className="w-full space-y-8 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Catálogo de Servicios"
          description="Administra los servicios que ofrece tu negocio, sus precios, duraciones y categorías."
        />

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/services/categories")}
            className="font-medium"
          >
            <FolderEdit className="size-4 mr-2" />
            Categorías
          </Button>

          <Button
            onClick={() => navigate("/dashboard/services/new")}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-medium"
          >
            <Plus className="size-4 mr-2" />
            Nuevo servicio
          </Button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-sm outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex h-9 w-40 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          >
            <option value="all" className="bg-card text-foreground">Todos</option>
            <option value="active" className="bg-card text-foreground">Activos</option>
            <option value="inactive" className="bg-card text-foreground">Borradores</option>
          </select>
        </div>
      </div>

      {/* Services Table List */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase font-semibold">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" className="rounded border-input text-primary focus:ring-primary/20" disabled />
              </th>
              <th className="p-4">Nombre del Servicio</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Duración</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="p-4 text-center">
                    <div className="size-4 bg-muted rounded mx-auto" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-muted rounded" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-40" />
                        <div className="h-3 bg-muted rounded w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-muted rounded w-16" />
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-muted rounded w-12" />
                  </td>
                  <td className="p-4">
                    <div className="h-6 bg-muted rounded w-20" />
                  </td>
                  <td className="p-4 text-right">
                    <div className="h-8 bg-muted rounded w-24 ml-auto" />
                  </td>
                </tr>
              ))
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-16 text-center text-muted-foreground font-medium">
                  No se encontraron servicios cargados o que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              services.map((service) => {
                const categoryName = categories.find(c => c.id === service.category_id)?.name || "Sin Categoría"
                const fallbackImage = `https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=100&q=80`
                return (
                  <tr key={service.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 text-center">
                      <input type="checkbox" className="rounded border-input text-primary focus:ring-primary/20" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={service.image_url || fallbackImage}
                          alt={service.name}
                          className="size-10 rounded-md object-cover border border-border"
                        />
                        <div>
                          <p className="font-semibold text-foreground text-sm">{service.name}</p>
                          <p className="text-[11px] text-muted-foreground">Cat: {categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {formatPrice(service.price, service.currency)}
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {service.duration} min
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${service.is_active ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <span className="text-xs font-semibold text-muted-foreground select-none">
                          {service.is_active ? "Activo" : "Borrador"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => navigate(`/dashboard/services/edit/${service.id}`)}
                          className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium text-xs px-3 h-8 flex items-center gap-1.5"
                        >
                          <Edit className="size-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDeleteConfirmId(service.id)
                            setDeleteConfirmName(service.name)
                          }}
                          className="size-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Alert Dialog de Confirmación de Eliminación */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full overflow-hidden p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg  text-foreground">¿Eliminar servicio?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente el servicio <strong>"{deleteConfirmName}"</strong>? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmId(null)
                  setDeleteConfirmName("")
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={executeDeleteService}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
