import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { FormFooter } from "@/components/ui/form-footer"
import { Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export function CreateLocationPage() {
  const navigate = useNavigate()
  const { selectedService } = useAuthStore()

  // Form states
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")

  // General business contact numbers (to check)
  const [bizPhones, setBizPhones] = useState<string[]>([])
  const [associatedPhones, setAssociatedPhones] = useState<string[]>([])

  // Specific local contact numbers
  const [localPhones, setLocalPhones] = useState<string[]>([])
  const [newPhone, setNewPhone] = useState("")

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Fetch business general contact numbers
  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }

    const fetchBizData = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("contact_numbers")
          .eq("id", selectedService.id)
          .single()

        if (error) throw error
        if (data) {
          setBizPhones(data.contact_numbers || [])
        }
      } catch (err) {
        console.error("Error fetching business contact numbers:", err)
      }
    }

    fetchBizData()
  }, [selectedService])

  const handleCheckboxChange = (phone: string, checked: boolean) => {
    setHasChanges(true)
    if (checked) {
      setAssociatedPhones((prev) => [...prev, phone])
    } else {
      setAssociatedPhones((prev) => prev.filter((p) => p !== phone))
    }
  }

  const handleAddLocalPhone = (e: React.MouseEvent) => {
    e.preventDefault()
    const trimmed = newPhone.trim()
    if (!trimmed) return

    if (localPhones.includes(trimmed) || associatedPhones.includes(trimmed)) {
      toast.warning("Este número ya está asociado a este local.")
      return
    }

    setLocalPhones((prev) => [...prev, trimmed])
    setNewPhone("")
    setHasChanges(true)
  }

  const handleRemoveLocalPhone = (index: number) => {
    setLocalPhones((prev) => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true)
    } else {
      navigate("/dashboard/agenda/locations")
    }
  }

  const handleSaveTrigger = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !address.trim()) {
      toast.warning("Por favor, completa los campos requeridos (*).")
      return
    }
    setShowSaveDialog(true)
  }

  const executeSave = async () => {
    if (!selectedService) return
    setIsSaving(true)
    setShowSaveDialog(false)

    // Merge associated business phones and specific local phones
    const combinedPhones = Array.from(new Set([...associatedPhones, ...localPhones]))

    const newLocation = {
      business_id: selectedService.id,
      name: name.trim(),
      address: address.trim(),
      city: city.trim() || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      phone: combinedPhones[0] || null, // fallback phone string column
      contact_numbers: combinedPhones, // TEXT[] column
    }

    try {
      const { error } = await supabase
        .from("business_locations")
        .insert(newLocation)

      if (error) throw error

      toast.success("Local creado con éxito.")
      setHasChanges(false)
      setTimeout(() => {
        navigate("/dashboard/agenda/locations")
      }, 1000)
    } catch (err) {
      console.error("Error creating location:", err)
      toast.error("Error al guardar el local. ¿Ejecutaste el script SQL de migración en Supabase?")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="px-8 max-w-4xl mx-auto space-y-10 text-foreground pb-20">
      <PageHeader
        onBackClick={handleCancel}
        showBackButton
        title="Nuevo Local"
        description="Agrega un local físico para asociarlo a tus turnos y reservas de servicio."
      />

      <form onSubmit={handleSaveTrigger} className="border border-border rounded-xl bg-card overflow-hidden">
        {/* Name */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3">
            <label className="text-sm font-semibold">Nombre del local *</label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Ej. Sede Central, Sucursal Norte, Sede Miraflores</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              type="text"
              required
              placeholder="Nombre identificativo de la sede"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setHasChanges(true)
              }}
            />
          </div>
        </div>

        {/* Address */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3">
            <label className="text-sm font-semibold">Dirección física *</label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Calle, Avenida, Número y Referencias de ubicación</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              type="text"
              required
              placeholder="Ej. Av. Larco 777, Oficina 402"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setHasChanges(true)
              }}
            />
          </div>
        </div>

        {/* City */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3">
            <label className="text-sm font-semibold">Ciudad / Distrito</label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Ubicación geográfica general</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              type="text"
              placeholder="Ej. Miraflores, Lima"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setHasChanges(true)
              }}
            />
          </div>
        </div>

        {/* Coordinates */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3">
            <label className="text-sm font-semibold">Coordenadas GPS</label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Latitud y Longitud para geolocalización en mapas.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground font-sans">Latitud</span>
              <Input
                type="number"
                step="any"
                placeholder="Ej. -12.0463"
                value={latitude}
                onChange={(e) => {
                  setLatitude(e.target.value)
                  setHasChanges(true)
                }}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground font-sans">Longitud</span>
              <Input
                type="number"
                step="any"
                placeholder="Ej. -77.0310"
                value={longitude}
                onChange={(e) => {
                  setLongitude(e.target.value)
                  setHasChanges(true)
                }}
              />
            </div>
          </div>
        </div>

        {/* Phones list */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3">
            <label className="text-sm font-semibold">Números de contacto</label>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Asocia números generales del negocio o agrega números específicos para este local.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full space-y-6">
            {/* General business phones checkboxes */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Teléfonos generales del negocio</span>
              {bizPhones.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No hay teléfonos generales registrados en el negocio.</p>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {bizPhones.map((phone) => {
                    const isChecked = associatedPhones.includes(phone)
                    return (
                      <label key={phone} className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckboxChange(phone, e.target.checked)}
                          className="rounded border-input text-[#10b981] focus:ring-[#10b981] size-3.5 cursor-pointer"
                        />
                        <span className="font-mono text-muted-foreground/90">{phone}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Custom local phones tags */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Teléfonos específicos de esta sede</span>
              
              <div className="flex items-center gap-2">
                <Input
                  type="tel"
                  placeholder="Ej. +51 987 654 321"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddLocalPhone(e as any)
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddLocalPhone}
                  disabled={!newPhone.trim()}
                  className="bg-[#10b981] hover:bg-[#059669] text-white shrink-0"
                >
                  Agregar
                </Button>
              </div>

              {localPhones.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {localPhones.map((phone, idx) => (
                    <div
                      key={`${phone}-${idx}`}
                      className="flex items-center gap-1.5 px-3 py-1 bg-muted border border-border rounded-full text-xs font-semibold animate-fade-in"
                    >
                      <span className="font-mono">{phone}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocalPhone(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors border-0 bg-transparent p-0 cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <FormFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-[#10b981] hover:bg-[#059669] text-white font-medium"
          >
            Crear Local
          </Button>
        </FormFooter>
      </form>

      {/* Cancel Confirmation Dialog Overlay */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-scale-in">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground tracking-tight flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500 shrink-0" />
                ¿Descartar cambios del local?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Tienes modificaciones sin guardar en el formulario. Si sales ahora, perderás la información ingresada.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
              >
                Seguir editando
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setShowCancelDialog(false)
                  navigate("/dashboard/agenda/locations")
                }}
                className="font-semibold"
              >
                Descartar y salir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Dialog Overlay */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-scale-in">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground tracking-tight flex items-center gap-2">
                <AlertTriangle className="size-5 text-[#10b981] shrink-0" />
                ¿Guardar nuevo local?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Se registrará la nueva sucursal física <strong>"{name}"</strong> en tu negocio y quedará disponible para turnos de atención.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={executeSave}
                disabled={isSaving}
                className="bg-[#10b981] hover:bg-[#059669] text-white font-semibold"
              >
                {isSaving ? "Creando..." : "Confirmar y Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
