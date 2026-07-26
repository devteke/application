import { useEffect, useState } from "react"
import type { EventsResponse } from "../types/sportsbook"
import { apiGet } from "../utils/api"
import { useToast } from "../context/ToastContext"
import { errorMessage } from "../utils/errors"

const PATH = "/api/web/v1/sportsbook/event/0?sportType=SOCCER&betType=PRE_EVENT"

export function useEvents() {
  const { notify } = useToast()
  const [data, setData] = useState<EventsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    apiGet<EventsResponse>(PATH)
      .then((json) => { if (alive) { setData(json); setError(null) } })
      .catch((e) => {
        if (!alive) return
        setError(String(e?.message ?? e))
        notify(errorMessage(e), "error")   // "Çok hızlısın…" / "Sunucuya ulaşılamadı…"
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading, error }
}