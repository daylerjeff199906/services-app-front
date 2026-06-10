import { LayoutDashboard, Layers, Map, ClipboardList, AudioLines } from "lucide-react"

export interface AdminRouteItem {
  title: string
  url: string
  icon?: any
  items?: {
    title: string
    url: string
  }[]
}

export const getAdminRoutes = (_locale?: string): AdminRouteItem[] => {
  return [
    {
      title: "Inicio",
      url: `/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: "Taxonomía",
      url: "#",
      icon: Layers,
      items: [
        {
          title: "Clases",
          url: `/dashboard/taxa/classes`,
        },
        {
          title: "Órdenes",
          url: `/dashboard/taxa/orders`,
        },
        {
          title: "Familias",
          url: `/dashboard/taxa/families`,
        },
        {
          title: "Géneros",
          url: `/dashboard/taxa/genera`,
        },
        {
          title: "Catálogo de Especies",
          url: `/dashboard/taxa`,
        },
      ],
    },
    {
      title: "Geografía",
      url: "#",
      icon: Map,
      items: [
        {
          title: "Instituciones",
          url: `/dashboard/geography/institutions`,
        },
        {
          title: "Regiones Naturales",
          url: `/dashboard/geography/natural-regions`,
        },
        {
          title: "Hábitats",
          url: `/dashboard/geography/ecosystems`,
        },
        {
          title: "Ubicaciones",
          url: `/dashboard/locations`,
        },
      ],
    },
    {
      title: "Monitoreo",
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "Registrar Colección",
          url: `/dashboard/collections/new`,
        },
        {
          title: "Lista de Ocurrencias",
          url: `/dashboard/occurrences`,
        },
        {
          title: "Eventos de Muestreo",
          url: `/dashboard/events`,
        },
      ],
    },
    {
      title: "Mediateca",
      url: "#",
      icon: AudioLines,
      items: [
        {
          title: "Archivos Multimedia",
          url: `/dashboard/multimedia`,
        },
      ],
    },
    {
      title: "Configuración",
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "Operaciones Masivas",
          url: `/dashboard/bulk`,
        },
        {
          title: "Usuarios",
          url: `/dashboard/users`,
        },
      ],
    },
  ]
}
