import { Link } from "react-router-dom"
import { SignupForm } from "@/components/signup-form"

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Left side: SignupForm and header branding */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 max-w-xl mx-auto w-full">
        {/* Top Header Branding */}
        <div>
          <Link to="/" className="font-extrabold text-2xl text-[#059669] tracking-tighter flex items-center gap-1.5 w-fit">
            ServiceX
          </Link>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8">
          <SignupForm className="w-full max-w-sm mx-auto" />
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ServiceX. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side: Image banner */}
      <div className="hidden md:block flex-1 relative bg-muted overflow-hidden">
        <img 
          src="/images/register_banner.png" 
          alt="Register banner" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle overlay shading for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex flex-col justify-end p-12 text-white">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              "Crear mi cuenta en ServiceX me tomó menos de un minuto. En solo una semana ya tenía mis primeros clientes agendados sin comisiones."
            </p>
            <footer className="text-sm font-semibold text-white/80">
              — Lucía Gómez, Terapeuta Holística
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}

