import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { Edit2, Trash2, ArrowUp, ArrowDown, Check, X, Plus } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  description: string | null
  display_order: number
}

export function CategoriesPage() {
  const navigate = useNavigate()
  const { selectedService } = useAuthStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form states for creation
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newOrder, setNewOrder] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editOrder, setEditOrder] = useState(0)

  const fetchCategories = async () => {
    if (!selectedService) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description, display_order")
        .eq("business_id", selectedService.id)
        .order("display_order", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error("Error fetching categories:", err)
      toast.error("Error al cargar categorías", {
        description: "No se pudieron obtener las categorías de servicios desde el servidor."
      })
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !selectedService) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("service_categories")
        .insert({
          business_id: selectedService.id,
          name: newName.trim(),
          description: newDescription.trim() || null,
          display_order: newOrder,
        })

      if (error) throw error

      toast.success("Categoría creada con éxito", {
        description: `La categoría "${newName.trim()}" ha sido registrada correctamente.`
      })

      setNewName("")
      setNewDescription("")
      setNewOrder(categories.length + 1)
      await fetchCategories()
    } catch (err) {
      console.error("Error creating category:", err)
      toast.error("Error de creación", {
        description: "No se pudo registrar la nueva categoría de servicios."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}"? Los servicios asociados quedarán sin categoría.`)) {
      try {
        const { error } = await supabase
          .from("service_categories")
          .delete()
          .eq("id", id)

        if (error) throw error

        toast.success("Categoría eliminada", {
          description: `La categoría "${name}" ha sido eliminada.`
        })

        setCategories(categories.filter((c) => c.id !== id))
      } catch (err) {
        console.error("Error deleting category:", err)
        toast.error("Error de eliminación", {
          description: "No se pudo eliminar la categoría."
        })
      }
    }
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDescription(cat.description || "")
    setEditOrder(cat.display_order)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return

    try {
      const { error } = await supabase
        .from("service_categories")
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          display_order: editOrder,
        })
        .eq("id", id)

      if (error) throw error

      toast.success("Categoría actualizada", {
        description: `Los cambios en "${editName.trim()}" se guardaron exitosamente.`
      })

      setEditingId(null)
      await fetchCategories()
    } catch (err) {
      console.error("Error updating category:", err)
      toast.error("Error de actualización", {
        description: "No se pudo guardar la información de la categoría."
      })
    }
  }

  const moveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const currentCat = categories[index]
    const targetCat = categories[targetIndex]

    // Swap orders
    try {
      const { error: err1 } = await supabase
        .from("service_categories")
        .update({ display_order: targetCat.display_order })
        .eq("id", currentCat.id)

      if (err1) throw err1

      const { error: err2 } = await supabase
        .from("service_categories")
        .update({ display_order: currentCat.display_order })
        .eq("id", targetCat.id)

      if (err2) throw err2

      await fetchCategories()
    } catch (err) {
      console.error("Error swapping category order:", err)
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
    <div className="w-full space-y-8 text-foreground">
      <PageHeader
        onBackClick={() => navigate("/dashboard/services")}
        showBackButton
        title="Categorías de Servicios"
        description="Organiza tus servicios en secciones y define el orden en que los verán tus clientes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Creation Form */}
        <div className="border border-border rounded-xl bg-card p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-lg">Nueva Categoría</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
              <Input
                required
                type="text"
                placeholder="Ej. Cortes, Masajes, Asesorías"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Descripción (Opcional)</label>
              <Textarea
                placeholder="Breve descripción de la categoría"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Prioridad de visualización (Orden)</label>
              <Input
                type="number"
                placeholder="0"
                value={newOrder}
                onChange={(e) => setNewOrder(Number(e.target.value))}
              />
              <p className="text-[10px] text-muted-foreground">
                Las categorías con menor número se muestran primero al cliente.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-medium"
            >
              <Plus className="size-4 mr-2" />
              Crear Categoría
            </Button>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2 border border-border rounded-xl bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase font-semibold">
                  <th className="p-4 w-12 text-center">Orden</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Descripción</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs font-medium">
                      No has creado categorías. Agrega una a la izquierda para comenzar.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => {
                    const isEditing = editingId === cat.id
                    return (
                      <tr key={cat.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-16 h-8 text-center mx-auto"
                              value={editOrder}
                              onChange={(e) => setEditOrder(Number(e.target.value))}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold">{cat.display_order}</span>
                              <div className="flex gap-0.5">
                                <button
                                  onClick={() => moveOrder(index, "up")}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded disabled:opacity-30"
                                >
                                  <ArrowUp className="size-3" />
                                </button>
                                <button
                                  onClick={() => moveOrder(index, "down")}
                                  disabled={index === categories.length - 1}
                                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded disabled:opacity-30"
                                >
                                  <ArrowDown className="size-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-medium">
                          {isEditing ? (
                            <Input
                              type="text"
                              className="h-8"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          ) : (
                            cat.name
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">
                          {isEditing ? (
                            <Input
                              type="text"
                              className="h-8"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                            />
                          ) : (
                            cat.description || "Sin descripción"
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveEdit(cat.id)}
                                className="border-[#10b981]/30 hover:bg-[#10b981]/10 text-[#10b981]"
                              >
                                <Check className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                                className="hover:bg-muted"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(cat)}
                                className="hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(cat.id, cat.name)}
                                className="hover:border-destructive/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
