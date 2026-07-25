import { useEffect, useMemo, useState } from "react"
import { fetchMatchStat } from "../services/statistics"
import type { MatchStat } from "../types/statistics"

export function useMatchStats(targets: Array<{ id: number; sportType: string }>) {
  const uniq = useMemo(() => {
    const m = new Map<number, string>()
    for (const t of targets) if (t.id && !m.has(t.id)) m.set(t.id, t.sportType)
    return [...m.entries()] // [id, sportType][]
  }, [targets])

  const sig = uniq.map(([id]) => id).sort((a, b) => a - b).join(",")

  const [stats, setStats] = useState<Map<number, MatchStat>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uniq.length) { setStats(new Map()); return }
    let alive = true
    setLoading(true)
    Promise.allSettled(uniq.map(([id, st]) => fetchMatchStat(id, st)))
      .then((rs) => {
        if (!alive) return
        const m = new Map<number, MatchStat>()
        rs.forEach((r, i) => {
          const [id] = uniq[i]
          if (r.status === "fulfilled" && r.value?.success && r.value.data) m.set(id, r.value.data)
        })
        setStats(m)
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  return { stats, loading }
}