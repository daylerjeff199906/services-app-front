import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import type { TenantService } from "../types/auth.types"
import { 
  Search, 
  ChevronDown, 
  ArrowUpDown, 
  Grid, 
  List, 
  Plus, 
  MoreVertical 
} from "lucide-react"
import { ThemeSwitch } from "@/components/ui/theme-switch"

export function ServiceSelectorPage() {
  const { user, services, selectService, logout } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSelect = (service: TenantService) => {
    selectService(service)
    navigate("/dashboard", { replace: true })
  }

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  // Filter services by search query
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <header className="flex items-center justify-between pb-6 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
          <span className="font-bold text-lg text-foreground tracking-wider">SaaS Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeSwitch />
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Sesión: {user?.email}</span>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-md text-xs font-semibold transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto mt-10 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Proyectos</h1>
        </div>

        {/* Filter bar exactly matching the design */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for a project"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-transparent border border-border rounded-md outline-none text-sm text-foreground placeholder-muted-foreground focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Status Dropdown */}
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors bg-transparent">
              <span>Status</span>
              <ChevronDown className="h-4 w-4 opacity-75" />
            </button>

            {/* Sorted by Name */}
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors bg-transparent">
              <ArrowUpDown className="h-4 w-4 opacity-75" />
              <span>Sorted by name</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Grid/List View Toggles */}
            <div className="flex items-center border border-border rounded-md overflow-hidden bg-transparent">
              <button className="p-2 bg-muted text-foreground hover:bg-muted/80 transition-colors">
                <Grid className="h-4 w-4" />
              </button>
              <button className="p-2 text-muted-foreground hover:bg-muted transition-colors bg-transparent">
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* New Project Button */}
            <button 
              onClick={() => {
                const demoService = {
                  id: `srv_${Date.now()}`,
                  name: `Proyecto Demo ${services.length + 1}`,
                  slug: `proyecto-demo-${services.length + 1}`,
                  description: "Generado automáticamente para demostración"
                }
                useAuthStore.getState().login(user!, [...services, demoService])
              }}
              className="flex items-center gap-1.5 py-2 px-4 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-sm rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New project</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-muted/20">
            <p className="text-muted-foreground mb-4">No se encontraron proyectos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleSelect(service)}
                className="relative p-6 border border-border rounded-lg bg-card hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-44 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-emerald-500 transition-colors truncate pr-8">
                      {service.name}
                    </h3>
                    {/* Ellipsis menu button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        alert("Acciones adicionales de proyecto")
                      }}
                      className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground rounded transition-colors bg-transparent"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    AWS | us-west-1
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex">
                    <span className="px-2 py-0.5 border border-border rounded text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      NANO
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
