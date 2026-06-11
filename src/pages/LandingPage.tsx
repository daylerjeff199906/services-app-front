import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { ServiceCard } from "@/components/ServiceCard"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Scale, 
  HeartPulse, 
  Palette, 
  Code, 
  GraduationCap, 
  Megaphone,
  Grid,
  Sparkles,
  Scissors,
  Wrench
} from "lucide-react"

export function LandingPage() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todo")

  // Refs for functional carousels
  const carousel1Ref = useRef<HTMLDivElement>(null)
  const carousel2Ref = useRef<HTMLDivElement>(null)
  const carousel3Ref = useRef<HTMLDivElement>(null)

  // Carousel Banner State (auto loop, min 3 slides)
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    {
      id: 0,
      badge: "Garantía Gesti",
      title: "100% de Protección en tu Primer Servicio",
      desc: "Agenda con profesionales de confianza y asegura el éxito de tus requerimientos de salud, asesorías y tecnología.",
      bgClass: "bg-[#006341]",
      imageUrl: "/images/garantia_banner.png",
      buttonText: "Ver Garantías",
      buttonLink: "#beneficios",
      isCustomButton: false,
    },
    {
      id: 1,
      badge: "Ofrece tus servicios",
      title: "Haz crecer tu negocio hoy mismo",
      desc: "Crea tu cuenta, define tus ofertas, atrae clientes y administra tu negocio con nuestra consola SaaS sin pagar comisiones.",
      bgClass: "bg-indigo-900",
      imageUrl: "/images/negocio_banner.png",
      buttonText: "Empezar como Proveedor",
      buttonLink: "/ofrecer",
      isCustomButton: true,
    },
    {
      id: 2,
      badge: "Pagos 100% Protegidos",
      title: "Transacciones Seguras en Garantía",
      desc: "Tus pagos se retienen de forma segura en depósito y solo se liberan al proveedor cuando confirmas la entrega satisfactoria.",
      bgClass: "bg-emerald-950",
      imageUrl: "/images/pagos_banner.png",
      buttonText: "Más Información",
      buttonLink: "#beneficios",
      isCustomButton: false,
    }
  ]

  // Auto loop effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -400 : 400
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Categories list matching Airbnb filters layout
  const categoriesList = [
    { name: "Todo", icon: <Grid className="size-5" /> },
    { name: "Salud", icon: <HeartPulse className="size-5" /> },
    { name: "Legal", icon: <Scale className="size-5" /> },
    { name: "Tecnología", icon: <Code className="size-5" /> },
    { name: "Diseño", icon: <Palette className="size-5" /> },
    { name: "Estética", icon: <Scissors className="size-5" /> },
    { name: "Oficios", icon: <Wrench className="size-5" /> },
    { name: "Educación", icon: <GraduationCap className="size-5" /> },
    { name: "Negocios", icon: <Megaphone className="size-5" /> },
  ]

  // Master services dataset
  const allServices = [
    {
      id: "s_1",
      title: "Asesoría Legal Laboral y Contratos",
      provider: "Estudio Jurídico Mendoza & Asoc.",
      category: "Legal",
      price: "$150",
      rating: 4.9,
      badge: "Favorito de Clientes",
      icon: <Scale className="size-8 text-amber-500" />,
      gradient: "from-amber-500/10 to-orange-500/10",
      featured: true,
    },
    {
      id: "s_2",
      title: "Consulta Médica General Online",
      provider: "Centro Médico San José",
      category: "Salud",
      price: "$45",
      rating: 4.8,
      badge: "100% Virtual",
      icon: <HeartPulse className="size-8 text-rose-500" />,
      gradient: "from-rose-500/10 to-red-500/10",
      featured: true,
    },
    {
      id: "s_9",
      title: "Corte de Cabello Premium y Estilismo",
      provider: "Salón de Belleza Silvia",
      category: "Estética",
      price: "$25",
      rating: 4.9,
      badge: "Tendencia",
      imageUrl: "/images/corte_cabello.png",
      featured: true,
    },
    {
      id: "s_10",
      title: "Corte y Perfilado de Barba de Caballero",
      provider: "La Hermandad Barbería",
      category: "Estética",
      price: "$20",
      rating: 4.85,
      badge: "Favorito",
      imageUrl: "/images/barberia.png",
      featured: true,
    },
    {
      id: "s_11",
      title: "Servicio de Pedicure y Spa de Pies",
      provider: "Nails & Co. Wellness Spa",
      category: "Estética",
      price: "$35",
      rating: 4.92,
      badge: "Relajante",
      imageUrl: "/images/pedicure.png",
      featured: true,
    },
    {
      id: "s_12",
      title: "Servicio de Electricista Domiciliario",
      provider: "Servicios Técnicos Express",
      category: "Oficios",
      price: "$40",
      rating: 4.8,
      badge: "Urgencias 24/7",
      imageUrl: "/images/electricista.png",
      featured: true,
    },
    {
      id: "s_3",
      title: "Diseño de Marca y Logotipo Profesional",
      provider: "Agencia Creativa Prisma",
      category: "Diseño",
      price: "$120",
      rating: 5.0,
      badge: "Entrega Express",
      icon: <Palette className="size-8 text-indigo-500" />,
      gradient: "from-indigo-500/10 to-purple-500/10",
      featured: true,
    },
    {
      id: "s_4",
      title: "Desarrollo Web React & Node.js",
      provider: "DevsUnited Consultores",
      category: "Tecnología",
      price: "$350",
      rating: 4.9,
      badge: "Código Limpio",
      icon: <Code className="size-8 text-cyan-500" />,
      gradient: "from-cyan-500/10 to-blue-500/10",
      featured: true,
    },
    {
      id: "s_5",
      title: "Clases Personalizadas de Inglés C1",
      provider: "Prof. Sarah Jenkins",
      category: "Educación",
      price: "$25",
      rating: 4.7,
      badge: "Nativo Certificado",
      icon: <GraduationCap className="size-8 text-emerald-500" />,
      gradient: "from-emerald-500/10 to-teal-500/10",
      featured: false,
    },
    {
      id: "s_6",
      title: "Campaña de Marketing Digital & Ads",
      provider: "Pixel Growth Marketing",
      category: "Negocios",
      price: "$280",
      rating: 4.9,
      badge: "Retorno Alto",
      icon: <Megaphone className="size-8 text-pink-500" />,
      gradient: "from-purple-500/10 to-pink-500/10",
      featured: false,
    },
    {
      id: "s_7",
      title: "Terapia de Fisioterapia Deportiva",
      provider: "KinesioSport Center",
      category: "Salud",
      price: "$60",
      rating: 4.95,
      badge: "Favorito de Huéspedes",
      icon: <HeartPulse className="size-8 text-emerald-500" />,
      gradient: "from-emerald-500/10 to-teal-500/10",
      featured: true,
    },
    {
      id: "s_8",
      title: "Auditoría Financiera y Contable",
      provider: "Valenzuela & Asociados",
      category: "Negocios",
      price: "$200",
      rating: 4.88,
      badge: "Recomendado",
      icon: <Megaphone className="size-8 text-indigo-500" />,
      gradient: "from-indigo-500/10 to-purple-500/10",
      featured: true,
    },
  ]

  // Redirect to search page with selected params
  const handleSearchSubmit = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.append("q", searchQuery)
    if (selectedCategory && selectedCategory !== "Todo") params.append("category", selectedCategory)
    if (selectedDate) params.append("date", selectedDate)
    navigate(`/buscar?${params.toString()}`)
  }

  // Handle category tab click - redirect to search page directly
  const handleTabClick = (categoryName: string) => {
    if (categoryName === "Todo") {
      navigate("/buscar")
    } else {
      navigate(`/buscar?category=${categoryName}`)
    }
  }

  // Grouped datasets for landing page carousels
  const row1Services = allServices.filter(s => s.category === "Salud" || s.category === "Legal" || s.featured)
  const row2Services = allServices.filter(s => s.category === "Tecnología" || s.category === "Diseño" || s.category === "Educación" || s.category === "Negocios")
  const row3Services = allServices.filter(s => s.category === "Estética" || s.category === "Oficios")

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Navbar Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50 transition-colors">
        {/* Top Header Row */}
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
            <nav className="hidden lg:flex items-center gap-4 text-xs font-bold text-muted-foreground">
              <Link to="/ofrecer" className="hover:text-foreground transition-colors">Ofrecer Servicio</Link>
            </nav>
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

        {/* Mobile Search Widget Bar */}
        <div className="block md:hidden px-6 pb-4">
          <div className="flex items-center bg-card border border-border rounded-full py-2 px-4 shadow-sm">
            <Search className="size-4 text-muted-foreground mr-2" />
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

        {/* Airbnb Category Icon Bar (Filter tabs) */}
        <div className="border-t border-border bg-card/60 backdrop-blur-sm px-8 overflow-x-auto scrollbar-none transition-colors">
          <div className="container mx-auto flex items-center justify-center gap-10 py-3">
            {categoriesList.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleTabClick(cat.name)}
                className="flex flex-col items-center gap-1.5 py-1 border-b-2 border-transparent text-xs font-semibold tracking-tight text-muted-foreground opacity-60 hover:opacity-100 hover:border-border transition-all cursor-pointer bg-transparent focus:outline-none"
              >
                <div className="p-0.5 rounded transition-transform group-hover:scale-105">
                  {cat.icon}
                </div>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main listings area */}
      <main id="main-listings" className="flex-1 container mx-auto px-8 py-8 space-y-12">
        {/* Promotional Brand Banner Slider (Airbnb style with Auto Loop & Manual Overrides) */}
        <div 
          className="relative rounded-2xl overflow-hidden border border-border flex flex-col md:flex-row h-72 shadow-sm transition-all duration-300 bg-cover bg-center"
          style={{ backgroundImage: `url(${slides[currentSlide].imageUrl})` }}
        >
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

          {/* Arrow Left */}
          <button 
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center shadow hover:scale-105 transition-all z-20 cursor-pointer border border-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {/* Arrow Right */}
          <button 
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center shadow hover:scale-105 transition-all z-20 cursor-pointer border border-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Banner Left Portion (Dynamic from active slide) */}
          <div className="flex-1 p-10 flex flex-col justify-center text-white space-y-4 relative overflow-hidden transition-all duration-500 z-10">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-white/20 uppercase tracking-widest px-2.5 py-1 rounded w-fit">
              <Sparkles className="size-3" />
              {slides[currentSlide].badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
              {slides[currentSlide].title}
            </h2>
            <p className="text-sm text-white/90 max-w-lg">
              {slides[currentSlide].desc}
            </p>
          </div>

          {/* Banner Right Portion (Dynamic CTA button block with Glassmorphism) */}
          <div className="w-full md:w-80 bg-black/35 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/10 p-10 flex flex-col justify-center items-center md:items-start space-y-4 relative z-10">
            <h3 className="font-extrabold text-xl text-white text-center md:text-left">
              {slides[currentSlide].id === 1 ? "Ofrece y vende tus servicios" : "Ofrece y contrata ahora mismo"}
            </h3>
            {slides[currentSlide].isCustomButton ? (
              <Link
                to={slides[currentSlide].buttonLink}
                className="py-2.5 px-6 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-lg transition-all w-full text-center shadow-md hover:scale-[1.02]"
              >
                {slides[currentSlide].buttonText}
              </Link>
            ) : (
              <button
                onClick={() => {
                  document.getElementById("beneficios")?.scrollIntoView({ behavior: "smooth" })
                }}
                className="py-2.5 px-6 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-lg transition-all w-full text-center shadow-md cursor-pointer hover:scale-[1.02]"
              >
                {slides[currentSlide].buttonText}
              </button>
            )}
          </div>

          {/* Dots Indicator overlay */}
          <div className="absolute bottom-4 left-10 flex gap-1.5 z-20">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === currentSlide ? "bg-white scale-125" : "bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        {/* ROW 1: "Servicios populares de confianza" - FUNCTIONAL SLIDER */}
        <section className="space-y-4 relative group/slider">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                Servicios populares de confianza
                <span className="px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669] text-[10px] font-bold uppercase tracking-wider">
                  Destacados
                </span>
              </h2>
            </div>
            
            {/* Arrow navigation triggers */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleScroll(carousel1Ref, 'left')}
                className="p-2 border border-border hover:bg-muted text-foreground rounded-full transition-all cursor-pointer shadow-sm bg-card"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button 
                onClick={() => handleScroll(carousel1Ref, 'right')}
                className="p-2 border border-border hover:bg-muted text-foreground rounded-full transition-all cursor-pointer shadow-sm bg-card"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div 
            ref={carousel1Ref}
            className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1"
          >
            {row1Services.map((service) => (
              <div key={service.id} className="w-[280px] sm:w-[250px] md:w-[280px] flex-shrink-0">
                <ServiceCard
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
              </div>
            ))}
          </div>
        </section>

        {/* ROW 2: "Servicios profesionales destacados" - FUNCTIONAL SLIDER */}
        <section className="space-y-4 relative group/slider">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                Servicios profesionales destacados
                <span className="text-xs text-muted-foreground font-normal tracking-tight normal-case">
                  Tecnología y Negocios
                </span>
              </h2>
            </div>
            
            {/* Arrow navigation triggers */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleScroll(carousel2Ref, 'left')}
                className="p-2 border border-border hover:bg-muted text-foreground rounded-full transition-all cursor-pointer shadow-sm bg-card"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button 
                onClick={() => handleScroll(carousel2Ref, 'right')}
                className="p-2 border border-border hover:bg-muted text-foreground rounded-full transition-all cursor-pointer shadow-sm bg-card"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div 
            ref={carousel2Ref}
            className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1"
          >
            {row2Services.map((service) => (
              <div key={service.id} className="w-[280px] sm:w-[250px] md:w-[280px] flex-shrink-0">
                <ServiceCard
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
              </div>
            ))}
          </div>
        </section>

        {/* ROW 3: "Belleza, Estética y Oficios del Hogar" - FUNCTIONAL SLIDER */}
        <section className="space-y-4 relative group/slider">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                Belleza, Estética y Oficios del Hogar
                <span className="text-xs text-muted-foreground font-normal tracking-tight normal-case">
                  Servicios Locales
                </span>
              </h2>
            </div>
            
            {/* Arrow navigation triggers */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleScroll(carousel3Ref, 'left')}
                className="p-2 border border-border hover:bg-muted text-foreground rounded-full transition-all cursor-pointer shadow-sm bg-card"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button 
                onClick={() => handleScroll(carousel3Ref, 'right')}
                className="p-2 border border-border hover:bg-muted text-foreground rounded-full transition-all cursor-pointer shadow-sm bg-card"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div 
            ref={carousel3Ref}
            className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1"
          >
            {row3Services.map((service) => (
              <div key={service.id} className="w-[280px] sm:w-[250px] md:w-[280px] flex-shrink-0">
                <ServiceCard
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
              </div>
            ))}
          </div>
        </section>

        {/* Strategic Features Block (Airbnb-style trust badges) */}
        <section id="beneficios" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border">
          <div className="p-6 bg-card border border-border rounded-2xl flex items-center gap-4 shadow-sm hover:border-[#059669]/30 transition-colors">
            <div className="p-3 bg-[#059669]/10 rounded-xl text-[#059669]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">Transacciones Protegidas</h4>
              <p className="text-xs text-muted-foreground mt-0.5">El pago se retiene de forma segura y se libera al entregar el servicio.</p>
            </div>
          </div>
          <div className="p-6 bg-card border border-border rounded-2xl flex items-center gap-4 shadow-sm hover:border-[#059669]/30 transition-colors">
            <div className="p-3 bg-[#059669]/10 rounded-xl text-[#059669]">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">Profesionales Validados</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Revisamos antecedentes, credenciales e historial de portafolio.</p>
            </div>
          </div>
          <div className="p-6 bg-card border border-border rounded-2xl flex items-center gap-4 shadow-sm hover:border-[#059669]/30 transition-colors">
            <div className="p-3 bg-[#059669]/10 rounded-xl text-[#059669]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">Garantía del 100%</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Si el proveedor no cumple, te devolvemos la totalidad de tus fondos.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border py-10 text-xs text-muted-foreground transition-colors">
        <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold text-foreground text-sm">Gesti Marketplace</span>
            <span>Conectando talento certificado con proyectos independientes.</span>
          </div>
          <div className="flex gap-6 font-semibold">
            <Link to="/ofrecer" className="hover:text-foreground transition-colors">Ofrecer Servicios</Link>
            <a href="#" className="hover:text-foreground transition-colors">Términos de Uso</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
            <a href="#" className="hover:text-foreground transition-colors">Portal de Soporte</a>
          </div>
          <span>© 2026 Gesti Inc. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
