import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronsUpDown, LogOut, ArrowLeft } from "lucide-react"

export function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { user, setUser, selectedService, logout } = useAuthStore()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Fetch current profile data from database on mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      if (!user?.id) return
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, username, full_name")
          .eq("id", user.id)
          .single()

        if (error) throw error

        if (data) {
          setFirstName(data.first_name || "")
          setLastName(data.last_name || "")
          setUsername(data.username || "")
          
          // Sync with auth store
          setUser({
            ...user,
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
            full_name: data.full_name,
          })
        }
      } catch (err) {
        console.error("Error loading latest profile:", err)
      }
    }

    if (user) {
      setEmail(user.email || "")
      fetchLatestProfile()
    }
  }, [user?.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate("/login", { replace: true })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const fullName = `${firstName} ${lastName}`.trim()

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          username: username || null,
          full_name: fullName || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) throw error

      // Update local store
      setUser({
        ...user,
        first_name: firstName || null,
        last_name: lastName || null,
        username: username || null,
        full_name: fullName || null,
      })

      setMessage({ type: "success", text: "Perfil actualizado con éxito." })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: "error", text: err.message || "Error al actualizar el perfil." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (selectedService) {
      navigate("/dashboard")
    } else {
      navigate("/intranet/businesses")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 border border-border rounded-md bg-muted/20"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </button>
          <span className="font-extrabold text-xl text-[#059669] tracking-tighter ml-2">
            Gesti
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <ThemeSwitch />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none p-1.5 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                <Avatar className="h-8 w-8 rounded-lg border border-border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.full_name || user?.email || "G")}`} alt={user?.full_name || ""} />
                  <AvatarFallback className="rounded-lg">US</AvatarFallback>
                </Avatar>
                <div className="hidden md:grid text-left text-xs leading-tight">
                  <span className="truncate font-semibold text-sm text-foreground">{user?.full_name || "Usuario"}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronsUpDown className="ml-1 size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg border border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.full_name || user?.email || "G")}`} alt={user?.full_name || ""} />
                    <AvatarFallback className="rounded-lg">US</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.full_name || "Usuario"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="gap-2 p-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Settings Form Container */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-1 mb-10">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Preferencias</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el perfil de tu cuenta y la experiencia del panel de control.
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 border rounded-lg text-sm font-medium ${message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <h2 className="text-lg font-medium text-foreground">Información del perfil</h2>

          {/* Form Card Group */}
          <div className="border border-border rounded-xl bg-card overflow-hidden">

            {/* First Name Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3">
                <label htmlFor="first-name" className="text-sm font-medium text-foreground">Nombre</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="first-name"
                  type="text"
                  placeholder="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Last Name Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3">
                <label htmlFor="last-name" className="text-sm font-medium text-foreground">Apellidos</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Apellidos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Primary Email Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Correo electrónico principal</label>
                <p className="text-xs text-muted-foreground">Usado para las notificaciones de la cuenta</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="flex items-stretch rounded-md border border-input bg-muted/30 overflow-hidden text-sm px-3 py-2 select-none text-muted-foreground">
                  <span className="flex-1 truncate">{email}</span>
                </div>
              </div>
            </div>

            {/* Username Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="username" className="text-sm font-medium text-foreground">Nombre de usuario</label>
                <p className="text-xs text-muted-foreground">Nombre para mostrar en el panel de control</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="username"
                  type="text"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Save Button Row */}
            <div className="bg-muted/10 px-6 py-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#10b981] hover:bg-[#059669] text-white font-medium px-5 rounded-lg border-0 shadow-none transition-colors"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>

          </div>
        </form>
      </main>
    </div>
  )
}
