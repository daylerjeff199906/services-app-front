import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
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
import { ChevronsUpDown, LogOut, BadgeCheck } from "lucide-react"

export function BusinessesPage() {
  const navigate = useNavigate()
  const { user, services, setServices, selectService, logout } = useAuthStore()

  const [isLoadingList, setIsLoadingList] = useState(true)

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
            description
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Top Navigation Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-extrabold text-xl text-[#059669] tracking-tighter flex items-center gap-1.5">
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
      <main className="container mx-auto px-6 py-10">

        <PageHeader 
          title="Mis Espacios de Trabajo"
          description="Selecciona o crea un negocio para administrar tus servicios y agenda."
          actionButton={
            services.length > 0 ? (
              <Button 
                onClick={() => navigate("/intranet/businesses/new")}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Crear Negocio
              </Button>
            ) : undefined
          }
        />
        <div className="mb-8" />

        {/* Loading Spinner */}
        {isLoadingList ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-muted-foreground mt-3 font-medium">Cargando negocios...</span>
          </div>
        ) : services.length === 0 ? (

          /* Visual Flat Empty State */
          <div className="w-full border-2 border-dashed border-border rounded-xl p-12 text-center bg-card flex flex-col items-center mx-auto animate-fade-in">
            <div className="size-16 rounded-full bg-muted border border-border flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Aún no tienes negocios registrados</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-8 leading-relaxed">
              Comienza creando tu primer espacio de trabajo para configurar tus servicios y empezar a recibir clientes.
            </p>
            <Button 
              onClick={() => navigate("/intranet/businesses/new")}
              className="flex items-center gap-1.5 px-6 font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Crear mi primer negocio
            </Button>
          </div>
        ) : (

          /* Businesses grid layout using simple flat borders, no shadows */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {services.map((biz) => (
              <div
                key={biz.id}
                className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold text-lg tracking-tight truncate">{biz.name}</h3>
                    <span className="text-xs px-2 py-0.5 border border-border bg-muted text-muted-foreground font-mono rounded-md truncate max-w-[120px]">
                      /{biz.slug}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 min-h-[60px]">
                    {biz.description || "Sin descripción disponible."}
                  </p>
                </div>

                <button
                  onClick={() => handleSelectBusiness(biz)}
                  className="w-full py-2 border border-primary hover:bg-primary/5 text-primary text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  Administrar
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  )
}
