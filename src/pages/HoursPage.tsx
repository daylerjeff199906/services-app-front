import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { AlertTriangle, Trash2, Plus, LayoutGrid, Calendar } from "lucide-react"
import { FormFooter } from "@/components/ui/form-footer"
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
]

// Generate time slots in 30 minute increments
const timeOptions = Array.from({ length: 48 }).map((_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? "00" : "30"
  const formattedHour = hour.toString().padStart(2, "0")
  return `${formattedHour}:${minute}`
})

interface TimeInterval {
  open_time: string
  close_time: string
}

interface DaySchedule {
  day_of_week: number
  is_closed: boolean
  intervals: TimeInterval[]
}

const calculateDayDuration = (intervals: TimeInterval[]) => {
  let totalMins = 0
  intervals.forEach((interval) => {
    const [openH, openM] = interval.open_time.split(":").map(Number)
    const [closeH, closeM] = interval.close_time.split(":").map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM
    if (closeMinutes > openMinutes) {
      totalMins += (closeMinutes - openMinutes)
    }
  })

  if (totalMins === 0) return "0 hrs"
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  const shiftText = intervals.length === 1 ? "1 turno" : `${intervals.length} turnos`
  if (mins === 0) {
    return `${hours} hrs (${shiftText})`
  }
  return `${hours}h ${mins}m (${shiftText})`
}

