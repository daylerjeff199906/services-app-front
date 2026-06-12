import React, { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { Check, X, Plus, Edit3, FolderEdit, ArrowUp, ArrowDown, Trash2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

interface MultimediaItem {
  id: string
  url: string
  description: string | null
  media_type: string
  display_order: number
  is_main: boolean
}

export function EditServicePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { selectedService } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get("tab") || "info"

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form states (Info Principal)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("0.00")
  const [currency, setCurrency] = useState("PEN")
  const [duration, setDuration] = useState("30")
  const [categoryId, setCategoryId] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Quick Category Creation Inline State
  const [showInlineCat, setShowInlineCat] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [isCreatingCat, setIsCreatingCat] = useState(false)

  // Multimedia States
  const [multimedia, setMultimedia] = useState<MultimediaItem[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [newImgUrl, setNewImgUrl] = useState("")
  const [isAddingImg, setIsAddingImg] = useState(false)

  // Ensure default tab parameter is in URL
  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "info" }, { replace: true })
    }
  }, [searchParams, setSearchParams])

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
        setCurrency(serviceData.currency || "PEN")
        setDuration(String(serviceData.duration_minutes ?? serviceData.duration ?? 30))
        setCategoryId(serviceData.category_id || "")
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

  const fetchMultimedia = async () => {
    if (!id) return
    setIsLoadingMedia(true)
    try {
      const { data, error } = await supabase
        .from("multimedia")
        .select("*")
        .eq("service_id", id)
        .order("display_order", { ascending: true })

      if (error) throw error
      setMultimedia(data || [])
    } catch (err) {
      console.error("Error loading multimedia:", err)
      toast.error("Error de carga", {
        description: "No se pudieron obtener las imágenes del servicio."
      })
    } finally {
      setIsLoadingMedia(false)
    }
  }

  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }
    fetchServiceAndCategories()
  }, [selectedService, id, navigate])

  // Fetch multimedia when tab changes or loads
  useEffect(() => {
    if (id && activeTab === "multimedia") {
      fetchMultimedia()
    }
  }, [id, activeTab])

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

  const handleSubmitInfo = async (e: React.FormEvent) => {
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

  // Multimedia actions
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newImgUrl.trim() || !id || !selectedService) return

    setIsAddingImg(true)
    try {
      const maxOrder = multimedia.reduce((max, item) => item.display_order > max ? item.display_order : max, -1)
      const nextOrder = maxOrder + 1
      const isMainDefault = multimedia.length === 0

      const { error } = await supabase
        .from("multimedia")
        .insert({
          business_id: selectedService.id,
          service_id: id,
          url: newImgUrl.trim(),
          media_type: "image",
          display_order: nextOrder,
          is_main: isMainDefault
        })

      if (error) throw error

      toast.success("Imagen agregada", {
        description: "La imagen ha sido agregada exitosamente a la galería."
      })
      setNewImgUrl("")
      fetchMultimedia()
    } catch (err) {
      console.error("Error adding image:", err)
      toast.error("Error al guardar", {
        description: "No se pudo registrar la imagen en la galería."
      })
    } finally {
      setIsAddingImg(false)
    }
  }

  const handleDeleteImage = async (item: MultimediaItem) => {
    if (!window.confirm("¿Deseas remover esta imagen del servicio?")) return
    try {
      const { error } = await supabase
        .from("multimedia")
        .delete()
        .eq("id", item.id)

      if (error) throw error

      toast.success("Imagen eliminada", {
        description: "Se quitó la imagen de la galería."
      })

      // If the deleted image was the main one, promote another image to cover
      if (item.is_main && multimedia.length > 1) {
        const remaining = multimedia.filter(m => m.id !== item.id)
        if (remaining.length > 0) {
          await supabase
            .from("multimedia")
            .update({ is_main: true })
            .eq("id", remaining[0].id)
        }
      }

      fetchMultimedia()
    } catch (err) {
      console.error("Error deleting image:", err)
      toast.error("Error de eliminación", {
        description: "No se pudo remover la imagen."
      })
    }
  }

  const handleSetMain = async (mediaId: string) => {
    try {
      // 1. Reset all to false
      const { error: err1 } = await supabase
        .from("multimedia")
        .update({ is_main: false })
        .eq("service_id", id)

      if (err1) throw err1

      // 2. Set target to true
      const { error: err2 } = await supabase
        .from("multimedia")
        .update({ is_main: true })
        .eq("id", mediaId)

      if (err2) throw err2

      toast.success("Portada establecida", {
        description: "La imagen seleccionada ahora es la portada del servicio."
      })
      fetchMultimedia()
    } catch (err) {
      console.error("Error setting main image:", err)
      toast.error("Error de actualización", {
        description: "No se pudo establecer como portada."
      })
    }
  }

  const handleMoveImage = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= multimedia.length) return

    const itemA = multimedia[index]
    const itemB = multimedia[targetIndex]

    try {
      const { error: errA } = await supabase
        .from("multimedia")
        .update({ display_order: itemB.display_order })
        .eq("id", itemA.id)

      if (errA) throw errA

      const { error: errB } = await supabase
        .from("multimedia")
        .update({ display_order: itemA.display_order })
        .eq("id", itemB.id)

      if (errB) throw errB

      fetchMultimedia()
    } catch (err) {
      console.error("Error reordering images:", err)
      toast.error("Error al reordenar")
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
        description="Modifica los datos del servicio seleccionado y gestiona su galería multimedia."
      />

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Aside Layout */}
        <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 p-1.5 bg-card border border-border rounded-xl">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: "info" })}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
              activeTab === "info"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 className="size-4" />
            Información Principal
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: "multimedia" })}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
              activeTab === "multimedia"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderEdit className="size-4" />
            Galería Multimedia
          </button>
        </aside>

        {/* Tab Content Area */}
        <div className="flex-1 w-full">
          {activeTab === "info" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Configuración general</h2>

              <form onSubmit={handleSubmitInfo} className="border border-border rounded-xl bg-card overflow-hidden">
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
                      <option value="PEN" className="bg-card text-foreground">Soles (PEN - S/.)</option>
                      <option value="USD" className="bg-card text-foreground">Dólares (USD - $)</option>
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
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Multimedia del Servicio</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Agrega múltiples fotos a la galería del servicio y ordénalas según tu preferencia.</p>
              </div>

              {/* Add New Image Form */}
              <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
                <form onSubmit={handleAddImage} className="space-y-4">
                  <h3 className="text-sm font-semibold">Añadir nueva imagen a la galería</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        required
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={newImgUrl}
                        onChange={(e) => setNewImgUrl(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isAddingImg}
                      className="bg-[#10b981] hover:bg-[#059669] text-white font-medium whitespace-nowrap"
                    >
                      <Plus className="size-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Proporciona un enlace absoluto de imagen (ej. de Unsplash o Cloudflare).</p>
                </form>
              </div>

              {/* Gallery List */}
              <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold">Imágenes cargadas</h3>

                {isLoadingMedia ? (
                  <div className="py-8 text-center text-muted-foreground text-xs animate-pulse">
                    Cargando galería...
                  </div>
                ) : multimedia.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded-xl bg-muted/5 text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="size-8 text-muted-foreground/50" />
                    <span>No hay imágenes registradas para este servicio. Agrega una arriba.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {multimedia.map((item, index) => (
                      <div
                        key={item.id}
                        className={`relative group rounded-xl overflow-hidden border transition-all flex flex-col bg-muted/10 ${
                          item.is_main ? "border-emerald-500/50 shadow-md shadow-emerald-500/5" : "border-border"
                        }`}
                      >
                        {/* Image Preview Container */}
                        <div className="aspect-video w-full bg-muted overflow-hidden relative">
                          <img
                            src={item.url}
                            alt="Galería del servicio"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Cover Badge */}
                          {item.is_main && (
                            <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-md uppercase tracking-wider select-none shadow-sm">
                              Portada
                            </span>
                          )}

                          {/* Actions Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                            {/* Reordering Controls */}
                            <Button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveImage(index, "up")}
                              className="size-8 p-0 bg-background/90 hover:bg-background text-foreground hover:scale-105 transition-transform"
                              title="Subir prioridad"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              disabled={index === multimedia.length - 1}
                              onClick={() => handleMoveImage(index, "down")}
                              className="size-8 p-0 bg-background/90 hover:bg-background text-foreground hover:scale-105 transition-transform"
                              title="Bajar prioridad"
                            >
                              <ArrowDown className="size-4" />
                            </Button>

                            {/* Set Main Cover */}
                            {!item.is_main && (
                              <Button
                                type="button"
                                onClick={() => handleSetMain(item.id)}
                                className="size-8 p-0 bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 transition-transform"
                                title="Establecer portada"
                              >
                                <Check className="size-4" />
                              </Button>
                            )}

                            {/* Delete Button */}
                            <Button
                              type="button"
                              onClick={() => handleDeleteImage(item)}
                              className="size-8 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground hover:scale-105 transition-transform"
                              title="Eliminar de galería"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Description Details Card */}
                        <div className="p-3 flex justify-between items-center text-xs border-t border-border bg-card">
                          <span className="truncate text-muted-foreground font-mono max-w-[150px]" title={item.url}>
                            {item.url}
                          </span>
                          <span className="shrink-0 text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            Orden: {item.display_order}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
