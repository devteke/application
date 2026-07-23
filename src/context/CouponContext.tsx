import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Bet, SavedCoupon } from "../types/coupon"

const UNIT = 1 // 1 misli = 1 TL

interface CouponCtx {
  active: Bet[]
  misli: number
  saved: SavedCoupon[]
  totalOdd: number
  bedel: number
  maxWin: number
  isPicked: (eventId: number, marketId: number, on: number) => boolean
  pick: (bet: Bet) => void
  remove: (eventId: number) => void
  clear: () => void
  setMisli: (n: number) => void
  save: () => void
  removeSaved: (id: string) => void
}

const Ctx = createContext<CouponCtx | null>(null)

export function CouponProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Bet[]>([])
  const [misli, setMisliState] = useState(1)
  const [saved, setSaved] = useState<SavedCoupon[]>([])

  const totalOdd = useMemo(
    () => active.reduce((acc, b) => acc * b.odd, 1),
    [active],
  )

  const bedel = misli * UNIT
  const maxWin = active.length ? bedel * totalOdd : 0

  const isPicked = useCallback(
    (eventId: number, marketId: number, on: number) =>
      active.some(
        (b) =>
          b.eventId === eventId &&
          b.marketId === marketId &&
          b.on === on,
      ),
    [active],
  )

  const pick = useCallback((bet: Bet) => {
    setActive((prev) => {
      const same = prev.find(
        (b) =>
          b.eventId === bet.eventId &&
          b.marketId === bet.marketId &&
          b.on === bet.on,
      )

      // Aynı seçime tekrar tıklama => kaldır
      if (same) return prev.filter((b) => b.eventId !== bet.eventId)

      // Maç başına tek bahis => eskisini sil, yeniyi en üste ekle
      return [bet, ...prev.filter((b) => b.eventId !== bet.eventId)]
    })
  }, [])

  const remove = useCallback((eventId: number) => {
    setActive((prev) => prev.filter((b) => b.eventId !== eventId))
  }, [])

  const clear = useCallback(() => {
    setActive([])
  }, [])

  const setMisli = useCallback((n: number) => {
    setMisliState(Number.isFinite(n) && n > 0 ? Math.floor(n) : 1)
  }, [])

  const save = useCallback(() => {
    if (!active.length) return

    const odd = active.reduce((a, b) => a * b.odd, 1)
    const b = misli * UNIT

    const coupon: SavedCoupon = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bets: active,
      misli,
      totalOdd: odd,
      bedel: b,
      maxWin: b * odd,
      createdAt: Date.now(),
    }

    setSaved((s) => [coupon, ...s])
    setActive([])
  }, [active, misli])

  const removeSaved = useCallback((id: string) => {
    setSaved((s) => s.filter((c) => c.id !== id))
  }, [])

  const value = useMemo<CouponCtx>(
    () => ({
      active,
      misli,
      saved,
      totalOdd,
      bedel,
      maxWin,
      isPicked,
      pick,
      remove,
      clear,
      setMisli,
      save,
      removeSaved,
    }),
    [
      active,
      misli,
      saved,
      totalOdd,
      bedel,
      maxWin,
      isPicked,
      pick,
      remove,
      clear,
      setMisli,
      save,
      removeSaved,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCoupon() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useCoupon, CouponProvider içinde kullanılmalı")
  return c
}