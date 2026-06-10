"use client"

import * as React from "react"
import { useAuthStore } from "@/store/auth.store"
import { useNavigate } from "react-router-dom"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  CreditCard, 
  Settings2, 
  GalleryVerticalEnd 
} from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, services, selectedService, selectService, logout } = useAuthStore()
  const navigate = useNavigate()

  // 1. Map tenant services to Switcher Teams
  const teams = services.map((service) => ({
    name: service.name,
    logo: <GalleryVerticalEnd className="size-4" />,
    plan: service.description || service.slug,
    service: service
  }))

  const activeTeam = selectedService
    ? {
        name: selectedService.name,
        logo: <GalleryVerticalEnd className="size-4" />,
        plan: selectedService.description || selectedService.slug,
      }
    : undefined

  const handleSelectService = (team: any) => {
    // Find the corresponding service
    const matchingService = services.find((s) => s.name === team.name)
    if (matchingService) {
      selectService(matchingService)
    }
  }

  // 2. Map NavMain items depending on user role
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      title: "Facturación y Planes",
      url: "/dashboard/billing",
      icon: <CreditCard className="size-4" />,
    },
  ]

  if (user?.role === "SAAS_ADMIN") {
    navMain.push({
      title: "Configuración Global",
      url: "/dashboard/admin-settings",
      icon: <Settings2 className="size-4" />,
    })
  }

  // 3. User details and logout handler
  const sidebarUser = {
    name: user?.name || "Usuario",
    email: user?.email || "",
    avatar: "", // empty so fallback is used
  }

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher 
          teams={teams} 
          activeTeam={activeTeam}
          onSelect={handleSelectService}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
