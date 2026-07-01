import React, { useState } from "react"
import { Heart, Star } from "lucide-react"

interface ServiceCardProps {
  id: string
  title: string
  provider: string
  category: string
  price: string
  rating: number
  imageUrl?: string
  badge?: string
  icon?: React.ReactNode
  gradient?: string
  onClick?: () => void
}

export function ServiceCard({
  title,
  provider,
  category,
  price,
  rating,
  imageUrl,
  badge,
  icon,
  onClick
}: ServiceCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  return (
    <div
      onClick={onClick}
      className="group flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-0.5 w-full"
    >
      {/* Image container with rounded corners and overlays */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted/30 border border-border/60">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="transform group-hover:scale-105 transition-transform duration-500 text-muted-foreground/80">
              {icon}
            </div>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavorite}
          className="absolute right-3 top-3 p-1.5 rounded-full bg-background/90 hover:bg-background text-muted-foreground hover:text-red-500 transition-colors shadow-sm cursor-pointer z-10 border border-border/40"
        >
          <Heart className={`size-3.5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Top-Left Badge (Translucent) */}
        {badge && (
          <span className="absolute left-3 top-3 px-2 py-0.5 bg-background/90 text-foreground font-semibold text-[9px] uppercase tracking-wider rounded-md shadow-sm pointer-events-none z-10 border border-border/80">
            {badge}
          </span>
        )}
      </div>

      {/* Details below image */}
      <div className="mt-3.5 space-y-1 text-left">
        {/* Title and Rating */}
        <div className="flex items-start justify-between gap-2 text-sm">
          <h3 className="font-semibold text-foreground line-clamp-1 flex-1 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-1 font-medium flex-shrink-0 text-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Provider and Category */}
        <p className="text-xs text-muted-foreground line-clamp-1">
          {provider} • {category}
        </p>

        {/* Price tag */}
        <p className="text-sm font-medium text-foreground pt-0.5">
          <span className="font-semibold text-foreground">{price}</span> <span className="text-xs text-muted-foreground font-normal">por sesión</span>
        </p>
      </div>
    </div>
  )
}
