import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Bet, BetMode, SavedCoupon } from "../types/coupon"
import { useCutoffTick } from "../hooks/useCutoffTick"
import { BETTING } from "../config/betting"
import { srvRequest } from "../utils/api"

const UNIT = 1 // 1 misli = 1 TL

// --- kombinatorik yardımcıları (server ile birebir) ---
function esp(odds: number[]): number[] {
  const e = [1]
  for (let j = 1; j <= odds.length; j++) e[j] = 0
  for (const x of odds) for (let j = odds.length; j >= 1; j--) e[j] += e[j - 1] * x
  return e
}
function nCk(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  k = Math.min(k, n - k)
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}

interface CouponCtx {
  active: Bet[]
  misli: number
  saved: SavedCoupon[]
  totalOdd: number
  bedel: number
  maxWin: number
  // mod / sistem
  mode: BetMode
  setMode: (m: BetMode) => void
  isBanko: (eventId: number) => boolean
  toggleBanko: (eventId: number) => void
  sizes: number[]
  toggleSize: (k: number) => void
  nonBankoCount: number
  combos: number
  // aksiyonlar
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
  banko?: boolean
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
  betType?: BetMode
  sizes?: number[]
  combos?: number
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
  banko: b.banko,
  result: b.result,
})

export function CouponProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Bet[]>([])
  const [misli, setMisliState] = useState(1)
  const [saved, setSaved] = useState<SavedCoupon[]>([])
  const [mode, setMode] = useState<BetMode>("combi")
  const [bankoIds, setBankoIds] = useState<number[]>([])
  const [sizes, setSizes] = useState<number[]>([])

  const activeStarts = useMemo(() => active.map((b) => b.startsAt), [active])
  const couponTick = useCutoffTick(activeStarts)

  // Kesim: süresi gelen bahsi kupondan düşür
  useEffect(() => {
    const now = Date.now()
    setActive((prev) => {
      const next = prev.filter((b) => b.startsAt - BETTING.cutoffLeadMs > now)
      return next.length === prev.length ? prev : next
    })
  }, [couponTick])

  // active değişince artık kuponda olmayan banko id'lerini temizle
  useEffect(() => {
    setBankoIds((prev) => {
      const ids = new Set(active.map((b) => b.eventId))
      const next = prev.filter((id) => ids.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [active])

  const bankoSet = useMemo(() => new Set(bankoIds), [bankoIds])
  const nonBanko = useMemo(() => active.filter((b) => !bankoSet.has(b.eventId)), [active, bankoSet])
  const nonBankoCount = nonBanko.length

  const validSizes = useMemo(
    () => sizes.filter((k) => k >= 1 && k <= nonBankoCount),
    [sizes, nonBankoCount],
  )

  const totalOdd = useMemo(() => active.reduce((acc, b) => acc * b.odd, 1), [active])

  const combos = useMemo(() => {
    if (mode !== "system") return 1
    return validSizes.reduce((acc, k) => acc + nCk(nonBankoCount, k), 0)
  }, [mode, validSizes, nonBankoCount])

  const bedel = (mode === "system" ? combos : 1) * misli * UNIT

  const maxWin = useMemo(() => {
    if (!active.length) return 0
    if (mode !== "system") return misli * UNIT * totalOdd
    if (combos < 1) return 0
    const bankoProd = active
      .filter((b) => bankoSet.has(b.eventId))
      .reduce((a, b) => a * b.odd, 1)
    const e = esp(nonBanko.map((b) => b.odd))
    const sum = validSizes.reduce((acc, k) => acc + (e[k] ?? 0), 0)
    return misli * UNIT * bankoProd * sum
  }, [active, mode, misli, totalOdd, combos, bankoSet, nonBanko, validSizes])

  const isPicked = useCallback(
    (eventId: number, marketId: number, on: number) =>
      active.some((b) => b.eventId === eventId && b.marketId === marketId && b.on === on),
    [active],
  )

  const pick = useCallback((bet: Bet) => {
    if (bet.startsAt - BETTING.cutoffLeadMs <= Date.now()) return
    setActive((prev) => {
      const same = prev.find(
        (b) => b.eventId === bet.eventId && b.marketId === bet.marketId && b.on === bet.on,
      )
      if (same) return prev.filter((b) => b.eventId !== bet.eventId)
      return [bet, ...prev.filter((b) => b.eventId !== bet.eventId)]
    })
  }, [])

  const remove = useCallback((eventId: number) => {
    setActive((prev) => prev.filter((b) => b.eventId !== eventId))
  }, [])

  const clear = useCallback(() => {
    setActive([]); setBankoIds([]); setSizes([]); setMode("combi")
  }, [])

  const setMisli = useCallback((n: number) => {
    const v = Number.isFinite(n) ? Math.floor(n) : 1
    setMisliState(Math.min(Math.max(v, 1), BETTING.maxMisli))
  }, [])

  const isBanko = useCallback((eventId: number) => bankoSet.has(eventId), [bankoSet])

  const toggleBanko = useCallback((eventId: number) => {
    setBankoIds((prev) =>
      prev.includes(eventId) ? prev.filter((x) => x !== eventId) : [...prev, eventId],
    )
  }, [])

  const toggleSize = useCallback((k: number) => {
    setSizes((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k].sort((a, b) => a - b),
    )
  }, [])

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
          betType: c.betType,
          sizes: c.sizes,
          combos: c.combos,
          bets: c.bets.map(toBet),
        })),
      )
    } catch {
      /* dev/browser: sunucu yok */
    }
  }, [])

  useEffect(() => { refreshSaved() }, [refreshSaved])

  const save = useCallback(async () => {
    if (!active.length) return
    const isSystem = mode === "system"
    if (isSystem && (nonBankoCount < 2 || validSizes.length === 0)) return
    await srvRequest("placeCoupon", {
      type: isSystem ? "system" : "combi",
      misli,
      sizes: isSystem ? validSizes : undefined,
      bets: active.map((b) => ({
        eventId: b.eventId,
        marketId: b.marketId,
        on: b.on,
        banko: isSystem ? bankoSet.has(b.eventId) : undefined,
      })),
    })
    setActive([]); setBankoIds([]); setSizes([]); setMode("combi")
    await refreshSaved()
  }, [active, mode, misli, validSizes, nonBankoCount, bankoSet, refreshSaved])

  const removeSaved = useCallback(async (id: string) => {
    const prev = saved
    setSaved((s) => s.filter((c) => c.id !== id))
    try {
      await srvRequest("deleteCoupon", { id })
      await refreshSaved()
    } catch {
      setSaved(prev)
    }
  }, [saved, refreshSaved])

  const value = useMemo<CouponCtx>(
    () => ({
      active, misli, saved, totalOdd, bedel, maxWin,
      mode, setMode, isBanko, toggleBanko, sizes, toggleSize, nonBankoCount, combos,
      isPicked, pick, remove, clear, setMisli, save, removeSaved, refreshSaved,
    }),
    [
      active, misli, saved, totalOdd, bedel, maxWin,
      mode, isBanko, toggleBanko, sizes, toggleSize, nonBankoCount, combos,
      isPicked, pick, remove, clear, setMisli, save, removeSaved, refreshSaved,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCoupon() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useCoupon, CouponProvider içinde kullanılmalı")
  return c
}