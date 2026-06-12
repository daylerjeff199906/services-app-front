import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"

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

interface DaySchedule {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

export function HoursPage() {
  const navigate = useNavigate()
  const { selectedService } = useAuthStore()

  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
          open_time: "09:00",
          close_time: "18:00",
          is_closed: d.value === 0, // closed on Sundays by default
        }
      })

      // Merge with fetched data
      if (data && data.length > 0) {
        data.forEach((row: any) => {
          // Format times from HH:MM:SS to HH:MM
          const open = row.open_time ? row.open_time.substring(0, 5) : "09:00"
          const close = row.close_time ? row.close_time.substring(0, 5) : "18:00"
          defaultSchedule[row.day_of_week] = {
            day_of_week: row.day_of_week,
            open_time: open,
            close_time: close,
            is_closed: row.is_closed,
          }
        })
      }

      setSchedule(defaultSchedule)
    } catch (err) {
      console.error("Error loading business hours:", err)
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
  }

  const handleTimeChange = (dayVal: number, field: "open_time" | "close_time", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayVal]: {
        ...prev[dayVal],
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!selectedService) return
    setIsSaving(true)

    try {
      const rowsToSave = Object.values(schedule).map((row) => ({
        business_id: selectedService.id,
        day_of_week: row.day_of_week,
        open_time: `${row.open_time}:00`,
        close_time: `${row.close_time}:00`,
        is_closed: row.is_closed,
      }))

      const { error } = await supabase
        .from("business_hours")
        .upsert(rowsToSave, { onConflict: "business_id,day_of_week" })

      if (error) throw error
      alert("Horarios guardados exitosamente.")
      navigate("/dashboard")
    } catch (err) {
      console.error("Error saving business hours:", err)
      alert("Error al guardar los horarios. ¿Ejecutaste el script SQL en Supabase?")
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
    <div className="px-8 w-full mx-auto space-y-8 text-foreground">
      <PageHeader
        onBackClick={() => navigate("/dashboard")}
        showBackButton
        title="Horarios de Atención"
        description="Establece los días de la semana y horarios en los que tu negocio está operativo."
      />

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-6">
          <h3 className="font-bold text-sm border-b border-border pb-4 mb-4">Disponibilidad semanal</h3>
          
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const daySched = schedule[day.value]
              if (!daySched) return null

              return (
                <div 
                  key={day.value}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4 transition-colors ${
                    daySched.is_closed ? "bg-muted/10 border-border opacity-70" : "bg-muted/5 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-8 min-w-[120px]">
                    <span className="font-bold text-sm">{day.label}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 justify-between sm:justify-end flex-1">
                    {/* Toggle closed switch */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleClosed(day.value)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          !daySched.is_closed ? "bg-[#10b981]" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            !daySched.is_closed ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-xs font-semibold select-none w-16">
                        {daySched.is_closed ? "Cerrado" : "Abierto"}
                      </span>
                    </div>

                    {/* Time Selects (Disabled if closed) */}
                    {!daySched.is_closed && (
                      <div className="flex items-center gap-2 animate-fade-in">
                        <select
                          value={daySched.open_time}
                          onChange={(e) => handleTimeChange(day.value, "open_time", e.target.value)}
                          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                        >
                          {timeOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                          ))}
                        </select>
                        <span className="text-xs text-muted-foreground font-medium">a</span>
                        <select
                          value={daySched.close_time}
                          onChange={(e) => handleTimeChange(day.value, "close_time", e.target.value)}
                          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                        >
                          {timeOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer save row */}
        <div className="bg-muted/10 px-6 py-4 flex justify-between items-center border-t border-border">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-medium"
          >
            {isSaving ? "Guardando..." : "Guardar Horarios"}
          </Button>
        </div>
      </div>
    </div>
  )
}
