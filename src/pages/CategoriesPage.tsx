import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Trash2, ArrowUp, ArrowDown, Plus, Lock, Edit } from "lucide-react"
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

  // Sheet (Create/Edit) states
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [order, setOrder] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Alert Dialog states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")

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
        description: "No se pudieron obtener las categorías de servicios."
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

  const openCreateSheet = () => {
    setSheetMode("create")
    setName("")
    setDescription("")
    setOrder(categories.length)
    setActiveCategoryId(null)
    setIsSheetOpen(true)
  }

  const openEditSheet = (cat: Category) => {
    setSheetMode("edit")
    setName(cat.name)
    setDescription(cat.description || "")
    setOrder(cat.display_order)
    setActiveCategoryId(cat.id)
    setIsSheetOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !selectedService) return

    setIsSubmitting(true)
    try {
      if (sheetMode === "create") {
        const { error } = await supabase
          .from("service_categories")
          .insert({
            business_id: selectedService.id,
            name: name.trim(),
            description: description.trim() || null,
            display_order: order,
          })

        if (error) throw error

        toast.success("Categoría creada", {
          description: `La categoría "${name.trim()}" ha sido registrada.`
        })
      } else {
        if (!activeCategoryId) return
        const { error } = await supabase
          .from("service_categories")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            display_order: order,
          })
          .eq("id", activeCategoryId)

        if (error) throw error

        toast.success("Categoría actualizada", {
          description: `Los cambios para "${name.trim()}" han sido guardados.`
        })
      }

      setIsSheetOpen(false)
      fetchCategories()
    } catch (err) {
      console.error("Error saving category:", err)
      toast.error("Error al guardar", {
        description: "Ocurrió un error al intentar registrar los cambios."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const executeDelete = async () => {
    if (!deleteConfirmId) return
    try {
      const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("id", deleteConfirmId)

      if (error) throw error

      toast.success("Categoría eliminada", {
        description: `La categoría "${deleteConfirmName}" ha sido eliminada.`
      })

      setCategories(categories.filter((c) => c.id !== deleteConfirmId))
    } catch (err) {
      console.error("Error deleting category:", err)
      toast.error("Error de eliminación", {
        description: "No se pudo eliminar la categoría de servicios."
      })
    } finally {
      setDeleteConfirmId(null)
      setDeleteConfirmName("")
    }
  }

  const moveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const currentCat = categories[index]
    const targetCat = categories[targetIndex]

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

      fetchCategories()
    } catch (err) {
      console.error("Error swapping category order:", err)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          onBackClick={() => navigate("/dashboard/services")}
          showBackButton
          title="Categorías de Servicios"
          description="Organiza tus servicios en secciones y define el orden en que los verán tus clientes."
        />

        <Button
          onClick={openCreateSheet}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-medium shrink-0 self-stretch sm:self-auto"
        >
          <Plus className="size-4 mr-2" />
          Nueva categoría
        </Button>
      </div>

      {/* Categories List (Full Width Table) */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm w-full">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase font-semibold">
              <th className="p-4 w-20 text-center">Orden</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Descripción</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-16 text-center text-muted-foreground font-medium">
                  No hay categorías registradas en este negocio.
                </td>
              </tr>
            ) : (
              categories.map((cat, index) => {
                const isDefault = cat.name.toLowerCase() === "servicios generales"
                return (
                  <tr key={cat.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-bold text-foreground text-sm">{cat.display_order}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => moveOrder(index, "up")}
                            disabled={index === 0}
                            className="p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded disabled:opacity-30 transition-colors"
                            title="Subir prioridad"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOrder(index, "down")}
                            disabled={index === categories.length - 1}
                            className="p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded disabled:opacity-30 transition-colors"
                            title="Bajar prioridad"
                          >
                            <ArrowDown className="size-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {cat.name}
                    </td>
                    <td className="p-4 text-muted-foreground max-w-md truncate">
                      {cat.description || "Sin descripción"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => openEditSheet(cat)}
                          className="size-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Edit className="size-3.5" />
                        </Button>

                        {isDefault ? (
                          <Button
                            disabled
                            variant="outline"
                            className="size-8 p-0 text-muted-foreground/40 bg-muted/20 border-border cursor-not-allowed"
                            title="La categoría por defecto no se puede eliminar"
                          >
                            <Lock className="size-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDeleteConfirmId(cat.id)
                              setDeleteConfirmName(cat.name)
                            }}
                            className="size-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CRUD Slide-Over (Sheet) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md bg-card border-l border-border p-6 flex flex-col gap-6">
          <SheetHeader className="p-0">
            <SheetTitle className="text-xl font-bold">
              {sheetMode === "create" ? "Nueva Categoría" : "Editar Categoría"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {sheetMode === "create"
                ? "Agrega una nueva categoría para organizar tus servicios en el catálogo."
                : "Modifica los detalles de la categoría seleccionada."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Nombre *</label>
                <Input
                  required
                  type="text"
                  placeholder="Ej. Cortes de Cabello, Asesorías"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Descripción (Opcional)</label>
                <Textarea
                  placeholder="Describe de qué se trata esta categoría..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Prioridad de visualización (Orden)</label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Las categorías con menor número de orden se listarán primero en tu perfil público de servicios.
                </p>
              </div>
            </div>

            <SheetFooter className="p-0 flex flex-row items-center justify-between gap-3 pt-6 border-t border-border mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSheetOpen(false)}
                className="w-1/2"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 bg-[#10b981] hover:bg-[#059669] text-white font-medium"
              >
                {sheetMode === "create" ? "Crear Categoría" : "Guardar Cambios"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Alert Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full overflow-hidden p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">¿Eliminar categoría?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente la categoría <strong>"{deleteConfirmName}"</strong>?
                Los servicios asociados no se eliminarán, pero se quedarán sin categoría vinculada.
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
                onClick={executeDelete}
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
