import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import {
  Search,
  Grid,
  HeartPulse,
  Scale,
  Code,
  Palette,
  Scissors,
  Wrench,
  GraduationCap,
  Megaphone,
  Menu,
  LogOut
} from "lucide-react"

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const qParam = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(qParam)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  // Sync search input with URL query param updates
  useEffect(() => {
    setSearchQuery(qParam)
  }, [qParam])

  const categoriesList = [
    { name: "Todo", icon: <Grid className="size-4" /> },
    { name: "Salud", icon: <HeartPulse className="size-4" /> },
    { name: "Legal", icon: <Scale className="size-4" /> },
    { name: "Tecnología", icon: <Code className="size-4" /> },
    { name: "Diseño", icon: <Palette className="size-4" /> },
    { name: "Estética", icon: <Scissors className="size-4" /> },
    { name: "Oficios", icon: <Wrench className="size-4" /> },
    { name: "Educación", icon: <GraduationCap className="size-4" /> },
    { name: "Negocios", icon: <Megaphone className="size-4" /> },
  ]

  const handleSearchSubmit = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.append("q", searchQuery)
    navigate(`/buscar?${params.toString()}`)
  }

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "Todo") {
      navigate("/buscar")
    } else {
      navigate(`/buscar?category=${encodeURIComponent(categoryName)}`)
    }
  }

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 transition-colors">
      <div className="h-16 px-6 flex items-center justify-between gap-6 container mx-auto">
        {/* Logo & Categories Dropdown Container */}
        <div className="flex items-center gap-5 flex-shrink-0">
          {/* Logo */}
          <Link to="/" className="font-semibold text-xl text-[#059669] tracking-tight flex items-center gap-1.5">
            Gesti
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setIsCategoriesOpen(true)}
            onMouseLeave={() => setIsCategoriesOpen(false)}
          >
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="flex items-center gap-2 px-4 py-1.5 text-sm text-foreground hover:bg-muted/70 transition-all rounded-full bg-card border border-border/80 shadow-sm cursor-pointer h-11"
            >
              <span>Tipos de servicios</span>
              <Menu className="size-3.5 text-foreground/90" />
            </button>

            {isCategoriesOpen && (
              <div className="absolute left-0 mt-1 w-52 bg-card border border-border/80 rounded-xl shadow-lg p-2 z-50 grid grid-cols-1 gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      handleCategoryClick(cat.name)
                      setIsCategoriesOpen(false)
                    }}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer text-left w-full"
                  >
                    <div className="text-muted-foreground/70 size-3.5 flex items-center justify-center">
                      {cat.icon}
                    </div>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Minimalist Professional Taller Search Widget */}
        <div className="hidden md:flex items-center bg-card border border-border/80 rounded-full px-4.5 shadow-sm hover:shadow-md hover:border-border transition-all duration-200 max-w-md w-full mx-4 h-11">
          <Search className="size-4.5 text-muted-foreground mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar servicios o proveedores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground w-full font-medium"
          />
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-5 flex-shrink-0">
          <ThemeSwitch />
          <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <Link to="/ofrecer" className="hover:text-foreground transition-colors">Ofrecer Servicio</Link>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div
                className="relative"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex flex-col items-start justify-center gap-0.5 py-1 px-4.5 bg-transparent border border-border hover:bg-muted text-foreground rounded-full font-medium text-xs transition-all shadow-sm cursor-pointer h-11"
                >
                  <span className="font-semibold text-xs leading-none">{user?.full_name || "Usuario"}</span>
                  <span className="text-[10px] text-muted-foreground leading-none truncate max-w-[150px]">{user?.email || ""}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-card border border-border/80 rounded-xl shadow-lg p-2 z-50 grid grid-cols-1 gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Menu Options */}
                    <Link
                      to="/intranet/businesses"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
                    >
                      <Grid className="size-3.5 text-muted-foreground/70" />
                      Panel de Control
                    </Link>

                    <button
                      onClick={() => {
                        logout()
                        setIsUserMenuOpen(false)
                        navigate("/")
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors text-left w-full cursor-pointer"
                    >
                      <LogOut className="size-3.5 text-red-500/70" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-1.5 px-3.5 bg-transparent border border-border hover:bg-muted text-foreground rounded-full font-medium text-xs transition-all"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="py-1.5 px-3.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-full font-medium text-xs transition-all shadow-sm"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Widget Bar */}
      <div className="block md:hidden px-6 pb-3">
        <div className="flex items-center bg-card border border-border/85 rounded-full py-2.5 px-3.5 shadow-sm">
          <Search className="size-4 text-muted-foreground mr-2.5" />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground w-full font-medium"
          />
        </div>
      </div>
    </header>
  )
}
