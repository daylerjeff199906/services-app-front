import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import {
  Check,
  ChevronRight,
  Smartphone,
  Globe,
  Landmark,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight
} from "lucide-react"

export function DashboardPage() {
  const navigate = useNavigate()
  const { selectedService } = useAuthStore()

  // Onboarding states
  const [onboardingStatus, setOnboardingStatus] = useState({
    isIndependent: null as boolean | null,
    isActive: false,
    hasName: false,
    hasDescription: false,
    hasContacts: false,
    hasSocials: false,
    locationsCount: 0,
    businessHoursCount: 0,
    servicesCount: 0,
    teamMembersCount: 0,
    staffHoursCount: 0,
    bookingsCount: 0,
  })
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true)
  const [sqlWarning, setSqlWarning] = useState(false)

  const fetchOnboardingStatus = async () => {
    if (!selectedService) return
    setIsLoadingOnboarding(true)
    setSqlWarning(false)

    try {
      // 1. Fetch business details
      let bizData: any = null
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("name, description, contact_numbers, social_links, is_independent, is_active")
          .eq("id", selectedService.id)
          .single()
        
        if (error) {
          const { data: fbData, error: fbError } = await supabase
            .from("businesses")
            .select("name, description, contact_numbers, is_independent, is_active")
            .eq("id", selectedService.id)
            .single()
          
          if (fbError) {
            const { data: minData, error: minError } = await supabase
              .from("businesses")
              .select("name, description, is_independent, is_active")
              .eq("id", selectedService.id)
              .single()
            if (minError) throw minError
            bizData = minData
          } else {
            bizData = fbData
          }
        } else {
          bizData = data
        }
      } catch (bizErr) {
        console.error("Error fetching business details:", bizErr)
      }

      const isIndependent = bizData?.is_independent ?? null
      const isActive = bizData?.is_active ?? false
      const hasName = !!bizData?.name?.trim()
      const hasDescription = !!bizData?.description?.trim()
      const hasContacts = bizData?.contact_numbers && bizData.contact_numbers.length > 0
      const hasSocials = bizData?.social_links && bizData.social_links.length > 0

      // 2. Fetch locations count
      let locationsCount = 0
      try {
        const { count, error } = await supabase
          .from("business_locations")
          .select("id", { count: "exact", head: true })
          .eq("business_id", selectedService.id)
        if (!error) locationsCount = count || 0
        else if (error.message?.includes("does not exist")) setSqlWarning(true)
      } catch {
        setSqlWarning(true)
      }

      // 3. Fetch business hours count
      let businessHoursCount = 0
      try {
        const { count, error } = await supabase
          .from("business_hours")
          .select("id", { count: "exact", head: true })
          .eq("business_id", selectedService.id)
        if (!error) businessHoursCount = count || 0
        else if (error.message?.includes("does not exist")) setSqlWarning(true)
      } catch {
        setSqlWarning(true)
      }

      // 4. Fetch services count
      let servicesCount = 0
      try {
        const { count, error } = await supabase
          .from("services")
          .select("id", { count: "exact", head: true })
          .eq("business_id", selectedService.id)
        if (!error) servicesCount = count || 0
        else if (error.message?.includes("does not exist")) setSqlWarning(true)
      } catch {
        setSqlWarning(true)
      }

      // 5. Fetch team members count
      let teamMembersCount = 0
      try {
        const { count, error } = await supabase
          .from("business_user_roles")
          .select("id", { count: "exact", head: true })
          .eq("business_id", selectedService.id)
        if (!error) teamMembersCount = count || 0
        else if (error.message?.includes("does not exist")) setSqlWarning(true)
      } catch {
        setSqlWarning(true)
      }

      // 6. Fetch staff schedules count
      let staffHoursCount = 0
      try {
        const { count, error } = await supabase
          .from("staff_schedules")
          .select("id", { count: "exact", head: true })
          .eq("business_id", selectedService.id)
        if (!error) staffHoursCount = count || 0
        else if (error.message?.includes("does not exist")) setSqlWarning(true)
      } catch {
        setSqlWarning(true)
      }

      // 7. Fetch bookings count
      let bookingsCount = 0
      try {
        const { count, error } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("business_id", selectedService.id)
        if (!error) bookingsCount = count || 0
        else if (error.message?.includes("does not exist")) setSqlWarning(true)
      } catch {
        setSqlWarning(true)
      }

      setOnboardingStatus({
        isIndependent,
        isActive,
        hasName,
        hasDescription,
        hasContacts,
        hasSocials,
        locationsCount,
        businessHoursCount,
        servicesCount,
        teamMembersCount,
        staffHoursCount,
        bookingsCount,
      })
    } catch (err) {
      console.error("Error fetching onboarding details:", err)
    } finally {
      setIsLoadingOnboarding(false)
    }
  }

  useEffect(() => {
    fetchOnboardingStatus()
  }, [selectedService])

  // Calculate onboarding steps
  const steps = [
    {
      id: 1,
      title: "Información básica del negocio",
      description: "Configura el nombre, descripción, números de contacto y opcionalmente enlaces de redes sociales.",
      isCompleted: onboardingStatus.hasName && onboardingStatus.hasDescription && onboardingStatus.hasContacts,
      path: "/dashboard/settings/business?return_to=/dashboard",
      actionLabel: "Completar perfil",
    },
    {
      id: 2,
      title: "Dirección del negocio / Sucursales",
      description: onboardingStatus.isIndependent === true
        ? "Configurado como negocio independiente/a domicilio (sin local físico)."
        : onboardingStatus.isIndependent === false
        ? "Registra los locales y sucursales donde atiendes."
        : "Configura si tu negocio tiene locales físicos o es a domicilio.",
      isCompleted: onboardingStatus.isIndependent === true
        ? true
        : onboardingStatus.isIndependent === false
        ? onboardingStatus.locationsCount > 0
        : false,
      path: onboardingStatus.isIndependent === null ? "/dashboard/settings/business?return_to=/dashboard" : "/dashboard/agenda/locations?return_to=/dashboard",
      actionLabel: onboardingStatus.isIndependent === null ? "Configurar tipo de negocio" : "Configurar locales",
    },
    {
      id: 3,
      title: "Establecer horarios del negocio",
      description: "Indica los días y horarios de disponibilidad operativa del negocio.",
      isCompleted: onboardingStatus.businessHoursCount > 0,
      path: "/dashboard/agenda/hours",
      actionLabel: "Definir horarios",
    },
    {
      id: 4,
      title: "Agregar primer servicio",
      description: "Crea al menos un servicio en tu catálogo de ofertas.",
      isCompleted: onboardingStatus.servicesCount > 0,
      path: "/dashboard/services/new",
      actionLabel: "Añadir servicio",
    },
    {
      id: 5,
      title: "Agregar miembros del equipo",
      description: "Invita o registra a los colaboradores y profesionales.",
      isCompleted: true, // Completado por defecto (dueño)
      path: "/dashboard/settings/business/team",
      actionLabel: "Gestionar equipo",
    },
    {
      id: 6,
      title: "Publicar negocio",
      description: "Activa la publicación de tu negocio en la plataforma para recibir reservas reales.",
      isCompleted: onboardingStatus.isActive,
      path: "/dashboard/settings/business",
      actionLabel: "Publicar ahora",
    },
  ]

  const completedCount = steps.filter(s => s.isCompleted).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)

  // Minimum functional config check (Steps 1 to 4 are the only incomplete requirements)
  const isMinimumFunctionalComplete =
    (onboardingStatus.hasName && onboardingStatus.hasDescription && onboardingStatus.hasContacts) && // Step 1
    (onboardingStatus.isIndependent === true || (onboardingStatus.isIndependent === false && onboardingStatus.locationsCount > 0)) && // Step 2
    (onboardingStatus.businessHoursCount > 0) && // Step 3
    (onboardingStatus.servicesCount > 0) // Step 4

  // Metrics
  const metrics = [
    { name: "Clientes Activos", value: onboardingStatus.bookingsCount > 0 ? "1" : "0", change: "Simulados o reales" },
    { name: "Ingresos (Mes)", value: "$0.00 PEN", change: "Sin cobros registrados" },
    { name: "Servicios Activos", value: String(onboardingStatus.servicesCount), change: "En catálogo" },
    { name: "Citas Programadas", value: String(onboardingStatus.bookingsCount), change: "En la agenda" },
  ]

  if (isLoadingOnboarding) {
    return (
      <LayoutWrapper sectionTitle="Inicio">
        <div className="space-y-6 animate-pulse text-foreground">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted border border-border rounded-xl mt-8" />
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper sectionTitle="Inicio">
      <div className="space-y-8 text-foreground">

        {isMinimumFunctionalComplete && (
          <PageHeader
            title={`Bienvenido a la consola de ${selectedService?.name || ""}`}
            description="Aquí puedes configurar tu cartera de ofertas, interactuar con clientes y revisar métricas de negocio."
            actionButton={
              <div className="flex gap-2">
                <Button onClick={() => navigate("/dashboard/services/new")} className="bg-[#10b981] hover:bg-[#059669] text-white">
                  <Plus className="size-4 mr-2" />
                  Nuevo Servicio
                </Button>
                <Button variant="outline" onClick={() => navigate("/dashboard/settings/business")}>
                  Ajustes
                </Button>
              </div>
            }
          />
        )}

        {/* SQL Warning alert if tables are missing */}
        {sqlWarning && (
          <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl flex gap-3 text-sm text-amber-500 max-w-4xl mx-auto">
            <AlertTriangle className="size-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Tablas pendientes de migración SQL</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aún no has ejecutado el script SQL en Supabase para crear las tablas de locales, horarios y citas.
                El checklist mostrará el estado simulado en 0 hasta que configures el esquema de base de datos.
              </p>
            </div>
          </div>
        )}

        {!isMinimumFunctionalComplete ? (
          // Centered Setup Guide Panel (when minimum setup is incomplete)
          <div className="flex justify-center w-full py-4">
            <div className="w-full max-w-3xl border border-border rounded-2xl bg-card overflow-hidden shadow-md space-y-6 p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
                <PageHeader
                  title="Configura tu negocio"
                  description="Completa los pasos para configurar tu negocio y empezar a recibir reservas."
                />
                <div className="flex items-center gap-4 bg-muted/20 px-4 py-2.5 rounded-xl border border-border">
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Progreso</span>
                    <span className="text-lg font-black font-mono text-[#10b981]">{completedCount} <span className="text-muted-foreground font-normal text-sm font-sans">/ {steps.length}</span></span>
                  </div>
                  {/* Progress Circle badge indicator */}
                  <div className="w-11 h-11 rounded-full border-4 border-muted flex items-center justify-center relative overflow-hidden bg-background">
                    <span className="relative z-10 text-xs font-extrabold text-foreground font-mono">
                      {progressPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress line */}
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#10b981] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* List items (1-7) */}
              <div className="space-y-3 pt-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl transition-all duration-200 gap-4 ${step.isCompleted
                      ? "bg-[#10b981]/5 border-[#10b981]/15 opacity-80"
                      : "bg-card border-border hover:border-border/80 hover:bg-muted/5 shadow-2xs"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Circle number or Check */}
                      <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${step.isCompleted
                        ? "bg-[#10b981] text-white"
                        : "bg-muted text-muted-foreground border border-border"
                        }`}>
                        {step.isCompleted ? <Check className="size-4" /> : step.id}
                      </div>
                      <div className="space-y-0.5">
                        <p className={`font-semibold text-sm ${step.isCompleted ? "text-[#10b981] line-through decoration-[#10b981]/30" : "text-foreground"}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-normal max-w-xl">{step.description}</p>
                      </div>
                    </div>

                    {/* Action Link/Btn */}
                    {!step.isCompleted ? (
                      <button
                        onClick={() => navigate(step.path || "/")}
                        className="flex items-center gap-1 text-xs text-[#10b981] hover:underline font-bold shrink-0 self-end sm:self-center bg-transparent border-0 outline-none cursor-pointer"
                      >
                        {step.actionLabel}
                        <ChevronRight className="size-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 select-none shrink-0 self-end sm:self-center">
                        Completado
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Normal Dashboard view (when minimum setup is complete)
          <>
            {/* Grid Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <div key={metric.name} className="p-6 bg-card border border-border rounded-xl">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{metric.name}</span>
                  <p className="text-3xl font-extrabold tracking-tight mt-2">{metric.value}</p>
                  <span className="text-xs text-[#10b981] font-medium block mt-2">{metric.change}</span>
                </div>
              ))}
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Info panel */}
              <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-3">Resumen de Configuración</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-xl bg-muted/5 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Locales Registrados</p>
                    <p className="text-lg font-bold">{onboardingStatus.isIndependent ? "A domicilio / Independiente" : `${onboardingStatus.locationsCount} locales`}</p>
                  </div>
                  <div className="p-4 border border-border rounded-xl bg-muted/5 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Servicios Creados</p>
                    <p className="text-lg font-bold">{onboardingStatus.servicesCount} servicios</p>
                  </div>
                  <div className="p-4 border border-border rounded-xl bg-muted/5 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Miembros en Negocio</p>
                    <p className="text-lg font-bold">{onboardingStatus.teamMembersCount} colaboradores</p>
                  </div>
                  <div className="p-4 border border-border rounded-xl bg-muted/5 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Citas Registradas</p>
                    <p className="text-lg font-bold">{onboardingStatus.bookingsCount} reservas</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-border pb-3">Estado de Agenda</h3>
                <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Clock className="size-8 text-muted-foreground/30 animate-pulse" />
                  <p>Puedes simular citas o registrar colaboradores para ver la agenda activa.</p>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/settings/business")} className="mt-2 text-xs">
                    Ver Ajustes del Negocio
                  </Button>
                </div>
              </div>
            </div>

            {/* Your Gesti Tools Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight">Tus herramientas Gesti</h3>
                <p className="text-xs text-muted-foreground">Potencia el alcance de tu marca utilizando nuestras herramientas y canales exclusivos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="p-6 border border-border bg-card rounded-2xl flex flex-col justify-between gap-6 hover:shadow-md transition-shadow group">
                  <div className="space-y-3">
                    <div className="size-10 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center shrink-0">
                      <Smartphone className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground">Aplicación Móvil Propia</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Diseña, personaliza y publica tu app de agendamiento nativa en App Store y Google Play con tu marca.
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-[#10b981] bg-transparent border-0 outline-none cursor-pointer group-hover:underline font-semibold self-start">
                    Comenzar diseño
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                {/* Card 2 */}
                <div className="p-6 border border-border bg-card rounded-2xl flex flex-col justify-between gap-6 hover:shadow-md transition-shadow group">
                  <div className="space-y-3">
                    <div className="size-10 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center shrink-0">
                      <Globe className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground">Sitio Web y Reservas</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Obtén tu enlace personalizado de reservas online para compartirlo directamente en tu perfil de Instagram o WhatsApp.
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-[#10b981] bg-transparent border-0 outline-none cursor-pointer group-hover:underline font-semibold self-start">
                    Ver enlace demo
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                {/* Card 3 */}
                <div className="p-6 border border-border bg-card rounded-2xl flex flex-col justify-between gap-6 hover:shadow-md transition-shadow group">
                  <div className="space-y-3">
                    <div className="size-10 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center shrink-0">
                      <Landmark className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground">Sala de Espera y Check-in</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Configura una fila virtual automatizada, lista de espera dinámica y un kiosko de auto-check-in para tus sucursales físicas.
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-[#10b981] bg-transparent border-0 outline-none cursor-pointer group-hover:underline font-semibold self-start">
                    Configurar kiosko
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </LayoutWrapper>
  )
}
