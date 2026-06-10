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
  gradient,
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
      className="group flex flex-col cursor-pointer transition-transform duration-200 hover:-translate-y-1 w-full"
    >
      {/* Image container with rounded corners and overlays */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted/45 border border-border">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient || 'from-emerald-500/10 to-teal-500/10'}`}>
            <div className="transform group-hover:scale-110 transition-transform duration-300 text-foreground scale-110">
              {icon}
            </div>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button 
          onClick={handleFavorite}
          className="absolute right-3 top-3 p-2 rounded-full bg-background/85 hover:bg-background text-muted-foreground hover:text-red-500 transition-colors shadow-sm cursor-pointer z-10 border border-border/50"
        >
          <Heart className={`size-3.5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Top-Left Badge (Translucent) */}
        {badge && (
          <span className="absolute left-3 top-3 px-2 py-0.5 bg-background/90 text-foreground font-bold text-[9px] uppercase tracking-wider rounded-md shadow-sm pointer-events-none z-10 border border-border">
            {badge}
          </span>
        )}
      </div>

      {/* Details below image */}
      <div className="mt-3 space-y-0.5 text-left">
        {/* Title and Rating */}
        <div className="flex items-start justify-between gap-2 text-sm">
          <h3 className="font-bold text-foreground line-clamp-1 flex-1 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-1 font-semibold flex-shrink-0 text-foreground">
            <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Provider and Category */}
        <p className="text-xs text-muted-foreground line-clamp-1">
          {provider} • {category}
        </p>

        {/* Price tag matching Airbnb */}
        <p className="text-sm font-semibold text-foreground pt-0.5">
          <span className="font-extrabold text-foreground">{price}</span> <span className="text-xs text-muted-foreground font-normal">por sesión</span>
        </p>
      </div>
    </div>
  )
}
