export type BetResult = "won" | "lost" | "void" | "pending"
export type CouponResult = "won" | "lost" | "void" | "pending"
export type BetMode = "combi" | "system"

export interface Bet {
  eventId: number
  eventName: string
  marketId: number
  marketName: string
  on: number
  pick: string
  odd: number
  startsAt: number
  sbt: number
  ov: number | null
  statId: number
  sportType: string
  banko?: boolean      // sistem kuponunda banko mu (her kombinasyonda)
  mbs?: number | null
  result?: BetResult
}

export interface SavedCoupon {
  id: string
  bets: Bet[]
  misli: number
  totalOdd: number
  bedel: number
  maxWin: number
  createdAt: number

  status: CouponResult
  payout: number

  betType?: BetMode    // 'combi' | 'system'
  sizes?: number[]     // sistem boyutları (k)
  combos?: number      // kombinasyon sayısı
}