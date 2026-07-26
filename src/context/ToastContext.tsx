import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"

export type ToastType = "error" | "success" | "info"
export interface ToastItem {
  id: number
  type: ToastType
  text: string
}

interface ToastCtx {
  toasts: ToastItem[]
  notify: (text: string, type?: ToastType) => void
  dismiss: (id: number) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (text: string, type: ToastType = "info") => {
      const id = ++seq.current
      setToasts((prev) => [...prev.slice(-3), { id, type, text }]) // en fazla ~4 toast
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return <Ctx.Provider value={{ toasts, notify, dismiss }}>{children}</Ctx.Provider>
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useToast, ToastProvider içinde kullanılmalı")
  return c
}