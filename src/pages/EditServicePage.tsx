import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { Check, X, Plus } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

export function EditServicePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { selectedService } = useAuthStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("0.00")
  const [currency, setCurrency] = useState("USD")
  const [duration, setDuration] = useState("30")
  const [categoryId, setCategoryId] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Quick Category Creation Inline State
  const [showInlineCat, setShowInlineCat] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [isCreatingCat, setIsCreatingCat] = useState(false)

  const fetchServiceAndCategories = async () => {
    if (!selectedService || !id) return
    setIsLoading(true)
    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("business_id", selectedService.id)
        .order("display_order", { ascending: true })

      if (catError) throw catError
      setCategories(catData || [])

      // 2. Fetch service data
      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single()

      if (serviceError) throw serviceError

      if (serviceData) {
        setName(serviceData.name)
        setDescription(serviceData.description || "")
        setPrice(String(serviceData.price))
        setCurrency(serviceData.currency || "USD")
        setDuration(String(serviceData.duration_minutes ?? serviceData.duration ?? 30))
        setCategoryId(serviceData.category_id || "")
        setImageUrl(serviceData.image_url || "")
        setIsActive(serviceData.is_active ?? true)
      }
    } catch (err) {
      console.error("Error loading service data:", err)
      toast.error("Error al cargar datos", {
        description: "No se pudo recuperar la información del servicio."
      })
      navigate("/dashboard/services")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }
    fetchServiceAndCategories()
  }, [selectedService, id, navigate])

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !selectedService) return
    setIsCreatingCat(true)
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .insert({
          business_id: selectedService.id,
          name: newCatName.trim(),
          display_order: categories.length,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Categoría creada", {
        description: `Se creó la categoría "${newCatName.trim()}" e ingresó automáticamente al selector.`
      })

      setCategories([...categories, data])
      setCategoryId(data.id)
      setNewCatName("")
      setShowInlineCat(false)
    } catch (err) {
      console.error("Error creating category inline:", err)
      toast.error("Error de creación", {
        description: "No se pudo registrar la categoría inline."
      })
    } finally {
      setIsCreatingCat(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !selectedService || !id) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("services")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price) || 0,
          currency: currency,
          duration: parseInt(duration, 10) || 30,
          duration_minutes: parseInt(duration, 10) || 30,
          category_id: categoryId || null,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
        })
        .eq("id", id)

      if (error) throw error

      toast.success("Servicio actualizado", {
        description: `Los cambios para "${name.trim()}" han sido guardados correctamente.`
      })

      navigate("/dashboard/services")
    } catch (err) {
      console.error("Error updating service:", err)
      toast.error("Error de actualización", {
        description: "Ocurrió un error al intentar actualizar el servicio."
      })
    } finally {
      setIsSaving(false)
    }
  }

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
      <PageHeader
        onBackClick={() => navigate("/dashboard/services")}
        showBackButton
        title="Editar Servicio"
        description="Modifica los datos del servicio seleccionado y actualízalo en tu catálogo."
      />

      <div className="space-y-4">
        <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Configuración general</h2>

        <form onSubmit={handleSubmit} className="border border-border rounded-xl bg-card overflow-hidden">
          {/* Service Name */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Nombre del servicio *</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Ej. Corte de Cabello Premium, Consulta Médica...</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Descripción</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Detalle del servicio para el cliente.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Escribe de qué se trata el servicio, materiales incluidos, etc."
              />
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Precio *</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Costo del servicio para el público.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Currency */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Moneda *</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Tipo de divisa para este servicio.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              >
                <option value="USD" className="bg-card text-foreground">Dólares (USD - $)</option>
                <option value="PEN" className="bg-card text-foreground">Soles (PEN - S/.)</option>
                <option value="EUR" className="bg-card text-foreground">Euros (EUR - €)</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Duración (Minutos) *</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Duración estimada del servicio.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Input
                required
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Categoría *</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Grupo al que pertenece el servicio.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              {!showInlineCat ? (
                <div className="flex gap-2">
                  <select
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="" className="bg-card text-foreground">Sin Categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-card text-foreground">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInlineCat(true)}
                    className="shrink-0 size-9 p-0"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 border border-border p-3 rounded-lg bg-muted/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nueva Categoría Inline
                  </p>
                  <Input
                    type="text"
                    placeholder="Nombre de la categoría"
                    className="h-8"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowInlineCat(false)}
                      className="h-7 text-xs"
                    >
                      <X className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isCreatingCat}
                      onClick={handleCreateCategory}
                      className="h-7 text-xs bg-[#10b981] hover:bg-[#059669] text-white"
                    >
                      <Check className="size-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Public Visibility */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
            <div className="md:w-1/3">
              <label className="text-sm font-medium">Visibilidad pública</label>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {isActive ? "Disponible para clientes en el catálogo." : "Guardado como borrador privado."}
              </p>
            </div>
            <div className="md:w-2/3 max-w-md w-full flex items-center justify-start">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? "bg-[#10b981]" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Footer */}
          <div className="bg-muted/10 p-4 flex justify-between items-center border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/services")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-medium"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>

      {/* Multimedia Settings Card (Cloudflare Integration Prepared) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Multimedia</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Sube y gestiona las fotos de tu servicio utilizando Cloudflare.</p>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden p-6 space-y-6 shadow-sm">
          {/* Cloudflare Upload Area Placeholder */}
          <div 
            onClick={() => {
              const url = window.prompt("Introduce la URL de una imagen para asociarla al servicio (Temporal - Pre-integración Cloudflare):")
              if (url) {
                setImageUrl(url)
                toast.success("Imagen agregada", {
                  description: "La imagen se ha enlazado exitosamente al servicio."
                })
              }
            }}
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer group"
          >
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Haz clic para subir imágenes</p>
            <p className="text-xs text-muted-foreground mt-1">Soporta PNG, JPG, WEBP de hasta 5MB (Integración Cloudflare preparada)</p>
          </div>

          {/* Gallery Preview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Galería del Servicio</h3>
            
            {imageUrl ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="relative group rounded-lg overflow-hidden border border-border h-28 bg-muted">
                  <img src={imageUrl} alt="Portada" className="w-full h-full object-cover" />
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        toast.success("Foto establecida como principal", {
                          description: "Esta imagen se mostrará como portada en el marketplace."
                        })
                      }}
                      className="p-1.5 bg-background hover:bg-muted text-foreground rounded-md transition-colors"
                      title="Imagen principal"
                    >
                      <Check className="size-3.5 text-emerald-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("¿Deseas remover esta imagen del servicio?")) {
                          setImageUrl("")
                          toast.success("Imagen removida", {
                            description: "Se quitó la imagen de la galería."
                          })
                        }
                      }}
                      className="p-1.5 bg-background hover:bg-muted text-destructive rounded-md transition-colors"
                      title="Eliminar imagen"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  
                  {/* Badge Portada */}
                  <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 bg-black/60 text-white rounded uppercase tracking-wider select-none">
                    Portada
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-border rounded-xl bg-muted/5 text-xs text-muted-foreground">
                No hay imágenes cargadas para este servicio. Haz clic arriba para añadir una imagen.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
