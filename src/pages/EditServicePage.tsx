import React, { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { Check, X, Plus } from "lucide-react"
import { FormFooter } from "@/components/ui/form-footer"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { uploadToR2, deleteFromR2 } from "@/utils/r2-storage"
import { AlertDialog } from "@/components/ui/alert-dialog"


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
  isUploading?: boolean
  previewUrl?: string
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

  // R2 Upload states
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file")
  const [isDragOver, setIsDragOver] = useState(false)

  // Drag and drop / reorder state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [hasOrderChanges, setHasOrderChanges] = useState(false)

  // Delete target state
  const [deleteTarget, setDeleteTarget] = useState<MultimediaItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)


  // Cleanup object URLs of uploading items on unmount
  const multimediaRef = React.useRef(multimedia)
  useEffect(() => {
    multimediaRef.current = multimedia
  }, [multimedia])

  useEffect(() => {
    return () => {
      multimediaRef.current.forEach((item) => {
        if (item.isUploading && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
    }
  }, [])

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
  // Multimedia actions
  const uploadSingleFile = async (file: File, tempId: string, serviceId: string) => {
    try {
      // 1. Upload to R2
      let uploadedUrl = ""
      try {
        uploadedUrl = await uploadToR2(file, serviceId)
        console.log('uploadedUrl', uploadedUrl)
      } catch (r2Err: any) {
        console.error("R2 Upload Error for file:", file.name, r2Err)
        const isNetworkErr = r2Err.message?.includes("fetch") || r2Err.toString().includes("TypeError")
        throw new Error(
          isNetworkErr
            ? `Error de red o CORS al subir "${file.name}". Configura las reglas CORS de tu bucket R2.`
            : `Fallo al subir "${file.name}" a R2: ${r2Err.message || r2Err}`
        )
      }

      // Calculate display order
      let currentOrder = 0
      setMultimedia((prev) => {
        const idx = prev.findIndex(item => item.id === tempId)
        currentOrder = idx !== -1 ? idx : prev.length
        return prev
      })

      // 2. Insert into Supabase
      const isMain = multimedia.length === 0 || !multimedia.some(m => m.is_main)
      const { data, error: dbError } = await supabase
        .from("multimedia")
        .insert({
          business_id: selectedService!.id,
          service_id: serviceId,
          url: uploadedUrl,
          media_type: "image",
          display_order: currentOrder,
          is_main: isMain
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Replace placeholder with final item
      setMultimedia((prev) => {
        const updated = prev.map((item) => {
          if (item.id === tempId) {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
            return {
              ...data,
              isUploading: false,
              previewUrl: undefined
            }
          }
          return item
        })
        return updated
      })

      toast.success(`Imagen "${file.name}" subida e integrada con éxito.`)
    } catch (err: any) {
      console.error("Single file upload failed:", err)
      toast.error(`Error al subir "${file.name}"`, {
        description: err.message || "Ocurrió un error al procesar la subida."
      })
      // Remove placeholder on error
      setMultimedia((prev) => {
        const target = prev.find((item) => item.id === tempId)
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
        return prev.filter((item) => item.id !== tempId)
      })
    }
  }

  const handleFileSelection = (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return

    const totalAllowed = 10
    const currentTotal = multimedia.length
    if (currentTotal + list.length > totalAllowed) {
      toast.error("Límite de imágenes excedido", {
        description: `Solo puedes tener un máximo de ${totalAllowed} imágenes por servicio. Actualmente tienes ${currentTotal} imágenes y seleccionaste ${list.length}.`
      })
      return
    }

    let hasInvalid = false
    let hasTooLarge = false

    list.forEach((file, index) => {
      if (!file.type.startsWith("image/")) {
        hasInvalid = true
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        hasTooLarge = true
        return
      }

      const tempId = `temp_${Math.random().toString(36).substring(2, 9)}`
      const previewUrl = URL.createObjectURL(file)
      const display_order = currentTotal + index

      const placeholder: MultimediaItem = {
        id: tempId,
        url: "",
        description: null,
        media_type: "image",
        display_order,
        is_main: currentTotal === 0 && index === 0,
        isUploading: true,
        previewUrl
      }

      // Add placeholder instantly
      setMultimedia((prev) => [...prev, placeholder])
      // Trigger async upload
      uploadSingleFile(file, tempId, id!)
    })

    if (hasInvalid) {
      toast.error("Formato inválido", {
        description: "Algunos archivos no eran imágenes y fueron omitidos."
      })
    }
    if (hasTooLarge) {
      toast.error("Archivo muy grande", {
        description: "Algunas imágenes excedían los 5MB y fueron omitidas."
      })
    }
  }

  const handleAddImageUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newImgUrl.trim() || !id || !selectedService) return

    if (multimedia.length >= 10) {
      toast.error("Límite de imágenes excedido", {
        description: "Solo puedes tener un máximo de 10 imágenes por servicio."
      })
      return
    }

    setIsAddingImg(true)
    const toastId = toast.loading("Registrando imagen por URL...")
    try {
      const maxOrder = multimedia.reduce((max, item) => item.display_order > max ? item.display_order : max, -1)
      const nextOrder = maxOrder + 1
      const isMainDefault = multimedia.length === 0

      const { data, error } = await supabase
        .from("multimedia")
        .insert({
          business_id: selectedService.id,
          service_id: id,
          url: newImgUrl.trim(),
          media_type: "image",
          display_order: nextOrder,
          is_main: isMainDefault
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Imagen agregada", {
        id: toastId,
        description: "La URL de la imagen ha sido agregada exitosamente a la galería."
      })
      setNewImgUrl("")
      setMultimedia((prev) => [...prev, data])
    } catch (err) {
      console.error("Error adding image by URL:", err)
      toast.error("Error al guardar", {
        id: toastId,
        description: "No se pudo registrar la imagen en la galería."
      })
    } finally {
      setIsAddingImg(false)
    }
  }

  const handleDeleteImage = (item: MultimediaItem) => {
    setDeleteTarget(item)
  }

  const executeDeleteImage = async (item: MultimediaItem) => {
    setIsDeleting(true)
    const toastId = toast.loading("Eliminando imagen...")
    try {
      // 1. Delete from Cloudflare R2 Storage (if R2 URL)
      await deleteFromR2(item.url)

      // 2. Delete from Supabase
      const { error } = await supabase
        .from("multimedia")
        .delete()
        .eq("id", item.id)

      if (error) throw error

      toast.success("Imagen eliminada", {
        id: toastId,
        description: "Se removió la imagen del storage y de la galería."
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
        id: toastId,
        description: "No se pudo remover completamente la imagen."
      })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
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

  // HTML5 Drag and Drop Reordering Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleCardDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files)
      return
    }

    if (draggedIndex === null || draggedIndex === targetIndex) return

    const updated = [...multimedia]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, draggedItem)

    const reordered = updated.map((item, idx) => ({
      ...item,
      display_order: idx
    }))

    setMultimedia(reordered)
    setDraggedIndex(null)
    setHasOrderChanges(true)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSaveOrder = async () => {
    setIsSaving(true)
    const toastId = toast.loading("Guardando el nuevo orden de imágenes...")
    try {
      const promises = multimedia
        .filter((item) => !item.isUploading)
        .map((item) =>
          supabase
            .from("multimedia")
            .update({ display_order: item.display_order })
            .eq("id", item.id)
        )

      await Promise.all(promises)
      toast.success("Orden de galería guardado correctamente.", { id: toastId })
      setHasOrderChanges(false)
    } catch (err) {
      console.error("Error saving display order:", err)
      toast.error("No se pudo guardar el orden de las imágenes.", {
        id: toastId,
        description: "Hubo un error de comunicación con la base de datos."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelOrder = () => {
    setHasOrderChanges(false)
    fetchMultimedia()
  }

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files)
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-foreground">
      <PageHeader
        onBackClick={() => navigate("/dashboard/services")}
        showBackButton
        title="Editar Servicio"
        description="Modifica los datos del servicio seleccionado y gestiona su galería multimedia."
      />

      <div className="flex flex-col md:flex-row gap-10 items-start">
        {/* Sidebar Aside Layout */}
        <aside className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-6 md:gap-4 md:sticky md:top-8 self-start border-b md:border-b-0 border-border pb-4 md:pb-0 overflow-x-auto md:overflow-x-visible no-scrollbar">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: "info" })}
            className={`flex items-center text-sm transition-all text-left outline-none cursor-pointer whitespace-nowrap ${activeTab === "info"
                ? "border-b-2 md:border-b-0 md:border-l-[3px] border-foreground pl-0 md:pl-4 pb-2 md:pb-0 font-semibold text-foreground"
                : "border-b-2 md:border-b-0 md:border-l-[3px] border-transparent pl-0 md:pl-4 pb-2 md:pb-0 text-muted-foreground hover:text-foreground font-medium"
              }`}
          >
            Información Principal
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: "multimedia" })}
            className={`flex items-center text-sm transition-all text-left outline-none cursor-pointer whitespace-nowrap ${activeTab === "multimedia"
                ? "border-b-2 md:border-b-0 md:border-l-[3px] border-foreground pl-0 md:pl-4 pb-2 md:pb-0 font-semibold text-foreground"
                : "border-b-2 md:border-b-0 md:border-l-[3px] border-transparent pl-0 md:pl-4 pb-2 md:pb-0 text-muted-foreground hover:text-foreground font-medium"
              }`}
          >
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
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? "bg-[#10b981]" : "bg-muted"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-4" : "translate-x-0"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium tracking-tight text-muted-foreground">Multimedia del Servicio</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Agrega múltiples fotos a la galería del servicio y ordénalas según tu preferencia.</p>
                </div>
                {/* Method Selector tabs */}
                <div className="flex bg-muted p-0.5 rounded-lg border border-border self-start">
                  <button
                    type="button"
                    onClick={() => setUploadMethod("file")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-0 cursor-pointer outline-none",
                      uploadMethod === "file"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground bg-transparent"
                    )}
                  >
                    Subir Archivos
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod("url")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-0 cursor-pointer outline-none",
                      uploadMethod === "url"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground bg-transparent"
                    )}
                  >
                    Por URL
                  </button>
                </div>
              </div>

              {uploadMethod === "file" ? (
                /* FILE UPLOAD & GRID VIEW */
                <div className="space-y-4">
                  {/* Title / Description count */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Fotos · {multimedia.length}/10 - Puedes agregar un máximo de 10 fotos.
                    </span>
                  </div>

                  {isLoadingMedia ? (
                    <div className="py-12 text-center text-muted-foreground text-xs animate-pulse">
                      Cargando galería...
                    </div>
                  ) : multimedia.length === 0 ? (
                    /* Large Empty State Dropzone */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragOver(true)
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleGridDrop}
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className={cn(
                        "border border-dashed rounded-xl p-12 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[220px] bg-muted/10",
                        isDragOver ? "border-emerald-500 bg-emerald-500/10" : "border-border"
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleFileSelection(e.target.files)
                          }
                        }}
                      />
                      <div className="p-4 bg-muted/40 rounded-full text-muted-foreground">
                        {/* File plus sheet icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Agregar fotos</h3>
                        <p className="text-xs text-muted-foreground">o arrastra y suelta</p>
                      </div>
                    </div>
                  ) : (
                    /* Grid and Dropzone wrapper */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragOver(true)
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleGridDrop}
                      className={cn(
                        "border rounded-xl p-6 transition-all min-h-[160px]",
                        isDragOver ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20" : "border-border bg-card"
                      )}
                    >
                      {/* Grid layout matching slide 2/3 */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {multimedia.map((item, index) => (
                          <div
                            key={item.id}
                            draggable={!item.isUploading}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleCardDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "relative aspect-square w-full rounded-xl overflow-hidden bg-muted transition-all border group select-none",
                              item.is_main ? "border-emerald-500 shadow-md shadow-emerald-500/5" : "border-border",
                              draggedIndex === index ? "opacity-30 scale-95" : "",
                              !item.isUploading ? "cursor-grab active:cursor-grabbing" : ""
                            )}
                          >
                            <img
                              src={item.isUploading ? item.previewUrl : item.url}
                              alt="Galería"
                              className="w-full h-full object-cover select-none pointer-events-none"
                            />

                            {/* Portada label */}
                            {item.is_main && !item.isUploading && (
                              <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-md uppercase tracking-wider select-none shadow-xs z-10">
                                Portada
                              </span>
                            )}

                            {item.isUploading ? (
                              /* Three bouncing dots loader */
                              <div className="flex justify-center items-center gap-1.5 h-full w-full bg-black/55 absolute inset-0 z-25">
                                <span className="w-2 h-2 bg-white/90 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-white/90 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-white/90 rounded-full animate-bounce"></span>
                              </div>
                            ) : (
                              <>
                                {/* X button top-right */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteImage(item)
                                  }}
                                  className="absolute top-2 right-2 size-6 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                                  title="Eliminar de galería"
                                >
                                  <X className="size-3.5" />
                                </button>

                                {/* Cover trigger on hover */}
                                {!item.is_main && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSetMain(item.id)
                                    }}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium cursor-pointer"
                                  >
                                    Establecer Portada
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        ))}

                        {/* Agregar foto card at the end */}
                        {multimedia.length < 10 && (
                          <div
                            onClick={() => document.getElementById("file-upload")?.click()}
                            className="aspect-square w-full rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              id="file-upload"
                              onChange={(e) => {
                                if (e.target.files) {
                                  handleFileSelection(e.target.files)
                                }
                              }}
                            />
                            <div className="p-2 bg-muted/60 rounded-lg group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                              <Plus className="size-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                              Agregar foto
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* URL UPLOAD METHOD */
                <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold">Agregar imagen por URL</h3>
                  <form onSubmit={handleAddImageUrl} className="space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          required
                          type="url"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          value={newImgUrl}
                          onChange={(e) => setNewImgUrl(e.target.value)}
                          className="text-sm"
                          disabled={isAddingImg}
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
              )}

              {/* Order Changes Save Bar */}
              {hasOrderChanges && (
                <FormFooter variant="sticky" className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Has modificado el orden de la galería. Guarda para confirmar.
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelOrder}
                        className="h-8 text-xs font-medium"
                      >
                        Descartar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveOrder}
                        className="bg-[#10b981] hover:bg-[#059669] text-white font-medium h-8 text-xs"
                      >
                        Guardar Orden
                      </Button>
                    </div>
                  </div>
                </FormFooter>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && executeDeleteImage(deleteTarget)}
        title="¿Eliminar esta imagen?"
        description="Esta acción eliminará de forma permanente la imagen seleccionada de la galería del servicio y del almacenamiento de R2. No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
