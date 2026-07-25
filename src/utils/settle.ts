import type { Bet, SavedCoupon } from "../types/coupon"
import type { MatchStat } from "../types/statistics"

export type BetResult = "won" | "lost" | "void" | "pending"
export type CouponResult = "won" | "lost" | "pending"

const SBT = { MS: 1, CS: 92, HANDICAP: 100, ALT_UST: 101 } as const

/** Nihai gol sayısı: c (fallback r). */
export const goalsOf = (t?: MatchStat["ht"] | null): number | null => {
  if (!t?.s) return null
  const g = t.s.c ?? t.s.r
  return Number.isFinite(g) ? g : null
}

function outcome1x2(home: number, away: number): "1" | "X" | "2" {
  if (home > away) return "1"
  if (home < away) return "2"
  return "X"
}

/** Tek bahsi maç sonucuna göre değerlendirir. */
export function settleBet(bet: Bet, stat: MatchStat | undefined): BetResult {
  if (!stat) return "pending"
  const s = String(stat.s).toUpperCase()
  if (s === "CANCELLED" || s === "POSTPONED") return "void" // iade
  if (s !== "ENDED") return "pending"                       // sadece biten maç

  const home = goalsOf(stat.ht)
  const away = goalsOf(stat.at)
  if (home == null || away == null) return "pending"

  switch (bet.sbt) {
    case SBT.MS:
      return outcome1x2(home, away) === bet.pick ? "won" : "lost"

    case SBT.CS: {
      const r = outcome1x2(home, away)
      const win: Record<string, Array<"1" | "X" | "2">> = {
        "1-X": ["1", "X"], "1-2": ["1", "2"], "X-2": ["X", "2"],
      }
      return (win[bet.pick] ?? []).includes(r) ? "won" : "lost"
    }

    case SBT.HANDICAP: {
      // handikap ev sahibine uygulanır (misli ov = ev sahibi handikabı)
      const r = outcome1x2(home + (bet.ov ?? 0), away)
      return r === bet.pick ? "won" : "lost"
    }

    case SBT.ALT_UST: {
      const line = bet.ov ?? 0
      const total = home + away
      if (total === line) return "void"                 // tam baraj => iade
      const isUst = bet.pick.toLocaleLowerCase("tr").startsWith("ü")
      return (total > line) === isUst ? "won" : "lost"
    }

    default:
      return "pending"
  }
}

export function settleCoupon(results: BetResult[]): CouponResult {
  if (!results.length) return "pending"
  if (results.some((r) => r === "lost")) return "lost"
  if (results.some((r) => r === "pending")) return "pending"
  return "won" // hepsi won/void
}

export interface CouponSummary {
  result: CouponResult
  perBet: BetResult[]
  wonCount: number
  lostCount: number
  pendingCount: number
  voidCount: number
  settledOdd: number  // void => 1.00
  payout: number      // sadece result==="won" ise bedel*settledOdd
}

export function couponSummary(
  coupon: SavedCoupon,
  statFor: (statId: number) => MatchStat | undefined,
): CouponSummary {
  const perBet = coupon.bets.map((b) => settleBet(b, statFor(b.statId ?? b.eventId)))
  const result = settleCoupon(perBet)
  const settledOdd = coupon.bets.reduce((acc, b, i) => {
    const r = perBet[i]
    if (r === "void") return acc            // iade => oran 1.00
    if (r === "lost") return acc            // zaten kupon kaybeder
    return acc * b.odd                      // won / pending => oranı çarp
  }, 1)
  return {
    result, perBet,
    wonCount: perBet.filter((r) => r === "won").length,
    lostCount: perBet.filter((r) => r === "lost").length,
    pendingCount: perBet.filter((r) => r === "pending").length,
    voidCount: perBet.filter((r) => r === "void").length,
    settledOdd,
    payout: result === "won" ? coupon.bedel * settledOdd : 0,
  }
}