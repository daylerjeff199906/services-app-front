import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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

export function CreateServicePage() {
  const navigate = useNavigate()
  const { selectedService } = useAuthStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
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

  const fetchCategories = async () => {
    if (!selectedService) return
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("business_id", selectedService.id)
        .order("display_order", { ascending: true })

      if (error) throw error
      setCategories(data || [])

      if (data && data.length > 0) {
        setCategoryId(data[0].id)
      }
    } catch (err) {
      console.error("Error loading categories:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }
    fetchCategories()
  }, [selectedService, navigate])

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
        description: "No se pudo crear la categoría inline en este momento."
      })
    } finally {
      setIsCreatingCat(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !selectedService) return

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from("services")
        .insert({
          business_id: selectedService.id,
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price) || 0,
          currency: currency,
          duration: parseInt(duration, 10) || 30,
          duration_minutes: parseInt(duration, 10) || 30,
          category_id: categoryId || null,
          is_active: isActive,
        })
        .select("id")
        .single()

      if (error) throw error

      toast.success("Servicio registrado", {
        description: `El servicio "${name.trim()}" ha sido agregado correctamente a tu catálogo. Ahora puedes configurar su multimedia.`
      })

      navigate(`/dashboard/services/edit/${data.id}`)
    } catch (err) {
      console.error("Error saving service:", err)
      toast.error("Error de guardado", {
        description: "Ocurrió un error al intentar crear el servicio."
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
        title="Nuevo Servicio"
        description="Agrega un servicio y publícalo en tu catálogo para que tus clientes lo reserven."
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
              Guardar Servicio
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
