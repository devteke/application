export type BetResult = "won" | "lost" | "void" | "pending"
export type CouponResult = "won" | "lost" | "void" | "pending"

export interface Bet {
  eventId: number
  eventName: string
  marketId: number
  marketName: string
  on: number
  pick: string
  odd: number
  startsAt: number

  sbt: number          // market kategorisi: 1=MS, 92=ÇŞ, 100=Handikap, 101=Alt/Üst
  ov: number | null    // baraj/handikap (100/101 için), yoksa null
  statId: number       // statistics fetch id (ev.li ?? ev.i)
  sportType: string    // "SOCCER"

  result?: BetResult   // settlement sonrası sunucudan gelen maç bazlı sonuç
}

export interface SavedCoupon {
  id: string
  bets: Bet[]
  misli: number
  totalOdd: number
  bedel: number
  maxWin: number
  createdAt: number

  status: CouponResult // sunucu otoritesi (kazandı/kaybetti/bekliyor/iade)
  payout: number       // sunucu otoritesi (ödenen tutar)
}