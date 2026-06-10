"use client"
import { ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"

import { type AdminRouteItem } from "@/config/admin-routes"

export function NavAdmin({
    items,
    label = "Menu",
}: {
    items: AdminRouteItem[]
    label?: string
}) {
    const pathname = usePathname()

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isDashboard = item.url.endsWith('/admin')
                    const isActive = isDashboard
                        ? pathname === item.url
                        : (pathname === item.url || pathname.startsWith(item.url + "/"))
                    if (item.items && item.items.length > 0) {
                        return (
                            <Collapsible
                                key={item.title}
                                defaultOpen={isActive}
                                className="group/collapsible"
                            >
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => {
                                            const isSubActive = pathname === subItem.url
                                            return (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton isActive={isSubActive}>
                                                        <span>{subItem.title}</span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            )
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        )
                    }
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}
