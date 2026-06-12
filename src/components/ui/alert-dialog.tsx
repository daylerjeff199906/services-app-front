import { useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "./button"

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  cancelText?: string
  confirmText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  isDestructive = true,
  isLoading = false
}: AlertDialogProps) {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={isLoading ? undefined : onClose}
      />
      {/* Content Container */}
      <div className="relative z-50 grid w-full max-w-lg gap-4 border border-border bg-card p-6 shadow-lg duration-200 sm:rounded-xl animate-in fade-in-50 zoom-in-95">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                : "bg-[#10b981] hover:bg-[#059669] text-white w-full sm:w-auto"
            }
          >
            {isLoading ? "Eliminando..." : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
