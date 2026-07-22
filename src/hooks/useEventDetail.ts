import { useEffect, useState } from "react"
import type { EventDetail, EventDetailResponse } from "../types/sportsbook"

const url = (id: number) => `/misli/api/web/v2/sportsbook/event/${id}/single`

export function useEventDetail(id: number) {
  const [detail, setDetail] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setDetail(null)
    fetch(url(id))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<EventDetailResponse>
      })
      .then((j) => { if (alive) setDetail(j.data) })
      .catch((e) => { if (alive) setError(String(e?.message ?? e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  return { detail, loading, error }
}