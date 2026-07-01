import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ServiceCard } from "@/components/ServiceCard"
import { Header } from "../components/Header"
import {
  Star,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Sparkles,
  Share2,
  Heart,
  CheckCircle,
  Scale,
  HeartPulse,
  Palette,
  Code,
  GraduationCap,
  Megaphone
} from "lucide-react"

export function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()



  // Booking widget state
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTime, setBookingTime] = useState("09:00 AM")
  const [isBooked, setIsBooked] = useState(false)

  // Master services dataset (shared)
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
      icon: <Scale className="size-16 text-amber-500" />,
      gradient: "from-amber-500/10 to-orange-500/10",
      desc: "Brindamos asesoramiento legal integral en materia de derecho laboral, confección y revisión de contratos de trabajo, indemnizaciones, despidos y mediaciones. Nuestro equipo de abogados cuenta con más de 15 años de trayectoria resolviendo conflictos empresariales y particulares de forma efectiva.",
      highlight: "Asesoría rápida en 24h"
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
      icon: <HeartPulse className="size-16 text-rose-500" />,
      gradient: "from-rose-500/10 to-red-500/10",
      desc: "Atención médica virtual inmediata para el diagnóstico y tratamiento de patologías comunes, emisión de recetas digitales, órdenes de laboratorio y certificados de salud. Recibe atención profesional desde la comodidad de tu hogar sin esperas innecesarias.",
      highlight: "Receta médica digital incluida"
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
      desc: "Servicio de corte de cabello unisex, peinado, lavado y tratamiento capilar hidratante. Nuestros estilistas te asesorarán para encontrar el corte ideal según la forma de tu rostro y tu tipo de cabello. Incluye lavado con masajes y bebidas de cortesía.",
      highlight: "Asesoramiento de imagen gratis"
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
      desc: "Servicio de barbería clásica de caballero que incluye corte de cabello moderno, perfilado de barba con toalla caliente, afeitado tradicional con navaja y masaje facial relajante. El espacio ideal para el cuidado masculino.",
      highlight: "Tratamiento de toalla caliente"
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
      desc: "Tratamiento estético completo para tus pies. Incluye limpieza profunda, exfoliación, remoción de callosidades, masaje hidratante con aceites esenciales, esmaltado semipermanente y spa con sales relajantes.",
      highlight: "Sales de baño hidratantes"
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
      desc: "Solución a problemas eléctricos del hogar: reparación de cortocircuitos, instalación de luminarias, tomacorrientes, tableros eléctricos, cableado general e inspección de fugas a tierra. Técnicos capacitados con herramientas de alta seguridad.",
      highlight: "Garantía de reparación de 90 días"
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
      icon: <Palette className="size-16 text-indigo-500" />,
      gradient: "from-indigo-500/10 to-purple-500/10",
      desc: "Creamos la identidad visual de tu marca. Incluye diseño de logotipo vectorizado, paleta de colores, tipografías institucionales, manual de marca simplificado y adaptaciones para redes sociales. Nos enfocamos en conectar tu marca con tus clientes ideales.",
      highlight: "3 propuestas iniciales en 3 días"
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
      icon: <Code className="size-16 text-cyan-500" />,
      gradient: "from-cyan-500/10 to-blue-500/10",
      desc: "Desarrollamos sitios web modernos, responsivos y altamente escalables utilizando React en el frontend y Node.js en el backend. Incluye optimización SEO básica, configuración de base de datos, integraciones de pago e implementación en entornos cloud (AWS/Vercel).",
      highlight: "Código limpio con TypeScript"
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
      icon: <GraduationCap className="size-16 text-emerald-500" />,
      gradient: "from-emerald-500/10 to-teal-500/10",
      desc: "Aprende o perfecciona tu nivel de inglés enfocado en tus metas profesionales o académicas. Sesiones personalizadas e interactivas uno a uno centradas en el habla, pronunciación y preparación para exámenes internacionales (TOEFL, IELTS).",
      highlight: "Material didáctico personalizado"
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
      icon: <Megaphone className="size-16 text-pink-500" />,
      gradient: "from-purple-500/10 to-pink-500/10",
      desc: "Diseño y optimización de campañas de publicidad digital en Meta Ads y Google Ads. Estructuramos tu embudo de ventas digital, segmentamos tu audiencia ideal y creamos copies de alto impacto para maximizar el retorno de tu inversión publicitaria.",
      highlight: "Reporte semanal de métricas"
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
      icon: <HeartPulse className="size-16 text-emerald-500" />,
      gradient: "from-emerald-500/10 to-teal-500/10",
      desc: "Rehabilitación de lesiones deportivas, dolores musculares y articulares. Sesiones con especialistas que aplican técnicas modernas de terapia manual, vendaje neuromuscular y ejercicios de fortalecimiento guiados para tu pronta recuperación.",
      highlight: "Evaluación corporal incluida"
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
      icon: <Megaphone className="size-16 text-indigo-500" />,
      gradient: "from-indigo-500/10 to-purple-500/10",
      desc: "Analizamos en profundidad los estados contables de tu negocio, flujo de caja y cumplimiento tributario para detectar anomalías y sugerir mejoras en la eficiencia financiera. Incluye reporte contable final firmado y consultoría de optimización de costos.",
      highlight: "Entrega de balance certificado"
    },
  ]

  // Find current service
  const currentService = allServices.find((s) => s.id === id)

  if (!currentService) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-8 space-y-6 font-sans">
        <h2 className="text-2xl font-bold">Servicio no encontrado</h2>
        <p className="text-muted-foreground text-sm">El enlace ingresado es inválido o el servicio ya no está disponible.</p>
        <Link to="/" className="py-2 px-6 bg-primary text-primary-foreground font-bold rounded-lg shadow hover:bg-primary/95 transition-all">
          Regresar a Inicio
        </Link>
      </div>
    )
  }

  // Find recommended services (same category, excluding current)
  let recommendations = allServices.filter((s) => s.category === currentService.category && s.id !== currentService.id)

  // Fallback to general featured if no services in same category
  if (recommendations.length === 0) {
    recommendations = allServices.filter((s) => s.id !== currentService.id).slice(0, 4)
  }



  // Handle book click
  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingDate) {
      alert("Por favor selecciona una fecha para reservar.")
      return
    }
    setIsBooked(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans transition-colors duration-200">

      {/* Top Navbar Header */}
      <Header />

      {/* Main details content */}
      <main className="flex-1 container mx-auto px-8 py-8 space-y-8 text-left">

        {/* Back Button & Breadcrumbs */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Volver atrás
          </button>
          <div className="flex items-center gap-2 font-medium">
            <Link to="/" className="hover:text-foreground">Inicio</Link>
            <span>/</span>
            <Link to={`/buscar?category=${currentService.category}`} className="hover:text-foreground">{currentService.category}</Link>
            <span>/</span>
            <span className="text-foreground font-semibold line-clamp-1 max-w-[200px]">{currentService.title}</span>
          </div>
        </div>

        {/* Title, rating and action badges */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
            {currentService.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1 text-foreground">
                <Star className="size-4 fill-yellow-500 text-yellow-500" />
                <span>{currentService.rating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <span className="underline cursor-pointer hover:text-foreground">12 Evaluaciones de usuarios</span>
              <span>•</span>
              <span className="text-foreground">{currentService.provider}</span>
            </div>

            <div className="flex items-center gap-4 text-foreground">
              <button className="flex items-center gap-1.5 py-1 px-3 border border-border hover:bg-muted rounded-full bg-transparent cursor-pointer font-bold transition-all">
                <Share2 className="size-3.5" />
                Compartir
              </button>
              <button className="flex items-center gap-1.5 py-1 px-3 border border-border hover:bg-muted rounded-full bg-transparent cursor-pointer font-bold transition-all text-red-500 hover:text-red-600">
                <Heart className="size-3.5" />
                Guardar
              </button>
            </div>
          </div>
        </div>

        {/* Mock Gallery Block (Airbnb Style: large grid box left, smaller stacked right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-96 rounded-2xl overflow-hidden border border-border bg-muted/10 relative">
          {/* Main Left Side Gallery */}
          {currentService.imageUrl ? (
            <div className="md:col-span-2 relative">
              <img
                src={currentService.imageUrl}
                alt={currentService.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute left-6 bottom-6 px-3 py-1 bg-background/90 text-foreground font-bold text-[10px] tracking-wider uppercase rounded-lg shadow border border-border">
                {currentService.badge}
              </span>
            </div>
          ) : (
            <div className={`md:col-span-2 bg-gradient-to-br ${currentService.gradient} flex items-center justify-center relative p-8`}>
              <div className="p-8 rounded-full bg-background/90 shadow-lg scale-125 border border-border/40">
                {currentService.icon}
              </div>
              <span className="absolute left-6 bottom-6 px-3 py-1 bg-background/90 text-foreground font-bold text-[10px] tracking-wider uppercase rounded-lg shadow border border-border">
                {currentService.badge}
              </span>
            </div>
          )}

          {/* Right Side Stacked Panels */}
          <div className="hidden md:flex flex-col gap-4">
            <div className="flex-1 bg-muted/40 border-b border-border flex items-center justify-center p-6 hover:bg-muted/60 transition-colors">
              <Calendar className="size-8 text-[#059669]/60" />
            </div>
            <div className="flex-1 bg-muted/40 flex items-center justify-center p-6 hover:bg-muted/60 transition-colors">
              <Clock className="size-8 text-[#059669]/60" />
            </div>
          </div>
        </div>

        {/* Content Section: details + booking card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: descriptions, credentials, reviews */}
          <div className="lg:col-span-8 space-y-8 divide-y divide-border">

            {/* Provider Meta Section */}
            <div className="flex items-center justify-between pb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  Servicio ofrecido por {currentService.provider}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Profesional verificado de la categoría {currentService.category} • Certificación Gesti
                </p>
              </div>
              <div className="size-12 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center font-bold text-sm border border-[#059669]/20 shadow-sm flex-shrink-0">
                <User className="size-5" />
              </div>
            </div>

            {/* Highlights Section */}
            <div className="py-6 space-y-4">
              <div className="flex gap-4">
                <div className="mt-1 text-[#059669]">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Destacado del servicio</h4>
                  <p className="text-xs text-muted-foreground">{currentService.highlight}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 text-[#059669]">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Garantía Gesti Protegido</h4>
                  <p className="text-xs text-muted-foreground">El cobro se retiene de forma segura y solo se libera cuando confirmes la entrega satisfactoria.</p>
                </div>
              </div>
            </div>

            {/* Full Description */}
            <div className="py-6 space-y-3">
              <h3 className="font-bold text-lg">Acerca del Servicio</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentService.desc}
              </p>
            </div>

            {/* Mock Reviews Section */}
            <div className="py-6 space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare className="size-5 text-[#059669]" />
                Opiniones de Clientes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs">Andrés Silva</p>
                      <p className="text-[10px] text-muted-foreground">Mayo de 2026</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-xs font-semibold">
                      <Star className="size-3 fill-yellow-500 text-yellow-500" />
                      <span>5.0</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    &quot;La calidad de atención es excelente. Cumplió exactamente con los plazos prometidos y el trato fue muy profesional. Definitivamente volveré a contratar.&quot;
                  </p>
                </div>

                <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs">Mariana Costa</p>
                      <p className="text-[10px] text-muted-foreground">Junio de 2026</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-xs font-semibold">
                      <Star className="size-3 fill-yellow-500 text-yellow-500" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    &quot;Explicaciones sumamente claras. Me ayudó muchísimo a clarificar mis inquietudes iniciales y organizó la entrega de forma sumamente prolija.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Booking Card Simulator */}
          <div className="lg:col-span-4 sticky top-28 bg-card border border-border rounded-2xl p-6 shadow-lg space-y-6">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-foreground">{currentService.price} <span className="text-xs text-muted-foreground font-normal">USD</span></span>
              <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
                <span>{currentService.rating.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">• 12 evaluations</span>
              </div>
            </div>

            {isBooked ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl space-y-3 text-center">
                <CheckCircle className="size-8 mx-auto text-emerald-500" />
                <h4 className="font-bold text-sm">¡Cita Solicitada con Éxito!</h4>
                <p className="text-xs">
                  Tu reserva para el **{bookingDate}** a las **{bookingTime}** ha sido procesada de forma segura. El proveedor confirmará a la brevedad.
                </p>
                <button
                  onClick={() => setIsBooked(false)}
                  className="w-full mt-2 py-1.5 px-3 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Agendar otra cita
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                {/* Date Selection */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fecha de Reserva</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-xs outline-none text-foreground focus:border-[#059669] transition-colors"
                  />
                </div>

                {/* Time Selection */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hora Disponible</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-xs outline-none text-foreground focus:border-[#059669] transition-colors cursor-pointer"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>

                {/* Reservation Action Button */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm"
                >
                  Solicitar Reserva
                </button>

                <p className="text-[10px] text-muted-foreground text-center">
                  No se realizará ningún cargo directo aún en esta fase de simulación.
                </p>
              </form>
            )}

            {/* Price Calculations */}
            <div className="border-t border-border pt-4 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="underline">Servicio Técnico/Profesional</span>
                <span className="text-foreground font-semibold">{currentService.price} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="underline">Comisión de Servicio (0% Promo)</span>
                <span className="text-emerald-500 font-bold">$0 USD</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-sm font-bold text-foreground">
                <span>Total estimado</span>
                <span>{currentService.price} USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Recommended Services (General recommendations based on similar tags/category) */}
        <section className="space-y-6 pt-12 border-t border-border">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Otros servicios recomendados
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {recommendations.map((service) => (
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
                onClick={() => {
                  setIsBooked(false)
                  setBookingDate("")
                  navigate(`/servicio/${service.id}`)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
              />
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border py-8 text-xs text-muted-foreground transition-colors mt-12">
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
