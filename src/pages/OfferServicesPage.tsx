import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import { Header } from "../components/Header"
import {
  ShieldCheck,
  TrendingUp,
  Calendar,
  DollarSign,
  Briefcase,
  Sparkles,
  ChevronDown,
  ArrowRight,
  CheckCircle,
  Users
} from "lucide-react"

export function OfferServicesPage() {
  const { isAuthenticated } = useAuthStore()

  // States for the interactive simulator
  const [servicePrice, setServicePrice] = useState(60)
  const [monthlyJobs, setMonthlyJobs] = useState(25)

  // Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Calculations
  const totalRevenue = servicePrice * monthlyJobs
  const standardCommission = Math.round(totalRevenue * 0.20)
  const GestiEarnings = totalRevenue // 0% commission
  const monthlySavings = standardCommission

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      q: "¿Cuánto cuesta usar Gesti para ofrecer servicios?",
      a: "Crear tu cuenta y registrar tu primer servicio es gratis. Durante el primer mes no cobramos ninguna comisión de intermediación (0%). Posteriormente, puedes elegir planes mensuales muy económicos según el volumen de tu negocio."
    },
    {
      q: "¿Cómo recibo los pagos de mis clientes?",
      a: "Gesti integra una pasarela de pago segura. El cliente paga al reservar o confirmar la oferta, el dinero se retiene de forma segura y se libera directamente a tu cuenta bancaria una vez completado el servicio."
    },
    {
      q: "¿Puedo configurar múltiples servicios o sucursales?",
      a: "¡Sí! Nuestra arquitectura multi-servicio permite que un mismo usuario administre uno o más servicios independientes (por ejemplo, una clínica médica y un centro de fisioterapia) desde una sola consola central."
    },
    {
      q: "¿Qué herramientas incluye el panel de administración?",
      a: "Tendrás acceso a una agenda interactiva de citas, gestión de cartera de clientes con historial clínico/técnico, creación de ofertas personalizadas (paquetes, descuentos) y paneles analíticos con gráficos de rendimiento."
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Navbar Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden border-b border-border bg-muted/10">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#059669]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-8 relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#059669]/10 text-[#059669] text-xs font-semibold">
            <Sparkles className="size-3.5" />
            0% Comisión el Primer Mes
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl leading-tight">
            Monetiza tus habilidades y gestiona tu negocio como un profesional
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            La plataforma SaaS todo-en-uno que te permite digitalizar tus servicios, agendar citas, cobrar de forma segura y automatizar el crecimiento de tus clientes.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link
              to={isAuthenticated ? "/services" : "/register"}
              className="w-full sm:w-auto py-3 px-8 bg-[#059669] text-white hover:bg-[#047857] font-bold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base"
            >
              Crea tu Cuenta Gratis
              <ArrowRight className="size-5" />
            </Link>
            <a
              href="#calculadora"
              className="w-full sm:w-auto py-3 px-8 bg-card border border-border hover:bg-muted text-foreground font-semibold rounded-lg transition-all text-center text-base"
            >
              Simular Ganancias
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4.5 text-[#059669]" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4.5 text-[#059669]" />
              Configuración en 2 minutos
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4.5 text-[#059669]" />
              Cancela cuando quieras
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 space-y-24 py-16">

        {/* Features / Benefits Grid */}
        <section id="beneficios" className="container mx-auto px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Todo lo que necesitas para crecer online</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Deja atrás las planillas manuales y las aplicaciones fragmentadas. Gestiona todo desde un único panel centralizado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4 hover:border-primary/50 transition-colors">
              <div className="p-3 bg-[#059669]/10 text-[#059669] rounded-lg w-fit">
                <Calendar className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Agenda Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Define tus horarios, servicios y duraciones. Deja que tus clientes agenden directamente sin llamadas interminables.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4 hover:border-primary/50 transition-colors">
              <div className="p-3 bg-[#059669]/10 text-[#059669] rounded-lg w-fit">
                <DollarSign className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Pagos Seguros</h3>
              <p className="text-sm text-muted-foreground">
                Procesa depósitos y cobros recurrentes de forma automática. Recibe tu dinero directamente en tu banco.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4 hover:border-primary/50 transition-colors">
              <div className="p-3 bg-[#059669]/10 text-[#059669] rounded-lg w-fit">
                <Briefcase className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Cartera de Ofertas</h3>
              <p className="text-sm text-muted-foreground">
                Diseña y cataloga tus paquetes de servicios con descripciones y precios claros para tus futuros compradores.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4 hover:border-primary/50 transition-colors">
              <div className="p-3 bg-[#059669]/10 text-[#059669] rounded-lg w-fit">
                <Users className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Control de Clientes</h3>
              <p className="text-sm text-muted-foreground">
                Guarda notas de evolución, historial de citas, información de contacto y gestiona tu cartera de forma segura.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Earnings Simulator */}
        <section id="calculadora" className="container mx-auto px-8">
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">

            {/* Controls (Left) */}
            <div className="p-8 lg:p-12 lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#059669]">Calculadora de Ahorro</span>
                <h2 className="text-3xl font-bold tracking-tight">Simula tus Ingresos y Ahorros</h2>
                <p className="text-sm text-muted-foreground">
                  Compara cuánto ganas en Gesti conservando el 100% de tus ingresos frente a otras plataformas tradicionales que cobran hasta un 20% de comisión.
                </p>
              </div>

              {/* Slider 1 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">Precio promedio por Servicio</label>
                  <span className="text-lg font-bold text-[#059669]">${servicePrice} USD</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#059669]"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$10 USD</span>
                  <span>$500 USD</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">Servicios realizados al mes</label>
                  <span className="text-lg font-bold text-[#059669]">{monthlyJobs} servicios</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={monthlyJobs}
                  onChange={(e) => setMonthlyJobs(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#059669]"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 servicios</span>
                  <span>100 servicios</span>
                </div>
              </div>
            </div>

            {/* Display Stats (Right) */}
            <div className="bg-[#059669] text-white p-8 lg:p-12 lg:col-span-5 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold border-b border-white/20 pb-4">Tus Ganancias Estimadas</h3>

                <div className="space-y-1">
                  <span className="text-xs text-white/75 block">Facturación Mensual Total</span>
                  <span className="text-3xl font-bold">${totalRevenue.toLocaleString()} USD</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-white/75 block">Comisión típica en otras Apps (20%)</span>
                  <span className="text-lg font-bold text-white/80 line-through">${standardCommission.toLocaleString()} USD</span>
                </div>

                <div className="border-t border-white/20 pt-4 space-y-1">
                  <span className="text-xs text-white/90 font-semibold block">Con Gesti ganas:</span>
                  <span className="text-4xl font-bold text-white">${GestiEarnings.toLocaleString()} USD</span>
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-lg space-y-1">
                <span className="text-xs text-white/80 font-bold block uppercase tracking-wider">Tu Ahorro Neto Mensual</span>
                <span className="text-2xl font-bold text-white">+${monthlySavings.toLocaleString()} USD</span>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition / Trust Section */}
        <section className="container mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#059669]">¿Por qué elegir Gesti?</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Diseñado específicamente para profesionales independientes</h2>
            <p className="text-muted-foreground text-base">
              A diferencia de las plataformas de subastas o gig marketplaces que devalúan tu trabajo con comisiones abusivas y competencia desleal por precios bajos, Gesti te ofrece tu propio software SaaS para gestionar tu marca, tus precios y tus clientes de forma independiente.
            </p>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 text-[#059669]">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Independencia Absoluta</h4>
                  <p className="text-sm text-muted-foreground">Eres dueño de tus datos, tu cartera de clientes y tu pasarela de cobro.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 text-[#059669]">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Sin Competencia Directa en tu Perfil</h4>
                  <p className="text-sm text-muted-foreground">Tu enlace de reserva es tuyo. No mostramos anuncios de competidores en tu espacio.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border border-border p-8 rounded-2xl space-y-6">
            <h3 className="font-bold text-lg">Lo que dicen otros proveedores</h3>

            <div className="p-6 bg-card border border-border rounded-xl space-y-4 shadow-sm">
              <p className="text-sm italic text-muted-foreground">
                &quot;Antes usaba una aplicación que me cobraba el 15% de cada consulta de fisioterapia. Con Gesti registré mi clínica en 5 minutos y ahora recibo los pagos completos de forma directa. Los clientes valoran la rapidez de agendado.&quot;
              </p>
              <div>
                <p className="font-bold text-sm">Carlos Rosales</p>
                <p className="text-xs text-muted-foreground">Fisioterapeuta - Clínica de Rehabilitación</p>
              </div>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl space-y-4 shadow-sm">
              <p className="text-sm italic text-muted-foreground">
                &quot;Gestionar mis clases de inglés para adultos era un dolor de cabeza. Gesti organizó mi agenda y automatizó los cobros mensuales. Mis ingresos han aumentado un 25% gracias a que no pago comisiones.&quot;
              </p>
              <div>
                <p className="font-bold text-sm">Diana Valenzuela</p>
                <p className="text-xs text-[#059669] font-semibold">English Coach</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faqs" className="container mx-auto px-8 max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground">
              Todo lo que necesitas saber antes de registrar tus servicios en la plataforma.
            </p>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {faqs.map((faq, index) => (
              <div key={index} className="py-4">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center text-left py-2 font-bold text-base hover:text-[#059669] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`size-5 transition-transform text-muted-foreground ${openFaq === index ? "rotate-180 text-[#059669]" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${openFaq === index ? "max-h-40 mt-2 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Footer Panel */}
        <section className="container mx-auto px-8">
          <div className="bg-[#059669] text-white p-8 md:p-16 rounded-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
              Empieza a digitalizar y ofrecer tus servicios hoy mismo
            </h2>
            <p className="text-base text-white/80 max-w-xl mx-auto">
              Únete a cientos de profesionales que ya automatizan sus citas y cobros sin pagar comisiones abusivas.
            </p>
            <div className="pt-4">
              <Link
                to={isAuthenticated ? "/services" : "/register"}
                className="inline-block py-3.5 px-8 bg-white text-black hover:bg-gray-100 font-bold rounded-lg shadow-lg transition-all text-base"
              >
                Crear mi Cuenta Ahora
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border py-8 text-xs text-muted-foreground">
        <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-foreground">Gesti Marketplace</span>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <a href="#" className="hover:text-foreground transition-colors">Términos de Uso</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
            <a href="#" className="hover:text-foreground transition-colors">Soporte</a>
          </div>
          <span>© 2026 Gesti. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
