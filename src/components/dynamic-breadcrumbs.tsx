"use client"

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import React from "react";

const routeMap: Record<string, string> = {
  dashboard: "Inicio",
  occurrences: "Monitoreo",
  multimedia: "Multimedia",
  taxa: "Taxonomía",
  locations: "Ubicaciones",
  events: "Eventos",
  edit: "Editar",
  create: "Nuevo",
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((v) => v);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = routeMap[segment] || (segment.length > 20 ? segment.substring(0, 8) + "..." : segment);

          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-xs font-semibold text-foreground capitalize">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors capitalize">
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="h-3 w-3 opacity-40" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
