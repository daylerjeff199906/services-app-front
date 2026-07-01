import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"

// Hardcoded services lookup map for /servicio/:id routes
const serviceLookup: Record<string, { title: string; provider: string; desc: string }> = {
  s_1: {
    title: "Asesoría Legal Laboral y Contratos",
    provider: "Estudio Jurídico Mendoza & Asoc.",
    desc: "Brindamos asesoramiento legal integral en materia de derecho laboral, confección y revisión de contratos de trabajo, indemnizaciones, despidos y mediaciones.",
  },
  s_2: {
    title: "Consulta Médica General Online",
    provider: "Centro Médico San José",
    desc: "Atención médica virtual inmediata para el diagnóstico y tratamiento de patologías comunes, emisión de recetas digitales, órdenes de laboratorio y certificados de salud.",
  },
  s_3: {
    title: "Diseño de Marca y Logotipo Profesional",
    provider: "Agencia Creativa Prisma",
    desc: "Creamos la identidad visual de tu marca. Incluye diseño de logotipo vectorizado, paleta de colores, tipografías institucionales, manual de marca simplificado.",
  },
  s_4: {
    title: "Desarrollo Web React & Node.js",
    provider: "DevsUnited Consultores",
    desc: "Desarrollamos sitios web modernos, responsivos y altamente escalables utilizando React en el frontend y Node.js en el backend.",
  },
  s_5: {
    title: "Clases Personalizadas de Inglés C1",
    provider: "Prof. Sarah Jenkins",
    desc: "Aprende o perfecciona tu nivel de inglés enfocado en tus metas profesionales o académicas. Sesiones personalizadas e interactivas uno a uno.",
  },
  s_6: {
    title: "Campaña de Marketing Digital & Ads",
    provider: "Pixel Growth Marketing",
    desc: "Diseño y optimización de campañas de publicidad digital en Meta Ads y Google Ads. Estructuramos tu embudo de ventas digital.",
  },
  s_7: {
    title: "Terapia de Fisioterapia Deportiva",
    provider: "KinesioSport Center",
    desc: "Rehabilitación de lesiones deportivas, dolores musculares y articulares con técnicas modernas y fisioterapeutas certificados.",
  },
  s_8: {
    title: "Auditoría Financiera y Contable",
    provider: "Valenzuela & Asociados",
    desc: "Analizamos en profundidad los estados contables de tu negocio, flujo de caja y cumplimiento tributario para detectar anomalías y sugerir mejoras.",
  },
  s_9: {
    title: "Corte de Cabello Premium y Estilismo",
    provider: "Salón de Belleza Silvia",
    desc: "Servicio de corte de cabello unisex, peinado, lavado y tratamiento capilar hidratante con los mejores estilistas.",
  },
  s_10: {
    title: "Corte y Perfilado de Barba de Caballero",
    provider: "La Hermandad Barbería",
    desc: "Servicio de barbería clásica de caballero que incluye corte moderno, perfilado de barba con toalla caliente y afeitado tradicional.",
  },
  s_11: {
    title: "Servicio de Pedicure y Spa de Pies",
    provider: "Nails & Co. Wellness Spa",
    desc: "Tratamiento estético completo para tus pies. Incluye limpieza profunda, exfoliación, remoción de callosidades y esmaltado.",
  },
  s_12: {
    title: "Servicio de Electricista Domiciliario",
    provider: "Servicios Técnicos Express",
    desc: "Solución a problemas eléctricos del hogar: reparación de cortocircuitos, instalación de luminarias y cableado general con garantía.",
  },
}

