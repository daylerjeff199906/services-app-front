import { useEffect, useRef, useState } from "react"

interface MapPickerProps {
  lat: string
  lng: string
  onChange: (lat: string, lng: string) => void
}

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // 1. Load Leaflet CDN Assets dynamically
  useEffect(() => {
    if ((window as any).L) {
      setIsLoaded(true)
      return
    }

    // CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)

    // JS
    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.async = true
    script.onload = () => {
      setIsLoaded(true)
    }
    document.body.appendChild(script)
  }, [])

  // 2. Initialize and configure the map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return

    const L = (window as any).L
    if (!L) return

    const initialLat = lat ? parseFloat(lat) : -12.04637
    const initialLng = lng ? parseFloat(lng) : -77.04279
    const initialZoom = lat && lng ? 15 : 12

    // Remove any previous map instance to prevent double-initialization
    if (mapRef.current) {
      mapRef.current.remove()
    }

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], initialZoom)
    mapRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Use absolute CDN URLs for the marker to bypass Vite bundler asset mapping issues
    const customIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map)
    markerRef.current = marker

    // Handle marker dragging
    marker.on("dragend", () => {
      const position = marker.getLatLng()
      onChange(position.lat.toFixed(6), position.lng.toFixed(6))
    })

    // Handle map click
    map.on("click", (e: any) => {
      const { lat: clickLat, lng: clickLng } = e.latlng
      marker.setLatLng([clickLat, clickLng])
      onChange(clickLat.toFixed(6), clickLng.toFixed(6))
    })

    // center map based on browser geolocation if no coordinate is specified
    if (!lat && !lng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude
          const userLng = position.coords.longitude
          map.setView([userLat, userLng], 14)
          marker.setLatLng([userLat, userLng])
          onChange(userLat.toFixed(6), userLng.toFixed(6))
        },
        (err) => console.log("Geolocation ignored or failed:", err),
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isLoaded])

  // 3. Update map marker position when coordinate input fields are modified
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return

    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)

    if (isNaN(parsedLat) || isNaN(parsedLng)) return

    const currentLatLng = markerRef.current.getLatLng()
    // Use threshold tolerance check to avoid infinite coordinate setter loops
    if (Math.abs(currentLatLng.lat - parsedLat) > 0.0001 || Math.abs(currentLatLng.lng - parsedLng) > 0.0001) {
      markerRef.current.setLatLng([parsedLat, parsedLng])
      mapRef.current.setView([parsedLat, parsedLng], mapRef.current.getZoom())
    }
  }, [lat, lng])

  return (
    <div className="w-full space-y-2">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[260px] rounded-xl border border-border bg-muted/20 relative z-10 overflow-hidden shadow-inner"
        style={{ minHeight: "260px" }}
      />
      <p className="text-[10px] text-muted-foreground font-medium">
        📌 Haz click en cualquier punto del mapa o arrastra el pin azul para establecer las coordenadas del local.
      </p>
    </div>
  )
}
