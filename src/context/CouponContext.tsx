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
  save: () => Promise<void>
  removeSaved: (id: string) => Promise<void>
  refreshSaved: () => Promise<void>
}

const Ctx = createContext<CouponCtx | null>(null)

// --- Sunucudan gelen kupon şekli (server/coupons.lua Coupons.list ile birebir) ---
type ServerBet = {
  eventId: number
  statId: number
  name: string
  startsAt: number
  marketId: number
  marketName: string
  sbt: number
  ov: number | null
  on: number
  pick: string
  odd: number
  sportType: string
  result?: Bet["result"]
}
type ServerCoupon = {
  id: string
  misli: number
  bedel: number
  totalOdd: number
  maxWin: number
  status: SavedCoupon["status"]
  payout: number
  createdAt: number
  bets: ServerBet[]
}

const toBet = (b: ServerBet): Bet => ({
  eventId: b.eventId,
  eventName: b.name,
  marketId: b.marketId,
  marketName: b.marketName,
  on: b.on,
  pick: b.pick,
  odd: b.odd,
  startsAt: b.startsAt,
  sbt: b.sbt,
  ov: b.ov,
  statId: b.statId,
  sportType: b.sportType,
  result: b.result,
})

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
      return next.length === prev.length ? prev : next // değişiklik yoksa render tetikleme
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
    if (bet.startsAt - BETTING.cutoffLeadMs <= Date.now()) return // süresi geçmişse ekleme
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

  // Kayıtlı kuponları sunucudan çek (tek otorite server)
  const refreshSaved = useCallback(async () => {
    try {
      const list = await srvRequest<ServerCoupon[]>("listCoupons")
      if (!Array.isArray(list)) return
      setSaved(
        list.map((c) => ({
          id: c.id,
          misli: c.misli,
          bedel: c.bedel,
          totalOdd: c.totalOdd,
          maxWin: c.maxWin,
          createdAt: c.createdAt,
          status: c.status,
          payout: c.payout,
          bets: c.bets.map(toBet),
        })),
      )
    } catch {
      /* dev/browser: sunucu yok, yoksay */
    }
  }, [])

  // Açılışta bir kez yükle
  useEffect(() => {
    refreshSaved()
  }, [refreshSaved])

  // Kaydet (server otoriter) + listeyi tazele
  const save = useCallback(async () => {
    if (!active.length) return
    await srvRequest("placeCoupon", {
      misli,
      bets: active.map((b) => ({
        eventId: b.eventId,
        marketId: b.marketId,
        on: b.on,
      })),
    })
    setActive([])
    await refreshSaved()
  }, [active, misli, refreshSaved])

// Sunucu-otoriter kalıcı silme (soft-delete). İyimser kaldır, hata olursa geri getir.
const removeSaved = useCallback(async (id: string) => {
  const prev = saved
  setSaved((s) => s.filter((c) => c.id !== id)) // iyimser UI
  try {
    await srvRequest("deleteCoupon", { id })
    await refreshSaved()
  } catch {
    setSaved(prev) // başarısız (ör. pending/başkasının) => geri getir
  }
}, [saved, refreshSaved])

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
      refreshSaved,
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
      refreshSaved,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCoupon() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useCoupon, CouponProvider içinde kullanılmalı")
  return c
}