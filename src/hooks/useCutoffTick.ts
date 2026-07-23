import { useEffect, useState } from "react"
import { BETTING } from "../config/betting"

/**
 * Verilen başlama zamanlarından en yakın (start - lead) anına TEK bir timer kurar.
 * O ana gelince tick'i artırır ve bir sonraki kesime yeniden kurar.
 * Boşta hiç iş yapmaz (polling yok).
 */
export function useCutoffTick(startTimes: number[], leadMs = BETTING.cutoffLeadMs): number {
  const [tick, setTick] = useState(0)

  // İçeriğe göre stabil imza: her render'da yeniden kurulmayı önler
  const sig = startTimes.length
    ? `${startTimes.length}:${Math.min(...startTimes)}:${Math.max(...startTimes)}`
    : ""

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      const now = Date.now()
      let next = Infinity
      for (const t of startTimes) {
        const c = t - leadMs
        if (c > now && c < next) next = c
      }
      if (next === Infinity) return                 // bekleyen kesim yok
      const delay = Math.min(next - now + 250, 0x7fffffff) // +250ms tampon
      timer = setTimeout(() => {
        setTick((n) => n + 1)
        schedule()                                  // sonraki kesime kur
      }, delay)
    }
    schedule()
    return () => { if (timer) clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, leadMs])

  return tick
}