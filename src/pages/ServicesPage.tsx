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
  Clock, 
  DollarSign, 
  FolderEdit, 
  Edit3, 
  Trash2, 
  Layers
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
          duration,
          is_active,
          category_id,
          image_url
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
      setServices(servs || [])
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

  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el servicio "${name}"?`)) {
      try {
        const { error } = await supabase
          .from("services")
          .delete()
          .eq("id", id)

        if (error) throw error

        toast.success("Servicio eliminado", {
          description: `El servicio "${name}" ha sido eliminado del catálogo.`
        })

        setServices(services.filter((s) => s.id !== id))
      } catch (err) {
        console.error("Error deleting service:", err)
        toast.error("Error de eliminación", {
          description: "Ocurrió un error al intentar eliminar el servicio."
        })
      }
    }
  }

  // Group services by category
  const servicesByCategory = categories.reduce((acc, cat) => {
    const catServices = services.filter((s) => s.category_id === cat.id)
    acc[cat.id] = catServices
    return acc
  }, {} as Record<string, Service[]>)

  // Uncategorized services
  const uncategorizedServices = services.filter(
    (s) => !s.category_id || !categories.some((c) => c.id === s.category_id)
  )

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-64 bg-muted border border-border rounded-xl mt-8" />
      </div>
    )
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

      {/* Services Grid grouped by Categories */}
      <div className="space-y-10">
        {categories.map((cat) => {
          const catServices = servicesByCategory[cat.id] || []
          if (catServices.length === 0) return null // Hide empty categories to avoid displaying "No hay servicios..."

          return (
            <div key={cat.id} className="space-y-4">
              <div className="border-b border-border pb-2 flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  <h3 className="text-lg font-bold tracking-tight">{cat.name}</h3>
                </div>
                {cat.description && (
                  <p className="text-xs text-muted-foreground italic">{cat.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catServices.map((service) => (
                  <ServiceCardItem
                    key={service.id}
                    service={service}
                    onEdit={() => navigate(`/dashboard/services/edit/${service.id}`)}
                    onDelete={() => handleDeleteService(service.id, service.name)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Uncategorized services if any exist */}
        {uncategorizedServices.length > 0 && (
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="text-lg font-bold tracking-tight">Sin Categoría</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uncategorizedServices.map((service) => (
                <ServiceCardItem
                  key={service.id}
                  service={service}
                  onEdit={() => navigate(`/dashboard/services/edit/${service.id}`)}
                  onDelete={() => handleDeleteService(service.id, service.name)}
                />
              ))}
            </div>
          </div>
        )}

        {services.length === 0 && (
          <div className="py-16 text-center border border-border rounded-xl bg-card">
            <p className="text-sm text-muted-foreground font-medium">
              No se encontraron servicios cargados o que coincidan con la búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceCardItem({ 
  service, 
  onEdit, 
  onDelete 
}: { 
  service: Service
  onEdit: () => void
  onDelete: () => void 
}) {
  const fallbackImage = `https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80`

  return (
    <div className="group border border-border rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200 flex flex-col justify-between h-[360px]">
      <div>
        {/* Cover Image */}
        <div className="relative h-40 bg-muted overflow-hidden">
          <img
            src={service.image_url || fallbackImage}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Status Badge */}
          <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
            service.is_active 
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
          }`}>
            {service.is_active ? "Activo" : "Borrador"}
          </span>
        </div>

        {/* Content Info */}
        <div className="p-4 space-y-2">
          <h4 className="font-bold text-sm text-foreground line-clamp-1">{service.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
            {service.description || "Sin descripción proporcionada."}
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-muted/5 flex items-center justify-between mt-auto">
        <div className="flex gap-4 text-xs text-muted-foreground select-none">
          <div className="flex items-center gap-1">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{service.duration} min</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <DollarSign className="size-3.5 text-muted-foreground -mr-0.5" />
            <span>{Number(service.price).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Edit3 className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="size-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/30"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
