import { useToast } from "../context/ToastContext"
import "./Toast.css"

const ICO: Record<string, string> = { error: "⚠", success: "✓", info: "ℹ" }

export default function ToastHost() {
  const { toasts, dismiss } = useToast()
  if (!toasts.length) return null
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} onClick={() => dismiss(t.id)}>
          <span className="toast__ico">{ICO[t.type]}</span>
          <span className="toast__txt">{t.text}</span>
        </div>
      ))}
    </div>
  )
}