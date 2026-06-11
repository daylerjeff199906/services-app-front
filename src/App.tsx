import { useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/query-client"
import { AppRouter } from "./routes/AppRouter"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useThemeStore } from "./store/theme.store"
import { PageHeaderProvider } from "@/components/providers/page-header-provider"

function App() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PageHeaderProvider>
          <AppRouter />
        </PageHeaderProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
