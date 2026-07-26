import { useEffect, useState } from "react"
import { apiGet } from "../utils/api"
import type { EventDetail, EventDetailResponse } from "../types/sportsbook"
import { useToast } from "../context/ToastContext"
import { errorMessage } from "../utils/errors"

const path = (id: number) => `/api/web/v2/sportsbook/event/${id}/single`

export function useEventDetail(id: number) {
  const { notify } = useToast()
  const [detail, setDetail] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let alive = true
    setLoading(true); setError(null); setDetail(null)
    apiGet<EventDetailResponse>(path(id))
      .then((j) => { if (alive) setDetail(j.data) })
      .catch((e) => {
        if (!alive) return
        setError(String(e?.message ?? e))
        notify(errorMessage(e), "error")
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  useEffect(() => {
    let alive = true

    setLoading(true)
    setError(null)
    setDetail(null)

    apiGet<EventDetailResponse>(path(id))
      .then((j) => {
        if (alive) setDetail(j.data)
      })
      .catch((e) => {
        if (alive) setError(String(e?.message ?? e))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [id])

  return { detail, loading, error }
}