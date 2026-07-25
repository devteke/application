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
  statId: number       // statistics fetch id (ev.sgi ?? ev.i)
  sportType: string    // "SOCCER"
}

export interface SavedCoupon {
  id: string
  bets: Bet[]
  misli: number
  totalOdd: number
  bedel: number
  maxWin: number
  createdAt: number
}