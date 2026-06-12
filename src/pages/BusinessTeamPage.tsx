import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"

interface Member {
  id: string
  role: string
  profile: {
    id: string
    full_name: string | null
    username: string | null
  } | null
}

export function BusinessTeamPage() {
  const navigate = useNavigate()
  const { selectedService, user } = useAuthStore()

  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }

    const fetchMembers = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("business_user_roles")
          .select(`
            id,
            role,
            profiles:user_id (
              id,
              full_name,
              username
            )
          `)
          .eq("business_id", selectedService.id)

        if (error) throw error

        const formatted = (data || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          profile: m.profiles,
        }))
        setMembers(formatted)
      } catch (err) {
        console.error("Error loading team members:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [selectedService, navigate])

  const filteredMembers = members.filter((m) => {
    const fullName = (m.profile?.full_name || "").toLowerCase()
    const username = (m.profile?.username || "").toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || username.includes(query)
  })

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-64 bg-muted border border-border rounded-xl mt-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto space-y-8 text-foreground">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <PageHeader
            onBackClick={() => navigate("/dashboard/settings/business")}
            showBackButton
            title="Equipo"
            description="Administra los roles, permisos e invitaciones de los miembros de tu negocio."
          />
        </div>

        <Button
          type="button"
          onClick={() => navigate("/dashboard/settings/business/team/invite")}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-medium shrink-0"
        >
          <Plus className="size-4 mr-2" />
          Invitar miembros
        </Button>
      </div>

      {/* Control Bar */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Filtrar miembros..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-1.5 text-sm outline-none focus-visible:ring-ring/20"
        />
      </div>

      {/* Members Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase font-semibold">
                <th className="p-4">Miembro</th>
                <th className="p-4">MFA</th>
                <th className="p-4">Rol</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs font-medium">
                    No se encontraron miembros que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const isCurrentUser = m.profile?.id === user?.id
                  return (
                    <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="size-8 rounded-full border border-border bg-muted/30 flex items-center justify-center font-medium select-none">
                          {m.profile?.full_name?.charAt(0) || m.profile?.username?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {m.profile?.full_name || "Usuario Gesti"}
                            {isCurrentUser && (
                              <span className="ml-2 text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded border border-border uppercase tracking-wider text-muted-foreground">
                                Tú
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{m.profile?.username || "sin_username"}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground select-none">
                        Disabled
                      </td>
                      <td className="p-4 font-medium text-xs select-none">
                        <span className="px-2 py-0.5 bg-muted rounded border border-border uppercase tracking-wider">
                          {m.role === "OWNER" ? "Owner" : m.role === "MANAGER" ? "Administrator" : "Developer"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isCurrentUser || m.role === "OWNER"}
                          onClick={() => {
                            // Leave team/remove logic (can be expanded later if user requests it)
                            alert("Acción no implementada. Solo los propietarios pueden gestionar la remoción.")
                          }}
                          className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                        >
                          Abandonar equipo
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
