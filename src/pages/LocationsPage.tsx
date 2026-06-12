import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet"

export function LocationsPage() {
  const navigate = useNavigate()
  const { selectedService } = useAuthStore()

  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Form states
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !name.trim() || !address.trim()) return

    setIsAdding(true)
    try {
      const { data, error } = await supabase
        .from("business_locations")
        .insert({
          business_id: selectedService.id,
          name: name.trim(),
          address: address.trim(),
          city: city.trim() || null,
          phone: phone.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      setLocations([...locations, data])
      setName("")
      setAddress("")
      setCity("")
      setPhone("")
      setIsOpen(false)
    } catch (err) {
      console.error("Error adding location:", err)
      alert("Error al guardar el local. Asegúrate de haber ejecutado el script SQL en Supabase.")
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (locId: string) => {
    if (!window.confirm("¿Seguro que deseas remover esta sucursal del negocio?")) return
    try {
      const { error } = await supabase
        .from("business_locations")
        .delete()
        .eq("id", locId)

      if (error) throw error
      setLocations(locations.filter(l => l.id !== locId))
    } catch (err) {
      console.error("Error deleting location:", err)
      alert("No se pudo eliminar el local.")
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
    <div className="px-8 w-full mx-auto space-y-8 text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          onBackClick={() => navigate("/dashboard")}
          showBackButton
          title="Ubicaciones de Atención"
          description="Administra los locales físicos y sucursales donde ofreces tus servicios."
        />

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="bg-[#10b981] hover:bg-[#059669] text-white font-medium shrink-0">
              <Plus className="size-4 mr-2" />
              Nuevo Local
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-6">
            <SheetHeader>
              <SheetTitle>Agregar Nuevo Local</SheetTitle>
              <SheetDescription>
                Registra una nueva sucursal física para tu negocio. Todos los campos marcados con * son obligatorios.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Nombre del local *</label>
                <Input
                  required
                  placeholder="Ej. Sede Miraflores, Centro Médico Principal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Dirección *</label>
                <Input
                  required
                  placeholder="Ej. Av. Larco 777"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Ciudad / Distrito</label>
                <Input
                  placeholder="Ej. Miraflores, Lima"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Teléfono</label>
                <Input
                  placeholder="Ej. +51 987 654 321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <SheetClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </SheetClose>
                <Button 
                  type="submit" 
                  disabled={isAdding} 
                  className="bg-[#10b981] hover:bg-[#059669] text-white"
                >
                  {isAdding ? "Guardando..." : "Crear Local"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-6">
          <h3 className="font-semibold text-sm mb-4">Sucursales del negocio</h3>
          {locations.length === 0 ? (
            <div className="py-12 border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 bg-muted/5">
              <MapPin className="size-8 text-muted-foreground/40" />
              <div className="text-center">
                <p className="text-sm font-semibold">No hay locales registrados</p>
                <p className="text-xs text-muted-foreground mt-0.5">Agrega tu primera sucursal física para empezar.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((loc) => (
                <div key={loc.id} className="p-5 border border-border rounded-xl bg-muted/5 flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-[#10b981] shrink-0" />
                      <p className="font-bold text-sm text-foreground">{loc.name}</p>
                    </div>
                    <div className="space-y-0.5 pl-6">
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{loc.address}</p>
                      {loc.city && <p className="text-[10px] text-muted-foreground font-semibold bg-muted inline-block px-1.5 py-0.5 rounded">{loc.city}</p>}
                      {loc.phone && <p className="text-xs text-muted-foreground mt-1.5">📞 {loc.phone}</p>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(loc.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 size-8"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