export function HoursPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get("return_to") || searchParams.get("retur_to")
  const { selectedService } = useAuthStore()

  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Configuration flow indicators and dialog triggers
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // View state and inline editing
  const [viewMode, setViewMode] = useState<"grid" | "agenda">("agenda")
  const [editingInterval, setEditingInterval] = useState<{ dayVal: number; index: number } | null>(null)

  const fetchHours = async () => {
    if (!selectedService) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("business_id", selectedService.id)

      if (error) throw error

      // Initialize default schedule
      const defaultSchedule: Record<number, DaySchedule> = {}
      DAYS_OF_WEEK.forEach((d) => {
        defaultSchedule[d.value] = {
          day_of_week: d.value,
          is_closed: d.value === 0, // closed on Sundays by default
          intervals: [
            {
              open_time: "09:00",
              close_time: "18:00",
            }
          ]
        }
      })

      // Merge with fetched data
      if (data && data.length > 0) {
        setIsFirstTime(false)

        // Group fetched rows by day_of_week
        const grouped: Record<number, any[]> = {}
        data.forEach((row: any) => {
          if (!grouped[row.day_of_week]) {
            grouped[row.day_of_week] = []
          }
          grouped[row.day_of_week].push(row)
        })

        // Populate defaultSchedule with grouped rows
        Object.keys(grouped).forEach((dayKey) => {
          const dayVal = Number(dayKey)
          const rows = grouped[dayVal]

          const isClosed = rows.some((row) => row.is_closed)
          const intervals = rows
            .filter((row) => !row.is_closed)
            .map((row) => {
              const open = row.open_time ? row.open_time.substring(0, 5) : "09:00"
              const close = row.close_time ? row.close_time.substring(0, 5) : "18:00"
              return { open_time: open, close_time: close }
            })

          defaultSchedule[dayVal] = {
            day_of_week: dayVal,
            is_closed: isClosed,
            intervals: intervals.length > 0 ? intervals : [{ open_time: "09:00", close_time: "18:00" }],
          }
        })
      } else {
        setIsFirstTime(true)
      }

      setSchedule(defaultSchedule)
    } catch (err) {
      console.error("Error loading business hours:", err)
      toast.error("Error al cargar los horarios de atención.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }
    fetchHours()
  }, [selectedService])

  const handleToggleClosed = (dayVal: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayVal]: {
        ...prev[dayVal],
        is_closed: !prev[dayVal].is_closed,
      },
    }))
    setHasChanges(true)
  }

  const handleTimeChange = (dayVal: number, index: number, field: "open_time" | "close_time", value: string) => {
    setSchedule((prev) => {
      const daySched = prev[dayVal]
      const updatedIntervals = daySched.intervals.map((interval, i) =>
        i === index ? { ...interval, [field]: value } : interval
      )
      return {
        ...prev,
        [dayVal]: {
          ...daySched,
          intervals: updatedIntervals,
        },
      }
    })
    setHasChanges(true)
  }

  const handleAddInterval = (dayVal: number) => {
    setSchedule((prev) => {
      const daySched = prev[dayVal]
      const lastInterval = daySched.intervals[daySched.intervals.length - 1]
      let newOpen = "14:00"
      let newClose = "18:00"

      if (lastInterval) {
        const [lastH] = lastInterval.close_time.split(":").map(Number)
        const nextH = Math.min(lastH + 1, 23)
        const formattedH = nextH.toString().padStart(2, "0")
        newOpen = `${formattedH}:00`
        newClose = `${Math.min(nextH + 4, 23).toString().padStart(2, "0")}:00`
      }

      return {
        ...prev,
        [dayVal]: {
          ...daySched,
          intervals: [...daySched.intervals, { open_time: newOpen, close_time: newClose }],
        },
      }
    })
    setHasChanges(true)
  }

  const handleRemoveInterval = (dayVal: number, index: number) => {
    setSchedule((prev) => {
      const daySched = prev[dayVal]
      const updatedIntervals = daySched.intervals.filter((_, i) => i !== index)
      const shouldClose = updatedIntervals.length === 0

      return {
        ...prev,
        [dayVal]: {
          ...daySched,
          is_closed: shouldClose ? true : daySched.is_closed,
          intervals: shouldClose ? [{ open_time: "09:00", close_time: "18:00" }] : updatedIntervals,
        },
      }
    })
    setHasChanges(true)
  }

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true)
    } else {
      const target = returnTo || "/dashboard"
      window.location.href = target
    }
  }

  const handleSaveTrigger = () => {
    setShowSaveDialog(true)
  }

  const executeSave = async () => {
    if (!selectedService) return
    setIsSaving(true)
    setShowSaveDialog(false)

    try {
      const rowsToSave: any[] = []

      Object.values(schedule).forEach((daySched) => {
        if (daySched.is_closed) {
          rowsToSave.push({
            business_id: selectedService.id,
            day_of_week: daySched.day_of_week,
            open_time: "09:00:00",
            close_time: "18:00:00",
            is_closed: true,
          })
        } else {
          daySched.intervals.forEach((interval) => {
            rowsToSave.push({
              business_id: selectedService.id,
              day_of_week: daySched.day_of_week,
              open_time: `${interval.open_time}:00`,
              close_time: `${interval.close_time}:00`,
              is_closed: false,
            })
          })
        }
      })

      // 1. Delete existing active schedules for this business
      const { error: deleteError } = await supabase
        .from("business_hours")
        .delete()
        .eq("business_id", selectedService.id)

      if (deleteError) throw deleteError

      // 2. Insert new split schedules
      const { error: insertError } = await supabase
        .from("business_hours")
        .insert(rowsToSave)

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("constraint_violation")
        }
        throw insertError
      }

      if (isFirstTime) {
        toast.success("Horarios configurados por primera vez con éxito.")
      } else {
        toast.success("Horarios actualizados con éxito.")
      }

      setHasChanges(false)
      setTimeout(() => {
        const target = returnTo || "/dashboard"
        window.location.href = target
      }, 1200)
    } catch (err: any) {
      console.error("Error saving business hours:", err)
      if (err.message === "constraint_violation") {
        toast.error("Error: Ejecuta la consulta SQL en Supabase para habilitar múltiples turnos.")
      } else {
        toast.error("Error al guardar los horarios. ¿Ejecutaste el script SQL en Supabase?")
      }
    } finally {
      setIsSaving(false)
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
    <div className="px-8 w-full mx-auto space-y-8 text-foreground pb-20">
      <PageHeader
        onBackClick={handleCancel}
        showBackButton
        title="Horarios de Atención"
        description="Establece los días de la semana y horarios en los que tu negocio está operativo."
      />

      {/* Tabs View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-0.5">
          <h3 className="font-bold text-sm text-foreground">Visualización del Horario</h3>
          <p className="text-xs text-muted-foreground">Alterna entre vista de tarjetas o de agenda semanal.</p>
        </div>

        {/* Toggle tabs buttons */}
        <div className="flex items-center bg-muted p-1 rounded-lg border border-border self-start sm:self-auto shrink-0 animate-fade-in">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-0 cursor-pointer outline-none",
              viewMode === "grid"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            )}
          >
            <LayoutGrid className="size-3.5" />
            Tarjetas Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("agenda")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-0 cursor-pointer outline-none",
              viewMode === "agenda"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            )}
          >
            <Calendar className="size-3.5" />
            Agenda Semanal
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <>
          {/* Grid of Days */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DAYS_OF_WEEK.map((day) => {
                const daySched = schedule[day.value]
                if (!daySched) return null

                return (
                  <div
                    key={day.value}
                    className={`p-5 border rounded-xl bg-card border-border flex flex-col justify-between gap-4 transition-all duration-200 ${daySched.is_closed ? "opacity-60 bg-muted/10" : "hover:border-foreground/30 shadow-2xs"
                      }`}
                  >
                    {/* Card Header: Day and Toggle */}
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{day.label}</span>
                        {!daySched.is_closed && (
                          <span className="text-[11px] text-muted-foreground font-medium mt-0.5 animate-fade-in">
                            {calculateDayDuration(daySched.intervals)}
                          </span>
                        )}
                      </div>

                      {/* Toggle closed switch */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleClosed(day.value)}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!daySched.is_closed ? "bg-[#10b981]" : "bg-muted"
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!daySched.is_closed ? "translate-x-3.5" : "translate-x-0"
                              }`}
                          />
                        </button>
                        <span className="text-[10px] font-bold select-none w-10 text-muted-foreground">
                          {!daySched.is_closed ? "Abierto" : "Cerrado"}
                        </span>
                      </div>
                    </div>

                    {/* Card Body: Shifts list */}
                    <div className="flex-1 flex flex-col justify-between gap-4">
                      {daySched.is_closed ? (
                        <div className="flex-1 flex items-center justify-center py-6 text-xs text-muted-foreground/40 font-medium">
                          Cerrado todo el día
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            {daySched.intervals.map((interval, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 animate-fade-in justify-between">
                                <div className="flex items-center gap-1">
                                  <select
                                    value={interval.open_time}
                                    onChange={(e) => handleTimeChange(day.value, idx, "open_time", e.target.value)}
                                    className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                                  >
                                    {timeOptions.map((opt) => (
                                      <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                                    ))}
                                  </select>
                                  <span className="text-[10px] text-muted-foreground font-medium">a</span>
                                  <select
                                    value={interval.close_time}
                                    onChange={(e) => handleTimeChange(day.value, idx, "close_time", e.target.value)}
                                    className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                                  >
                                    {timeOptions.map((opt) => (
                                      <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Remove shift button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInterval(day.value, idx)}
                                  className="text-muted-foreground hover:text-destructive transition-colors border-0 bg-transparent p-1 cursor-pointer rounded hover:bg-destructive/5"
                                  title="Eliminar turno"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add shift action */}
                          <button
                            type="button"
                            onClick={() => handleAddInterval(day.value)}
                            className="flex items-center gap-1 text-[10px] text-[#10b981] hover:underline font-bold bg-transparent border-0 outline-none cursor-pointer pt-1"
                          >
                            <Plus className="size-3" />
                            Agregar turno
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        /* Weekly Calendar Agenda view */
        <div className="space-y-4 animate-fade-in">
          <div className="overflow-x-auto w-full border border-border rounded-xl bg-card shadow-sm">
            <div className="min-w-[840px] grid grid-cols-7 divide-x divide-border h-[480px]">
              {DAYS_OF_WEEK.map((day) => {
                const daySched = schedule[day.value]
                if (!daySched) return null

                return (
                  <div key={day.value} className={`flex flex-col h-full ${daySched.is_closed ? "bg-muted/10 opacity-75" : ""}`}>
                    {/* Day Column Header */}
                    <div className="p-3 border-b border-border bg-muted/20 flex flex-col justify-between items-center gap-1 shrink-0 text-center select-none">
                      <span className="font-bold text-xs text-foreground">{day.label}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {daySched.is_closed ? "Cerrado" : calculateDayDuration(daySched.intervals).split(" (")[0]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleClosed(day.value)}
                        className="text-[9px] text-[#10b981] hover:text-[#059669] font-bold hover:underline mt-1 bg-transparent border-0 cursor-pointer outline-none"
                      >
                        {daySched.is_closed ? "Abrir día" : "Cerrar día"}
                      </button>
                    </div>

                    {/* Day Column Body */}
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto bg-muted/5 min-h-0">
                      {!daySched.is_closed ? (
                        <>
                          {daySched.intervals.map((interval, idx) => (
                            <div
                              key={idx}
                              onClick={() => setEditingInterval({ dayVal: day.value, index: idx })}
                              className="p-3 bg-card border border-border rounded-lg hover:border-[#10b981] transition-all cursor-pointer shadow-2xs space-y-1 relative group hover:shadow-xs"
                            >
                              <div className="text-[9px] text-muted-foreground font-bold font-mono tracking-wider">
                                TURNO {idx + 1}
                              </div>
                              <div className="text-xs font-bold text-foreground font-mono">
                                {interval.open_time} - {interval.close_time}
                              </div>
                              <div className="text-[9px] text-muted-foreground font-semibold mt-1">
                                Total: {calculateDayDuration([interval]).split(" (")[0]}
                              </div>

                              <span className="absolute bottom-1 right-2 text-[8px] text-[#10b981] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Editar
                              </span>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddInterval(day.value)}
                            className="w-full py-2.5 border border-dashed border-border hover:border-[#10b981] hover:bg-[#10b981]/5 text-muted-foreground hover:text-[#10b981] rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer outline-none bg-transparent"
                          >
                            <Plus className="size-3" />
                            Añadir turno
                          </button>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center select-none">
                          <span className="text-[9px] text-muted-foreground/30 uppercase font-extrabold tracking-wider">
                            Sin atención
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Footer Component */}
      <FormFooter>
        <Button variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button
          onClick={handleSaveTrigger}
          disabled={isSaving}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-medium"
        >
          {isSaving ? "Guardando..." : "Guardar Horarios"}
        </Button>
      </FormFooter>

      {/* Inline Shift Editor Modal (Agenda view) */}
      {editingInterval && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-5 max-w-xs w-full space-y-4 shadow-xl relative animate-scale-in">
            <h4 className="font-bold text-sm text-foreground">
              Turno {editingInterval.index + 1} - {DAYS_OF_WEEK.find(d => d.value === editingInterval.dayVal)?.label}
            </h4>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Hora de Apertura</label>
                <select
                  value={schedule[editingInterval.dayVal].intervals[editingInterval.index].open_time}
                  onChange={(e) => handleTimeChange(editingInterval.dayVal, editingInterval.index, "open_time", e.target.value)}
                  className="w-full h-8 rounded border border-input bg-transparent text-xs text-foreground px-2 font-mono outline-none"
                >
                  {timeOptions.map((opt) => <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Hora de Cierre</label>
                <select
                  value={schedule[editingInterval.dayVal].intervals[editingInterval.index].close_time}
                  onChange={(e) => handleTimeChange(editingInterval.dayVal, editingInterval.index, "close_time", e.target.value)}
                  className="w-full h-8 rounded border border-input bg-transparent text-xs text-foreground px-2 font-mono outline-none"
                >
                  {timeOptions.map((opt) => <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  handleRemoveInterval(editingInterval.dayVal, editingInterval.index)
                  setEditingInterval(null)
                }}
                className="text-[10px] h-7 px-2 font-semibold"
              >
                Eliminar Turno
              </Button>
              <Button
                size="sm"
                onClick={() => setEditingInterval(null)}
                className="bg-[#10b981] hover:bg-[#059669] text-white text-[10px] h-7 px-3 font-semibold"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog Overlay */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-scale-in">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground tracking-tight flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500 shrink-0 animate-bounce" />
                ¿Descartar cambios realizados?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Tienes modificaciones pendientes en tu horario de atención. Si sales ahora, se perderán de forma permanente.
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
                  const target = returnTo || "/dashboard"
                  window.location.href = target
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
                ¿Guardar horarios de atención?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                {isFirstTime
                  ? "Configurarás los horarios de disponibilidad del negocio por primera vez en la plataforma."
                  : "Se actualizará la disponibilidad del negocio con los nuevos horarios seleccionados."}
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
                {isSaving ? "Guardando..." : "Confirmar y Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
