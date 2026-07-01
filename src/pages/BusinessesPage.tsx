import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { PageHeader } from "@/components/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronsUpDown, LogOut, BadgeCheck, Search, Plus, ChevronDown } from "lucide-react"

const BusinessCardSkeleton = () => (
  <div className="bg-card border border-border rounded-lg p-6 h-[170px] animate-pulse flex flex-col justify-between">
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-4" />
      </div>
      <div className="h-3.5 bg-muted rounded w-1/2" />
      <div className="space-y-1 mt-1">
        <div className="h-3 bg-muted/60 rounded w-full" />
        <div className="h-3 bg-muted/60 rounded w-4/5" />
      </div>
    </div>
    <div className="h-5 bg-muted rounded w-12" />
  </div>
)

export function BusinessesPage() {
  const navigate = useNavigate()
  const { user, services, setServices, selectService, logout } = useAuthStore()

  const [isLoadingList, setIsLoadingList] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  // Fetch businesses from database
  const fetchBusinesses = async () => {
    if (!user?.id) return
    setIsLoadingList(true)
    try {
      const { data, error } = await supabase
        .from("business_user_roles")
        .select(`
          business_id,
          businesses:business_id (
            id,
            name,
            description,
            is_active
          )
        `)
        .eq("user_id", user.id)

      if (error) throw error

      const formatted = (data || [])
        .map((row: any) => row.businesses)
        .filter(Boolean)
        .map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.name.toLowerCase().replace(/\s+/g, "-"),
          description: b.description || "",
          isActive: b.is_active ?? true,
        }))
      setServices(formatted)
    } catch (err) {
      console.error("Error loading businesses:", err)
    } finally {
      setIsLoadingList(false)
    }
  }

  useEffect(() => {
    fetchBusinesses()
  }, [user])

  const handleSelectBusiness = (biz: any) => {
    selectService(biz)
    navigate("/dashboard", { replace: true })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate("/login", { replace: true })
  }

  // Filter businesses locally based on search & status filter
  const filteredBusinesses = services.filter((biz) => {
    const matchesSearch =
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (biz.description || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ? true :
        statusFilter === "active" ? biz.isActive === true :
          biz.isActive === false

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Top Navigation Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-bold text-xl text-[#059669] tracking-tighter flex items-center gap-1.5">
            Gesti
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <ThemeSwitch />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none p-1.5 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                <Avatar className="h-8 w-8 rounded-lg border border-border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.full_name || user?.email || "G")}`} alt={user?.full_name || ""} />
                  <AvatarFallback className="rounded-lg">US</AvatarFallback>
                </Avatar>
                <div className="hidden md:grid text-left text-xs leading-tight">
                  <span className="truncate font-semibold text-sm text-foreground">{user?.full_name || "Usuario"}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronsUpDown className="ml-1 size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg border border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.full_name || user?.email || "G")}`} alt={user?.full_name || ""} />
                    <AvatarFallback className="rounded-lg">US</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.full_name || "Usuario"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/profile/settings")}
                className="gap-2 p-2 cursor-pointer"
              >
                <BadgeCheck className="size-4" />
                Mi Cuenta / Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="gap-2 p-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-6 py-10 max-w-7xl">

        <PageHeader
          title="Hola, estos son tus negocios"
          description="Selecciona o crea un negocio para administrar tus servicios y agenda."
        />
        <div className="mb-8" />

        {/* Supabase-style Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar un proyecto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-1.5 text-sm outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Status Select dropdown filter */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs font-medium bg-card hover:bg-muted transition-colors text-muted-foreground outline-none">
                    Estado: {statusFilter === "all" ? "Todos" : statusFilter === "active" ? "Activos" : "No públicos"}
                    <ChevronDown className="size-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")} className="cursor-pointer">Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")} className="cursor-pointer">Activos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")} className="cursor-pointer">No públicos</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            {/* Add Project Button */}
            <button
              onClick={() => navigate("/intranet/businesses/new")}
              className="flex items-center justify-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-medium px-4 py-2 rounded-md transition-colors border-0 shadow-none cursor-pointer"
            >
              <Plus className="size-4" />
              Nuevo proyecto
            </button>
          </div>
        </div>

        {/* Content Render (Skeleton/Empty/List) */}
        {isLoadingList ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <BusinessCardSkeleton />
            <BusinessCardSkeleton />
            <BusinessCardSkeleton />
            <BusinessCardSkeleton />
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="w-full border-2 border-dashed border-border rounded-xl p-12 text-center bg-card flex flex-col items-center mx-auto animate-fade-in">
            <div className="size-16 rounded-full bg-muted border border-border flex items-center justify-center mb-6">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium tracking-tight">No se encontraron negocios</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-8 leading-relaxed">
              No hay espacios de trabajo que coincidan con tu búsqueda.
            </p>
            <button
              onClick={() => navigate("/intranet/businesses/new")}
              className="flex items-center justify-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-medium px-4 py-2 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              Crear nuevo proyecto
            </button>
          </div>
        ) : (
          /* Projects grid using Supabase-like flat border cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
            {filteredBusinesses.map((biz) => (
              <div
                key={biz.id}
                onClick={() => handleSelectBusiness(biz)}
                className="bg-card border border-border rounded-md p-6 h-[170px] flex flex-col justify-between hover:border-foreground/30 transition-all cursor-pointer relative group animate-fade-in"
              >
                <div>
                  <h3 className="font-medium text-sm tracking-tight text-foreground truncate">
                    {biz.name}
                  </h3>
                  {/* description summary with line-clamp-2 */}
                  {biz.description && (
                    <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2">
                      {biz.description}
                    </p>
                  )}
                </div>

                {/* Flat badge in bottom left indicating active or not public status from DB */}
                <div>
                  {biz.isActive ? (
                    <span className="text-[10px] px-1.5 py-0.5 border border-emerald-500/20 bg-emerald-500/5 rounded text-emerald-600 dark:text-emerald-400 font-mono font-medium uppercase tracking-wider">
                      Activo
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 border border-destructive/20 bg-destructive/5 rounded text-destructive font-mono font-medium uppercase tracking-wider">
                      No público
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  )
}
