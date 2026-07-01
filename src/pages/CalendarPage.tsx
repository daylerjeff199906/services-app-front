import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Printer,
  Calendar,
  X,
  Lock
} from "lucide-react"

// Types
interface Booking {
  id: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  serviceName: string
  staffId: string
  locationId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  durationMinutes: number
}

interface BlockedSlot {
  id: string
  reason: string
  staffId: string // "all" or specific
  startDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  endDate: string // YYYY-MM-DD
  endTime: string // HH:MM
  repeat: boolean
}

export function CalendarPage() {
  const navigate = useNavigate()
  const { selectedService, user } = useAuthStore()

  // Filters & Data lists
  const [locations, setLocations] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  
  // Date State - Target Date (used to determine the current week)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 15)) // Default to Monday June 15, 2026 as per mockup
  const [miniCalMonth, setMiniCalMonth] = useState<number>(5) // June (0-indexed 5)
  const [miniCalYear, setMiniCalYear] = useState<number>(2026)

  // Bookings & Blocks
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])

  // Modal and Popover UI states
  const [activeCell, setActiveCell] = useState<{ dayStr: string; hour: number } | null>(null)
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  // Block Modal Form
  const [blockReason, setBlockReason] = useState("")
  const [blockStaffId, setBlockStaffId] = useState("all")
  const [blockStartDate, setBlockStartDate] = useState("2026-06-15")
  const [blockStartHour, setBlockStartHour] = useState("09")
  const [blockStartMin, setBlockStartMin] = useState("00")
  const [blockEndDate, setBlockEndDate] = useState("2026-06-15")
  const [blockEndHour, setBlockEndHour] = useState("10")
  const [blockEndMin, setBlockEndMin] = useState("00")
  const [blockRepeat, setBlockRepeat] = useState(false)

  // Booking Modal Form
  const [bookClientName, setBookClientName] = useState("")
  const [bookClientEmail, setBookClientEmail] = useState("")
  const [bookClientPhone, setBookClientPhone] = useState("")
  const [bookServiceName, setBookServiceName] = useState("")
  const [bookLocationId, setBookLocationId] = useState("")
  const [bookStaffId, setBookStaffId] = useState("")
  const [bookDate, setBookDate] = useState("2026-06-15")
  const [bookHour, setBookHour] = useState("09")
  const [bookMin, setBookMin] = useState("00")

  // Print Modal Form
  const [printLocationId, setPrintLocationId] = useState("")
  const [printStaffId, setPrintStaffId] = useState("")
  const [printDate, setPrintDate] = useState("2026-06-15")

  // Refs for closing popovers
  const popoverRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load static or mock base data
  useEffect(() => {
    if (!selectedService) {
      navigate("/intranet/businesses")
      return
    }

    // Load Locations
    const loadLocations = async () => {
      try {
        const { data, error } = await supabase
          .from("business_locations")
          .select("*")
          .eq("business_id", selectedService.id)
        if (error) throw error
        setLocations(data || [])
        if (data && data.length > 0) {
          setSelectedLocationId(data[0].id)
          setPrintLocationId(data[0].id)
        }
      } catch (e) {
        console.error("Failed to load locations, using mock location", e)
        const mockLoc = { id: "mock-loc-1", name: selectedService.name || "Sede Principal", address: "Av. Principal 123" }
        setLocations([mockLoc])
        setSelectedLocationId(mockLoc.id)
        setPrintLocationId(mockLoc.id)
      }
    }

    // Load Staff members
    const loadStaff = async () => {
      try {
        const { data, error } = await supabase
          .from("business_user_roles")
          .select(`
            role,
            user_id,
            profiles:user_id (
              id,
              full_name,
              username
            )
          `)
          .eq("business_id", selectedService.id)

        if (error) throw error

        const formatted = (data || []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.full_name || `Profesional ${m.profiles?.username || "Gesti"}`,
          role: m.role
        }))

        // Ensure owner is included
        if (user && !formatted.some(f => f.id === user.id)) {
          formatted.push({
            id: user.id,
            name: user.full_name || "JOSE JEFFERSON SANTOS PANAIFO",
            role: "OWNER"
          })
        }
        setStaffList(formatted)
        if (formatted.length > 0) {
          setSelectedStaffId(formatted[0].id)
          setPrintStaffId(formatted[0].id)
          setBlockStaffId(formatted[0].id)
        }
      } catch (e) {
        console.error("Failed to load team, using mock user", e)
        const mockStaff = { id: user?.id || "mock-staff-1", name: user?.full_name || "JOSE JEFFERSON SANTOS PANAIFO", role: "OWNER" }
        setStaffList([mockStaff])
        setSelectedStaffId(mockStaff.id)
        setPrintStaffId(mockStaff.id)
        setBlockStaffId(mockStaff.id)
      }
    }

    loadLocations()
    loadStaff()

    // Restore bookings / blocks from localStorage if present
    const cachedBookings = localStorage.getItem(`bookings_${selectedService.id}`)
    const cachedBlocks = localStorage.getItem(`blocks_${selectedService.id}`)
    if (cachedBookings) {
      setBookings(JSON.parse(cachedBookings))
    } else {
      // Mock initial bookings
      const mockB: Booking[] = [
        {
          id: "b-1",
          clientName: "Ana Gómez",
          serviceName: "Corte de Cabello Premium",
          staffId: user?.id || "mock-staff-1",
          locationId: "mock-loc-1",
          date: "2026-06-15",
          startTime: "11:00",
          durationMinutes: 60
        },
        {
          id: "b-2",
          clientName: "Carlos Rivas",
          serviceName: "Manicura Profesional",
          staffId: user?.id || "mock-staff-1",
          locationId: "mock-loc-1",
          date: "2026-06-17",
          startTime: "14:00",
          durationMinutes: 60
        }
      ]
      setBookings(mockB)
      localStorage.setItem(`bookings_${selectedService.id}`, JSON.stringify(mockB))
    }

    if (cachedBlocks) {
      setBlockedSlots(JSON.parse(cachedBlocks))
    } else {
      const mockBl: BlockedSlot[] = [
        {
          id: "bl-1",
          reason: "Almuerzo",
          staffId: "all",
          startDate: "2026-06-15",
          startTime: "13:00",
          endDate: "2026-06-15",
          endTime: "14:00",
          repeat: true
        }
      ]
      setBlockedSlots(mockBl)
      localStorage.setItem(`blocks_${selectedService.id}`, JSON.stringify(mockBl))
    }
  }, [selectedService])

  // Click outside triggers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveCell(null)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNewDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Sync back to localStorage
  const saveBookings = (newBookings: Booking[]) => {
    setBookings(newBookings)
    if (selectedService) {
      localStorage.setItem(`bookings_${selectedService.id}`, JSON.stringify(newBookings))
    }
  }

  const saveBlocks = (newBlocks: BlockedSlot[]) => {
    setBlockedSlots(newBlocks)
    if (selectedService) {
      localStorage.setItem(`blocks_${selectedService.id}`, JSON.stringify(newBlocks))
    }
  }

  // Get week dates based on currentDate
  const getWeekDates = (d: Date): Date[] => {
    const dates: Date[] = []
    const day = d.getDay()
    // Day index: Monday is 1, Sunday is 0.
    // Calculate difference to Monday of current week
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    for (let i = 0; i < 7; i++) {
      const temp = new Date(monday)
      temp.setDate(monday.getDate() + i)
      dates.push(temp)
    }
    return dates
  }

  const weekDates = getWeekDates(new Date(currentDate))
  const startOfWeek = weekDates[0]
  const endOfWeek = weekDates[6]

  // Month names
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  const formatDateShort = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}`
  }

  const formatDateISO = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Range text for header
  const getHeaderDateRangeString = () => {
    const formatDayFull = (d: Date) => {
      return `${dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1]}, ${d.getDate()} de ${monthNames[d.getMonth()]} de ${d.getFullYear()}`
    }
    return `${formatDayFull(startOfWeek)} - ${formatDayFull(endOfWeek)}`
  }

  // Hours array from 09:00 to 19:00
  const hours = Array.from({ length: 11 }, (_, i) => 9 + i)

  // Mini Calendar rendering logic
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonthIndex = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Monday start index
  }

  const renderMiniCalendar = () => {
    const daysInMonth = getDaysInMonth(miniCalYear, miniCalMonth)
    const firstDayIndex = getFirstDayOfMonthIndex(miniCalYear, miniCalMonth)
    const cells = []

    // Previous month filler days
    const prevMonth = miniCalMonth === 0 ? 11 : miniCalMonth - 1
    const prevYear = miniCalMonth === 0 ? miniCalYear - 1 : miniCalYear
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i)
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        dayNum: i,
        isCurrentMonth: true,
        date: new Date(miniCalYear, miniCalMonth, i)
      })
    }

    // Next month filler days to complete grid rows
    const totalCells = Math.ceil(cells.length / 7) * 7
    const nextMonth = miniCalMonth === 11 ? 0 : miniCalMonth + 1
    const nextYear = miniCalMonth === 11 ? miniCalYear + 1 : miniCalYear
    let nextDayNum = 1
    while (cells.length < totalCells) {
      cells.push({
        dayNum: nextDayNum++,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, nextDayNum - 1)
      })
    }

    return cells
  }

  const handleMiniCalPrev = () => {
    if (miniCalMonth === 0) {
      setMiniCalMonth(11)
      setMiniCalYear(prev => prev - 1)
    } else {
      setMiniCalMonth(prev => prev - 1)
    }
  }

  const handleMiniCalNext = () => {
    if (miniCalMonth === 11) {
      setMiniCalMonth(0)
      setMiniCalYear(prev => prev + 1)
    } else {
      setMiniCalMonth(prev => prev + 1)
    }
  }

  // Week navigation
  const handlePrevWeek = () => {
    const next = new Date(currentDate)
    next.setDate(currentDate.getDate() - 7)
    setCurrentDate(next)
    setMiniCalMonth(next.getMonth())
    setMiniCalYear(next.getFullYear())
  }

  const handleNextWeek = () => {
    const next = new Date(currentDate)
    next.setDate(currentDate.getDate() + 7)
    setCurrentDate(next)
    setMiniCalMonth(next.getMonth())
    setMiniCalYear(next.getFullYear())
  }

  const handleSetToday = () => {
    const today = new Date(2026, 5, 15) // Force mock today to Monday June 15, 2026 to fit layout
    setCurrentDate(today)
    setMiniCalMonth(today.getMonth())
    setMiniCalYear(today.getFullYear())
  }

  // Grid Actions
  const handleGridCellClick = (day: Date, hour: number) => {
    const dayStr = formatDateISO(day)
    setActiveCell({ dayStr, hour })
  }

  const openNewBlockModalFromCell = () => {
    if (!activeCell) return
    setBlockStartDate(activeCell.dayStr)
    setBlockEndDate(activeCell.dayStr)
    const formattedHour = String(activeCell.hour).padStart(2, '0')
    setBlockStartHour(formattedHour)
    setBlockStartMin("00")
    setBlockEndHour(String(activeCell.hour + 1).padStart(2, '0'))
    setBlockEndMin("00")
    setBlockReason("")
    setIsBlockModalOpen(true)
    setActiveCell(null)
  }

  const openNewBookingModalFromCell = () => {
    if (!activeCell) return
    setBookDate(activeCell.dayStr)
    const formattedHour = String(activeCell.hour).padStart(2, '0')
    setBookHour(formattedHour)
    setBookMin("00")
    setBookClientName("")
    setBookClientEmail("")
    setBookClientPhone("")
    setBookServiceName("")
    if (locations.length > 0) setBookLocationId(locations[0].id)
    if (staffList.length > 0) setBookStaffId(staffList[0].id)
    setIsBookingModalOpen(true)
    setActiveCell(null)
  }

  // Form Submission
  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!blockReason.trim()) {
      toast.error("Por favor, ingresa el motivo del bloqueo.")
      return
    }

    const newBlock: BlockedSlot = {
      id: `bl-${Date.now()}`,
      reason: blockReason,
      staffId: blockStaffId,
      startDate: blockStartDate,
      startTime: `${blockStartHour}:${blockStartMin}`,
      endDate: blockEndDate,
      endTime: `${blockEndHour}:${blockEndMin}`,
      repeat: blockRepeat
    }

    saveBlocks([...blockedSlots, newBlock])
    toast.success("Horario bloqueado exitosamente.")
    setIsBlockModalOpen(false)
  }

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookClientName.trim() || !bookServiceName.trim()) {
      toast.error("Por favor, ingresa el cliente y el nombre del servicio.")
      return
    }

    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      clientName: bookClientName,
      clientEmail: bookClientEmail || undefined,
      clientPhone: bookClientPhone || undefined,
      serviceName: bookServiceName,
      staffId: bookStaffId || selectedStaffId,
      locationId: bookLocationId || selectedLocationId,
      date: bookDate,
      startTime: `${bookHour}:${bookMin}`,
      durationMinutes: 60
    }

    saveBookings([...bookings, newBooking])
    toast.success("Reserva agendada exitosamente.")
    setIsBookingModalOpen(false)
  }

  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Enviando a imprimir agenda para el día ${printDate}...`)
    setIsPrintModalOpen(false)
  }


  return (
    <div className="w-screen h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 select-none">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold py-1.5 px-3 rounded-lg border border-border bg-background transition-colors outline-none cursor-pointer"
          >
            ← Volver al Panel
          </button>
          <div className="h-4 w-[1px] bg-border" />
          <span className="text-sm font-semibold tracking-tight">Agenda / Calendario Semanal</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <ThemeSwitch />
          <div className="flex items-center gap-2 font-medium">
            <span className="text-muted-foreground">Entorno de Producción</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Container with flex layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR FIXED */}
        <aside className="w-80 border-r border-border bg-card p-5 overflow-y-auto flex-shrink-0 hidden xl:flex flex-col gap-6 select-none">
            

            {/* Filters Selection Card */}
            <div className="p-5 bg-card border border-border rounded-xl space-y-4">
              {/* Branch Filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Sucursal</label>
                <div className="relative">
                  <select 
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 outline-none focus:border-[#10b981]/50 cursor-pointer appearance-none pr-8"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[10px]">▼</span>
                </div>
              </div>

              {/* Staff Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Profesional</label>
                  <span className="text-muted-foreground text-[10px] cursor-help" title="Filtra la vista del calendario según el profesional seleccionado">❓</span>
                </div>
                <div className="relative">
                  <select 
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 outline-none focus:border-[#10b981]/50 cursor-pointer appearance-none pr-8"
                  >
                    {staffList.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[10px]">▼</span>
                </div>
              </div>

              {/* Rapid Search Time Slot */}
              <Button 
                variant="outline"
                className="w-full justify-center text-xs font-semibold py-2.5 bg-muted/30 border border-border hover:bg-muted text-foreground"
                onClick={() => toast.info("Búsqueda de horas disponibles simulada")}
              >
                🔍 Búsqueda rápida de hora
              </Button>
            </div>

            {/* MINI MONTHLY DATEPICKER */}
            <div className="p-4 bg-card border border-border rounded-xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-xs font-bold text-foreground">
                  {monthNames[miniCalMonth]} {miniCalYear}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={handleMiniCalPrev}
                    className="p-1 hover:bg-muted border border-border rounded text-muted-foreground outline-none"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button 
                    onClick={handleMiniCalNext}
                    className="p-1 hover:bg-muted border border-border rounded text-muted-foreground outline-none"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-1 text-center">
                {dayNames.map(d => (
                  <span key={d} className="text-[10px] font-bold text-muted-foreground py-1 select-none">{d}</span>
                ))}
                
                {renderMiniCalendar().map((cell, idx) => {
                  const isSelected = formatDateISO(cell.date) === formatDateISO(currentDate)
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentDate(cell.date)
                        setMiniCalMonth(cell.date.getMonth())
                        setMiniCalYear(cell.date.getFullYear())
                      }}
                      className={`text-[11px] p-1.5 rounded-md hover:bg-muted font-medium outline-none transition-colors cursor-pointer ${
                        isSelected 
                          ? "bg-[#8b5cf6] text-white hover:bg-[#7c3aed]" 
                          : cell.isCurrentMonth 
                            ? "text-foreground" 
                            : "text-muted-foreground/45"
                      }`}
                    >
                      {cell.dayNum}
                    </button>
                  )
                })}
              </div>
            </div>
        </aside>

        {/* MAIN CALENDAR CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/5 space-y-6 animate-fade-in">
          {/* TOP BAR / CALENDAR HEADER (Clean, no padding, no border) */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 select-none">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calendario de Reservas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 rounded bg-muted font-bold text-xs uppercase select-none text-foreground">Semana</span>
                <div className="flex border border-border rounded-md overflow-hidden bg-background">
                  <button 
                    onClick={handlePrevWeek}
                    className="p-1.5 hover:bg-muted text-muted-foreground border-r border-border transition-colors outline-none cursor-pointer"
                    title="Semana anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button 
                    onClick={handleNextWeek}
                    className="p-1.5 hover:bg-muted text-muted-foreground transition-colors outline-none cursor-pointer"
                    title="Siguiente semana"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground font-medium pl-1 hidden sm:inline-block">
                  {getHeaderDateRangeString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSetToday}
                className="text-xs font-medium"
              >
                Hoy
              </Button>
              <button 
                onClick={() => toast.success("Agenda actualizada")}
                className="p-2 border border-border hover:bg-muted bg-background text-muted-foreground rounded-lg transition-colors outline-none cursor-pointer"
                title="Actualizar agenda"
              >
                <RefreshCw className="size-4" />
              </button>
              <button 
                onClick={() => {
                  if (locations.length > 0) setPrintLocationId(locations[0].id)
                  if (staffList.length > 0) setPrintStaffId(staffList[0].id)
                  setIsPrintModalOpen(true)
                }}
                className="p-2 border border-border hover:bg-muted bg-background text-muted-foreground rounded-lg transition-colors outline-none cursor-pointer"
                title="Imprimir horarios"
              >
                <Printer className="size-4" />
              </button>

              {/* Nuevo Dropdown Trigger */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsNewDropdownOpen(!isNewDropdownOpen)}
                  className="flex items-center gap-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-colors outline-none"
                >
                  Nuevo
                  <span className="text-[10px]">▼</span>
                </button>
                
                {isNewDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-30 py-1.5 animate-scale-in">
                    <button
                      onClick={() => {
                        setIsBookingModalOpen(true)
                        setIsNewDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Calendar className="size-4 text-violet-500" />
                      Reserva
                    </button>
                    <button
                      onClick={() => {
                        setIsBlockModalOpen(true)
                        setIsNewDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer border-t border-border/60 font-medium"
                    >
                      <Lock className="size-4 text-amber-500" />
                      Bloquear horario
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CALENDAR WEEKLY GRID */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            
            {/* GRID HEADER */}
            <div className="bg-muted/10 border-b border-border/80 p-3 text-center font-bold text-xs uppercase text-muted-foreground flex justify-between items-center">
              <span className="text-foreground text-sm font-semibold pl-2 tracking-tight">
                {user?.full_name || "JOSE JEFFERSON SANTOS PANAIFO"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[750px] divide-y divide-border/60">
                
                {/* DAYS ROW */}
                <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted/20 border-b border-border select-none">
                  {/* Empty top-left cell */}
                  <div className="border-r border-border/60 flex items-center justify-center p-3 text-[10px] font-bold text-muted-foreground">
                    🕒 Hora
                  </div>

                  {weekDates.map((date, idx) => {
                    const isToday = formatDateISO(date) === "2026-06-15" // Mock today date reference
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 text-center border-r border-border/60 last:border-r-0 flex flex-col items-center justify-center ${
                          idx === 6 ? "bg-muted/10" : ""
                        }`}
                      >
                        <span className={`text-[11px] font-semibold tracking-tight ${isToday ? "text-[#10b981]" : "text-muted-foreground"}`}>
                          {dayNames[idx]} {formatDateShort(date)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* HOUR ROWS */}
                {hours.map(hour => {
                  const timeStr = `${String(hour).padStart(2, '0')}:00`

                  return (
                    <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] group/row">
                      {/* Hour cell */}
                      <div className="border-r border-border/60 p-3.5 text-center text-xs font-bold text-muted-foreground flex items-center justify-center bg-muted/5 select-none">
                        {timeStr}
                      </div>

                      {/* Day columns */}
                      {weekDates.map((dayDate, dayIdx) => {
                        const dayStr = formatDateISO(dayDate)

                        // Check if this slot has a booking
                        const cellBookings = bookings.filter(b => 
                          b.date === dayStr && 
                          b.startTime.startsWith(String(hour).padStart(2, '0')) &&
                          b.staffId === selectedStaffId &&
                          b.locationId === selectedLocationId
                        )

                        // Check if this slot is blocked
                        const cellBlocks = blockedSlots.filter(bl => 
                          (bl.startDate === dayStr || bl.repeat) && 
                          bl.startTime.startsWith(String(hour).padStart(2, '0')) &&
                          (bl.staffId === "all" || bl.staffId === selectedStaffId)
                        )

                        const isBlocked = cellBlocks.length > 0
                        const isSunday = dayIdx === 6
                        const hasItems = cellBookings.length > 0 || isBlocked
                        const isSelected = activeCell?.dayStr === dayStr && activeCell?.hour === hour

                        return (
                          <div 
                            key={dayIdx}
                            onClick={() => {
                              if (!hasItems) handleGridCellClick(dayDate, hour)
                            }}
                            className={`border-r border-border/40 last:border-r-0 min-h-[55px] p-1.5 relative transition-colors cursor-pointer group/cell ${
                              isSunday ? "bg-muted/15" : "hover:bg-muted/20"
                            } ${isSelected ? "ring-2 ring-[#8b5cf6] ring-inset z-10 bg-[#8b5cf6]/5" : ""}`}
                          >
                            {/* Render Bookings */}
                            {cellBookings.map(b => (
                              <div 
                                key={b.id}
                                className="w-full h-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg text-[11px] font-medium leading-tight flex flex-col justify-between group shadow-2xs hover:shadow-xs transition-shadow"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (window.confirm(`¿Deseas eliminar la reserva de ${b.clientName}?`)) {
                                    saveBookings(bookings.filter(bk => bk.id !== b.id))
                                    toast.success("Reserva cancelada.")
                                  }
                                }}
                              >
                                <span className="font-semibold block truncate">{b.clientName}</span>
                                <span className="text-[9px] text-muted-foreground block truncate">{b.serviceName}</span>
                              </div>
                            ))}

                            {/* Render Blocked slots */}
                            {isBlocked && (
                              <div 
                                className="w-full h-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-2 rounded-lg text-[10px] font-medium flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (window.confirm(`¿Deseas desbloquear este horario?`)) {
                                    saveBlocks(blockedSlots.filter(bl => !cellBlocks.some(c => c.id === bl.id)))
                                    toast.success("Horario desbloqueado.")
                                  }
                                }}
                              >
                                <span className="flex items-center gap-1">
                                  <Lock className="size-3 text-amber-500 shrink-0" />
                                  <span className="truncate">{cellBlocks[0].reason}</span>
                                </span>
                              </div>
                            )}

                            {/* Inline Cell Popover on Selection */}
                            {isSelected && (
                              <div 
                                ref={popoverRef}
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-2xl z-20 py-1.5 animate-scale-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex justify-between items-center px-3 pb-1.5 border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  <span>+ Agregar</span>
                                  <button onClick={() => setActiveCell(null)} className="p-0.5 hover:bg-muted rounded text-muted-foreground">
                                    <X className="size-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={openNewBookingModalFromCell}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-foreground hover:bg-muted flex items-center gap-2 font-medium"
                                >
                                  <Calendar className="size-3.5 text-violet-500" />
                                  Reserva
                                </button>
                                <button
                                  onClick={openNewBlockModalFromCell}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-foreground hover:bg-muted flex items-center gap-2 font-medium border-t border-border/60"
                                >
                                  <Lock className="size-3.5 text-amber-500" />
                                  Bloquear horario
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: BLOCK HOURS */}
        {isBlockModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-scale-in">
              <div className="flex justify-between items-center p-5 border-b border-border bg-muted/10">
                <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Lock className="size-4.5 text-amber-500" />
                  Bloqueo de horas
                </h3>
                <button 
                  onClick={() => setIsBlockModalOpen(false)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBlock} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Motivo/Etiqueta</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="Ej. Almuerzo, Reunión, Vacaciones"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Profesional</label>
                  <select 
                    value={blockStaffId}
                    onChange={(e) => setBlockStaffId(e.target.value)}
                    className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 outline-none focus:border-[#10b981]/50 cursor-pointer"
                  >
                    <option value="all">Todos</option>
                    {staffList.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border/80 p-4 rounded-xl bg-muted/5">
                  {/* Start */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fecha de inicio</label>
                      <Input 
                        type="date" 
                        required
                        value={blockStartDate}
                        onChange={(e) => setBlockStartDate(e.target.value)}
                        className="w-full text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-sans">Hora</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          value={blockStartHour}
                          onChange={(e) => setBlockStartHour(e.target.value)}
                          className="text-xs text-foreground bg-background border border-border rounded-lg p-2 outline-none"
                        >
                          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <select 
                          value={blockStartMin}
                          onChange={(e) => setBlockStartMin(e.target.value)}
                          className="text-xs text-foreground bg-background border border-border rounded-lg p-2 outline-none"
                        >
                          {["00", "15", "30", "45"].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* End */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fecha de fin</label>
                      <Input 
                        type="date" 
                        required
                        value={blockEndDate}
                        onChange={(e) => setBlockEndDate(e.target.value)}
                        className="w-full text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Hora</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          value={blockEndHour}
                          onChange={(e) => setBlockEndHour(e.target.value)}
                          className="text-xs text-foreground bg-background border border-border rounded-lg p-2 outline-none"
                        >
                          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <select 
                          value={blockEndMin}
                          onChange={(e) => setBlockEndMin(e.target.value)}
                          className="text-xs text-foreground bg-background border border-border rounded-lg p-2 outline-none"
                        >
                          {["00", "15", "30", "45"].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Repeat checkbox */}
                <div className="flex items-center gap-2.5 border border-border/80 p-4 rounded-xl bg-card">
                  <input 
                    type="checkbox" 
                    id="repeat-block" 
                    checked={blockRepeat}
                    onChange={(e) => setBlockRepeat(e.target.checked)}
                    className="size-4 accent-violet-600 rounded cursor-pointer"
                  />
                  <label htmlFor="repeat-block" className="text-xs text-foreground font-semibold cursor-pointer">Repetir bloqueo</label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border bg-muted/10 -mx-6 -mb-6 p-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsBlockModalOpen(false)}
                    className="text-xs font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-semibold px-5"
                  >
                    Guardar bloqueo
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: PRINT PRESTADORES SCHEDULE */}
        {isPrintModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative animate-scale-in">
              <div className="flex justify-between items-center p-5 border-b border-border bg-muted/10">
                <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Printer className="size-4.5 text-violet-500" />
                  Imprimir horarios de prestadores
                </h3>
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handlePrintSubmit} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Local</label>
                  <select 
                    required
                    value={printLocationId}
                    onChange={(e) => setPrintLocationId(e.target.value)}
                    className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 outline-none"
                  >
                    <option value="" disabled>Selecciona la sucursal</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Profesional</label>
                  <select 
                    required
                    value={printStaffId}
                    onChange={(e) => setPrintStaffId(e.target.value)}
                    className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 outline-none"
                  >
                    <option value="" disabled>Selecciona un profesional</option>
                    {staffList.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Fecha</label>
                  <Input 
                    type="date"
                    required
                    value={printDate}
                    onChange={(e) => setPrintDate(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border bg-muted/10 -mx-6 -mb-6 p-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPrintModalOpen(false)}
                    className="text-xs font-semibold"
                  >
                    Cerrar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-semibold px-5"
                  >
                    Imprimir
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: NEW BOOKING (Contextual appointment modal) */}
        {isBookingModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-scale-in">
              <div className="flex justify-between items-center p-5 border-b border-border bg-muted/10">
                <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Calendar className="size-4.5 text-[#10b981]" />
                  Nueva Reserva
                </h3>
                <button 
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBooking} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Cliente</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="Ej. Ana Gómez"
                    value={bookClientName}
                    onChange={(e) => setBookClientName(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Correo Electrónico (Opcional)</label>
                    <Input 
                      type="email" 
                      placeholder="ejemplo@correo.com"
                      value={bookClientEmail}
                      onChange={(e) => setBookClientEmail(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Teléfono (Opcional)</label>
                    <Input 
                      type="tel" 
                      placeholder="Ej. +51 987 654 321"
                      value={bookClientPhone}
                      onChange={(e) => setBookClientPhone(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Servicio</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="Ej. Corte de Cabello Premium, Manicura"
                    value={bookServiceName}
                    onChange={(e) => setBookServiceName(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Sucursal</label>
                    <select 
                      value={bookLocationId}
                      onChange={(e) => setBookLocationId(e.target.value)}
                      className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 outline-none cursor-pointer"
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Profesional asignado</label>
                    <select 
                      value={bookStaffId}
                      onChange={(e) => setBookStaffId(e.target.value)}
                      className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 outline-none cursor-pointer"
                    >
                      {staffList.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Fecha</label>
                    <Input 
                      type="date" 
                      required
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Hora de inicio</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={bookHour}
                        onChange={(e) => setBookHour(e.target.value)}
                        className="text-xs text-foreground bg-background border border-border rounded-lg p-2 outline-none"
                      >
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select 
                        value={bookMin}
                        onChange={(e) => setBookMin(e.target.value)}
                        className="text-xs text-foreground bg-background border border-border rounded-lg p-2 outline-none"
                      >
                        {["00", "15", "30", "45"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border bg-muted/10 -mx-6 -mb-6 p-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsBookingModalOpen(false)}
                    className="text-xs font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold px-5"
                  >
                    Agendar Reserva
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