export function MetadataManager() {
  const location = useLocation()
  const { selectedService } = useAuthStore()

  useEffect(() => {
    const pathname = location.pathname
    let title = "Gesti Marketplace"
    let description = "Plataforma para reservar y ofrecer servicios profesionales online y locales de forma fácil y segura."

    // 1. Dashboard / Intranet routes (Requires active business / service selection)
    if (pathname.startsWith("/dashboard")) {
      const bizName = selectedService?.name || "Mi Negocio"
      let sectionName = "Panel de Control"

      if (pathname.startsWith("/dashboard/settings/business/team/invite")) {
        sectionName = "Invitar Miembro"
      } else if (pathname.startsWith("/dashboard/settings/business/team")) {
        sectionName = "Equipo de Trabajo"
      } else if (pathname.startsWith("/dashboard/settings/business")) {
        sectionName = "Ajustes de Empresa"
      } else if (pathname.startsWith("/dashboard/services/new")) {
        sectionName = "Nuevo Servicio"
      } else if (/\/dashboard\/services\/edit\/[^/]+/.test(pathname)) {
        sectionName = "Editar Servicio"
      } else if (pathname.startsWith("/dashboard/services/categories")) {
        sectionName = "Categorías de Servicio"
      } else if (pathname.startsWith("/dashboard/services")) {
        sectionName = "Servicios Ofrecidos"
      } else if (pathname.startsWith("/dashboard/agenda/hours")) {
        sectionName = "Horarios de Atención"
      } else if (pathname.startsWith("/dashboard/agenda/locations/new")) {
        sectionName = "Nueva Ubicación"
      } else if (/\/dashboard\/agenda\/locations\/edit\/[^/]+/.test(pathname)) {
        sectionName = "Editar Ubicación"
      } else if (pathname.startsWith("/dashboard/agenda/locations")) {
        sectionName = "Ubicaciones y Sedes"
      } else if (pathname.startsWith("/dashboard/agenda/calendar")) {
        sectionName = "Calendario de Reservas"
      }

      title = `${sectionName} - ${bizName} | Gesti`
      description = `Administra ${sectionName.toLowerCase()} para la empresa ${bizName} en el panel de control de Gesti.`
    }
    // 2. Intranet Setup / Choice routes
    else if (pathname === "/intranet/businesses") {
      title = "Mis Negocios | Gesti"
      description = "Lista y administra tus negocios o proyectos registrados en la plataforma Gesti."
    } else if (pathname === "/intranet/businesses/new") {
      title = "Crear Nuevo Negocio | Gesti"
      description = "Crea y configura un nuevo espacio de trabajo o empresa en Gesti."
    } else if (pathname === "/profile/settings") {
      title = "Ajustes de Perfil | Gesti"
      description = "Gestiona tus datos personales, preferencias de cuenta y configuración de perfil."
    } else if (pathname === "/onboarding/profile") {
      title = "Completar Perfil | Gesti"
      description = "Ingresa tus datos personales y finaliza tu proceso de registro en Gesti."
    }
    // 3. Public Service Detail Page: /servicio/:id
    else if (pathname.startsWith("/servicio/")) {
      const match = pathname.match(/^\/servicio\/([^/]+)$/)
      const serviceId = match ? match[1] : null
      const service = serviceId ? serviceLookup[serviceId] : null

      if (service) {
        title = `${service.title} - ${service.provider} | Gesti`
        description = service.desc
      } else {
        title = "Detalle del Servicio | Gesti"
        description = "Consulta la información detallada del servicio y realiza tu reserva online de forma segura."
      }
    }
    // 4. Other Public Pages
    else if (pathname === "/buscar") {
      title = "Buscar Servicios | Gesti"
      description = "Explora y encuentra servicios profesionales locales y online: diseño, salud, legal, estética, tecnología y más."
    } else if (pathname === "/ofrecer") {
      title = "Ofrecer Servicios | Gesti"
      description = "Registra tu negocio o perfil profesional en Gesti y comienza a ofrecer tus servicios hoy mismo."
    } else if (pathname === "/login") {
      title = "Iniciar Sesión | Gesti"
      description = "Accede a tu cuenta de Gesti para gestionar tus reservas o administrar tu negocio."
    } else if (pathname === "/register") {
      title = "Registrarse | Gesti"
      description = "Crea una cuenta en Gesti y conéctate con profesionales de tu zona o comienza a ofrecer servicios."
    } else if (pathname === "/todos") {
      title = "Tareas Pendientes (Todos) | Gesti"
      description = "Pruebas de integración de base de datos con Supabase en la sección de tareas."
    } else if (pathname === "/") {
      title = "Gesti Marketplace - Encuentra servicios locales profesionales"
      description = "La plataforma líder para reservar citas y encontrar profesionales confiables de forma rápida, segura y sencilla."
    }

    // Set document title
    document.title = title

    // Set meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement("meta")
      metaDescription.setAttribute("name", "description")
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute("content", description)
  }, [location.pathname, selectedService])

  return null
}
