import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Bet, SavedCoupon } from "../types/coupon"
import { useCutoffTick } from "../hooks/useCutoffTick"
import { BETTING } from "../config/betting"
import { srvRequest } from "../utils/api"
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
  const activeStarts = useMemo(() => active.map((b) => b.startsAt), [active])
  const couponTick = useCutoffTick(activeStarts)

  useEffect(() => {
    const now = Date.now()
    setActive((prev) => {
      const next = prev.filter((b) => b.startsAt - BETTING.cutoffLeadMs > now)
      return next.length === prev.length ? prev : next   // değişiklik yoksa render tetikleme
    })
  }, [couponTick])
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
    if (bet.startsAt - BETTING.cutoffLeadMs <= Date.now()) return  // süresi geçmişse ekleme
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

  const save = useCallback(async () => {
    if (!active.length) return
    const res = await srvRequest<{ id: string }>("placeCoupon", {
      misli,
      bets: active.map((b) => ({ eventId: b.eventId, marketId: b.marketId, on: b.on })),
    })
    setActive([])
    // res.id ile sunucudan kupon listesini tazele (listCoupons)
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