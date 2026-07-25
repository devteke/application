import { useEffect, useState } from "react"
import type { EventsResponse } from "../types/sportsbook"
import { apiGet } from "../utils/api"

const PATH = "/api/web/v1/sportsbook/event/0?sportType=SOCCER&betType=PRE_EVENT"

export function useEvents() {
  const [data, setData] = useState<EventsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    apiGet<EventsResponse>(PATH)
      .then((json) => { if (alive) { setData(json); setError(null) } })
      .catch((e) => { if (alive) setError(String(e?.message ?? e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return { data, loading, error }
}