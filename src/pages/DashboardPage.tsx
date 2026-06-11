import { useAuthStore } from "../store/auth.store"
import { LayoutWrapper } from "@/components/layout-wrapper"

export function DashboardPage() {
  const { selectedService } = useAuthStore()

  // Sample static data for the selected service dashboard
  const metrics = [
    { name: "Clientes Activos", value: "148", change: "+12% esta semana" },
    { name: "Ingresos (Mes)", value: "$4,850 USD", change: "+8% vs mes anterior" },
    { name: "Ofertas Activas", value: "6", change: "2 nuevas añadidas" },
    { name: "Citas Programadas", value: "24", change: "6 programadas para hoy" },
  ]

  const recentClients = [
    { id: "c_1", name: "Carlos Mendoza", email: "carlos@gmail.com", service: "Consulta General", status: "Agendado" },
    { id: "c_2", name: "Diana Rosales", email: "diana.r@yahoo.com", service: "Terapia de Recuperación", status: "Completado" },
    { id: "c_3", name: "Esteban Quito", email: "esteban.q@outlook.com", service: "Evaluación Diagnóstica", status: "Cancelado" },
  ]

  return (
    <LayoutWrapper sectionTitle="Inicio">
      <div className="space-y-6 text-foreground">
        {/* Welcome Banner */}
        <div className="bg-card border border-border p-6 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bienvenido a la consola de {selectedService?.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Aquí puedes configurar tu cartera de ofertas, interactuar con clientes y revisar métricas de negocio.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="py-2 px-4 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md text-sm font-semibold transition-colors">
              Nueva Oferta
            </button>
            <button className="py-2 px-4 border border-input hover:bg-muted rounded-md text-sm font-semibold transition-colors">
              Ajustes de Servicio
            </button>
          </div>
        </div>

        {/* Grid Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.name} className="p-6 bg-card border border-border rounded-xl">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{metric.name}</span>
              <p className="text-3xl font-extrabold tracking-tight mt-2">{metric.value}</p>
              <span className="text-xs text-emerald-500 font-medium block mt-2">{metric.change}</span>
            </div>
          ))}
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table Recent Clients */}
          <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg">Clientes Recientes</h3>
              <button className="text-xs text-primary hover:underline font-semibold">Ver todos</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase font-bold tracking-wider">
                    <th className="py-2">Cliente</th>
                    <th className="py-2">Servicio Solicitado</th>
                    <th className="py-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/10">
                      <td className="py-3">
                        <p className="font-semibold">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </td>
                      <td className="py-3 text-muted-foreground">{client.service}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            client.status === "Agendado"
                              ? "bg-amber-500/10 text-amber-500"
                              : client.status === "Completado"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info panel */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg border-b border-border pb-3">Cartera de Ofertas</h3>
            <div className="space-y-3">
              <div className="p-3 border border-border rounded-lg bg-muted/10 hover:border-primary transition-colors flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">Consulta de Evaluación</p>
                  <p className="text-xs text-muted-foreground">Duración: 45m</p>
                </div>
                <span className="font-bold text-sm text-primary">$60 USD</span>
              </div>
              <div className="p-3 border border-border rounded-lg bg-muted/10 hover:border-primary transition-colors flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">Paquete Mensual Completo</p>
                  <p className="text-xs text-muted-foreground">Sesión 4x por mes</p>
                </div>
                <span className="font-bold text-sm text-primary">$200 USD</span>
              </div>
            </div>
            <button className="w-full py-2 border border-dashed border-input hover:border-primary hover:bg-muted/10 rounded-md text-xs font-semibold text-muted-foreground hover:text-primary transition-all">
              + Añadir Nueva Oferta
            </button>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}
