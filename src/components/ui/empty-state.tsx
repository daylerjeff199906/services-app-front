import React from "react"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  action?: React.ReactNode
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="py-12 border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 bg-muted/5 text-center px-4 animate-fade-in">
      {Icon && <Icon className="size-8 text-muted-foreground/40" />}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
