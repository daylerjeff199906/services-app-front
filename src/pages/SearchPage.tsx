import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { ServiceCard } from "@/components/ServiceCard"
import { 
  Search, 
  Scale, 
  HeartPulse, 
  Palette, 
  Code, 
  GraduationCap, 
  Megaphone,
  SlidersHorizontal,
  Star
} from "lucide-react"

export function SearchPage() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read URL query params
  const qParam = searchParams.get("q") || ""
  const categoryParam = searchParams.get("category") || "Todo"
  const dateParam = searchParams.get("date") || ""

  // State
  const [searchQuery, setSearchQuery] = useState(qParam)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [selectedDate, setSelectedDate] = useState(dateParam)
  
  // Sidebar Filters State
  const [priceMax, setPriceMax] = useState(500)
  const [minRating, setMinRating] = useState(0) // 0 = all
  const [sortBy, setSortBy] = useState("rating") // rating, price-asc, price-desc

  // Sync state with URL params
  useEffect(() => {
    setSearchQuery(qParam)
    setSelectedCategory(categoryParam)
    setSelectedDate(dateParam)
  }, [qParam, categoryParam, dateParam])

  // Master services dataset
  const allServices = [
    {
      id: "s_1",
      title: "Asesoría Legal Laboral y Contratos",
      provider: "Estudio Jurídico Mendoza & Asoc.",
      category: "Legal",
      price: "$150",
      numericPrice: 150,
      rating: 4.9,
      badge: "Favorito de Clientes",
      icon: <Scale className="size-8 text-amber-500" />,
      gradient: "from-amber-500/10 to-orange-500/10",
    },
    {
      id: "s_2",
      title: "Consulta Médica General Online",
      provider: "Centro Médico San José",
      category: "Salud",
      price: "$45",
      numericPrice: 45,
      rating: 4.8,
      badge: "100% Virtual",
      icon: <HeartPulse className="size-8 text-rose-500" />,
      gradient: "from-rose-500/10 to-red-500/10",
    },
    {
      id: "s_9",
      title: "Corte de Cabello Premium y Estilismo",
      provider: "Salón de Belleza Silvia",
      category: "Estética",
      price: "$25",
      numericPrice: 25,
      rating: 4.9,
      badge: "Tendencia",
      imageUrl: "/images/corte_cabello.png",
    },
    {
      id: "s_10",
      title: "Corte y Perfilado de Barba de Caballero",
      provider: "La Hermandad Barbería",
      category: "Estética",
      price: "$20",
      numericPrice: 20,
      rating: 4.85,
      badge: "Favorito",
      imageUrl: "/images/barberia.png",
    },
    {
      id: "s_11",
      title: "Servicio de Pedicure y Spa de Pies",
      provider: "Nails & Co. Wellness Spa",
      category: "Estética",
      price: "$35",
      numericPrice: 35,
      rating: 4.92,
      badge: "Relajante",
      imageUrl: "/images/pedicure.png",
    },
    {
      id: "s_12",
      title: "Servicio de Electricista Domiciliario",
      provider: "Servicios Técnicos Express",
      category: "Oficios",
      price: "$40",
      numericPrice: 40,
      rating: 4.8,
      badge: "Urgencias 24/7",
      imageUrl: "/images/electricista.png",
    },
    {
      id: "s_3",
      title: "Diseño de Marca y Logotipo Profesional",
      provider: "Agencia Creativa Prisma",
      category: "Diseño",
      price: "$120",
      numericPrice: 120,
      rating: 5.0,
      badge: "Entrega Express",
      icon: <Palette className="size-8 text-indigo-500" />,
      gradient: "from-indigo-500/10 to-purple-500/10",
    },
    {
      id: "s_4",
      title: "Desarrollo Web React & Node.js",
      provider: "DevsUnited Consultores",
      category: "Tecnología",
      price: "$350",
      numericPrice: 350,
      rating: 4.9,
      badge: "Código Limpio",
      icon: <Code className="size-8 text-cyan-500" />,
      gradient: "from-cyan-500/10 to-blue-500/10",
    },
    {
      id: "s_5",
      title: "Clases Personalizadas de Inglés C1",
      provider: "Prof. Sarah Jenkins",
      category: "Educación",
      price: "$25",
      numericPrice: 25,
      rating: 4.7,
      badge: "Nativo Certificado",
      icon: <GraduationCap className="size-8 text-emerald-500" />,
      gradient: "from-emerald-500/10 to-teal-500/10",
    },
    {
      id: "s_6",
      title: "Campaña de Marketing Digital & Ads",
      provider: "Pixel Growth Marketing",
      category: "Negocios",
      price: "$280",
      numericPrice: 280,
      rating: 4.9,
      badge: "Retorno Alto",
      icon: <Megaphone className="size-8 text-pink-500" />,
      gradient: "from-purple-500/10 to-pink-500/10",
    },
    {
      id: "s_7",
      title: "Terapia de Fisioterapia Deportiva",
      provider: "KinesioSport Center",
      category: "Salud",
      price: "$60",
      numericPrice: 60,
      rating: 4.95,
      badge: "Favorito de Huéspedes",
      icon: <HeartPulse className="size-8 text-emerald-500" />,
      gradient: "from-emerald-500/10 to-teal-500/10",
    },
    {
      id: "s_8",
      title: "Auditoría Financiera y Contable",
      provider: "Valenzuela & Asociados",
      category: "Negocios",
      price: "$200",
      numericPrice: 200,
      rating: 4.88,
      badge: "Recomendado",
      icon: <Megaphone className="size-8 text-indigo-500" />,
      gradient: "from-indigo-500/10 to-purple-500/10",
    },
  ]

  // Submit search query update to URL search params
  const handleSearchSubmit = () => {
    const params: Record<string, string> = {}
    if (searchQuery) params.q = searchQuery
    if (selectedCategory && selectedCategory !== "Todo") params.category = selectedCategory
    if (selectedDate) params.date = selectedDate
    setSearchParams(params)
  }

  // Filter and Sort dataset based on inputs
  const filteredServices = allServices
    .filter((service) => {
      const matchesSearch = searchQuery === "" || 
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        service.provider.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === "Todo" || service.category === selectedCategory
      const matchesPrice = service.numericPrice <= priceMax
      const matchesRating = service.rating >= minRating

      return matchesSearch && matchesCategory && matchesPrice && matchesRating
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.numericPrice - b.numericPrice
      if (sortBy === "price-desc") return b.numericPrice - a.numericPrice
      return b.rating - a.rating // default by rating
    })

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Navbar Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50 transition-colors">
        <div className="h-20 px-8 flex items-center justify-between gap-6 container mx-auto">
          {/* Logo */}
          <Link to="/" className="font-extrabold text-2xl text-[#059669] tracking-tighter flex items-center gap-1.5 flex-shrink-0">
            Gesti
          </Link>

          {/* Airbnb-style Advanced Search Pill Widget */}
          <div className="hidden md:flex items-center bg-card border border-border rounded-full py-1.5 pl-6 pr-2 shadow-sm hover:shadow-md transition-shadow duration-200 divide-x divide-border max-w-2xl w-full mx-4">
            {/* Search Input Block */}
            <div className="flex-1 pr-4 text-left flex flex-col min-w-[120px]">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">Qué buscas</label>
              <input
                type="text"
                placeholder="Buscar servicios o proveedores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                className="bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground w-full font-medium mt-0.5"
              />
            </div>

            {/* Date Block */}
            <div className="flex-1 px-4 text-left flex flex-col min-w-[120px]">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">Disponibilidad</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-foreground font-medium mt-0.5 cursor-pointer"
              >
                <option value="">Cualquier fecha</option>
                <option value="today">Hoy mismo</option>
                <option value="week">Esta semana</option>
                <option value="next-week">Próxima semana</option>
              </select>
            </div>

            {/* Category Dropdown Block */}
            <div className="flex-1 pl-4 pr-2 text-left flex flex-col min-w-[120px]">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-foreground font-medium mt-0.5 cursor-pointer"
              >
                <option value="Todo">Todas</option>
                <option value="Salud">Salud</option>
                <option value="Legal">Legal</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Diseño">Diseño</option>
                <option value="Estética">Estética</option>
                <option value="Oficios">Oficios</option>
                <option value="Educación">Educación</option>
                <option value="Negocios">Negocios</option>
              </select>
            </div>

            {/* Circular Search Button */}
            <button 
              onClick={handleSearchSubmit}
              className="p-3 bg-[#059669] hover:bg-[#047857] text-white rounded-full transition-colors flex items-center justify-center cursor-pointer shadow-sm ml-2 flex-shrink-0"
            >
              <Search className="size-4" />
            </button>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <ThemeSwitch />
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <Link
                  to="/services"
                  className="py-1.5 px-4 bg-transparent border border-border hover:bg-muted text-foreground rounded-full font-bold text-xs transition-all shadow-sm"
                >
                  {user?.full_name || "Panel"}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="py-1.5 px-4 bg-transparent border border-border hover:bg-muted text-foreground rounded-full font-bold text-xs transition-all"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="py-1.5 px-4 bg-primary text-primary-foreground hover:bg-primary/95 rounded-full font-bold text-xs transition-all shadow-sm"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 container mx-auto px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar Filters (Hidden on Mobile) */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6 bg-card border border-border rounded-2xl p-6 h-fit text-left">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <SlidersHorizontal className="size-4.5 text-[#059669]" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground">Filtros de Búsqueda</h3>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Categoría Principal</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSearchParams({
                    q: searchQuery,
                    category: e.target.value,
                    date: selectedDate
                  })
                }}
                className="w-full p-2.5 bg-background border border-border rounded-lg text-xs outline-none text-foreground focus:border-[#059669] transition-colors"
              >
                <option value="Todo">Todas las categorías</option>
                <option value="Salud">Salud</option>
                <option value="Legal">Legal</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Diseño">Diseño</option>
                <option value="Estética">Estética</option>
                <option value="Oficios">Oficios</option>
                <option value="Educación">Educación</option>
                <option value="Negocios">Negocios</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <label className="font-extrabold uppercase tracking-wider text-muted-foreground">Precio Máximo</label>
                <span className="font-bold text-[#059669]">${priceMax} USD</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-[#059669]"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>$20 USD</span>
                <span>$500 USD</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Valoración Mínima</label>
              <div className="space-y-2">
                {[0, 4.5, 4.8, 4.9].map((ratingVal) => (
                  <button
                    key={ratingVal}
                    onClick={() => setMinRating(ratingVal)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-all cursor-pointer bg-transparent ${
                      minRating === ratingVal 
                        ? "border-[#059669] text-[#059669] bg-[#059669]/5" 
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{ratingVal === 0 ? "Cualquier calificación" : `★ ${ratingVal.toFixed(1)} o más`}</span>
                    {ratingVal > 0 && <Star className="size-3 fill-yellow-500 text-yellow-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2.5 bg-background border border-border rounded-lg text-xs outline-none text-foreground focus:border-[#059669] transition-colors"
              >
                <option value="rating">Mejor Calificados</option>
                <option value="price-asc">Precio: de menor a mayor</option>
                <option value="price-desc">Precio: de mayor a menor</option>
              </select>
            </div>
          </aside>

          {/* Right Main Grid */}
          <div className="flex-1 space-y-6 text-left">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  {selectedCategory === "Todo" ? "Todos los Servicios" : `Servicios de ${selectedCategory}`}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mostrando {filteredServices.length} servicios de profesionales independientes verificados.
                </p>
              </div>

              {/* Reset/Clean active search query badge */}
              {(qParam || categoryParam !== "Todo" || dateParam) && (
                <button
                  onClick={() => {
                    setSearchParams({})
                    setPriceMax(500)
                    setMinRating(0)
                  }}
                  className="text-xs font-bold text-[#059669] hover:underline bg-transparent cursor-pointer"
                >
                  Restaurar búsqueda original
                </button>
              )}
            </div>

            {/* Grid display */}
            {filteredServices.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-border rounded-2xl bg-muted/10 space-y-4">
                <p className="text-muted-foreground font-bold text-base">No se encontraron servicios</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Prueba cambiando la categoría de búsqueda, disminuyendo la valoración mínima o aumentando el precio máximo en el panel de filtros.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    id={service.id}
                    title={service.title}
                    provider={service.provider}
                    category={service.category}
                    price={service.price}
                    rating={service.rating}
                    badge={service.badge}
                    icon={service.icon}
                    imageUrl={service.imageUrl}
                    gradient={service.gradient}
                    onClick={() => navigate(`/servicio/${service.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border py-8 text-xs text-muted-foreground mt-12 transition-colors">
        <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-foreground">Gesti Marketplace</span>
          <div className="flex gap-6 font-semibold">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <Link to="/ofrecer" className="hover:text-foreground transition-colors">Ofrecer Servicios</Link>
            <a href="#" className="hover:text-foreground transition-colors">Términos de Uso</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
          </div>
          <span>© 2026 Gesti Inc. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
