export interface Bet {
  eventId: number
  eventName: string
  marketId: number
  marketName: string
  on: number
  pick: string   // gösterilecek seçim etiketi: "1","X","2","1-X","Alt"...
  odd: number
  startsAt: number   // event başlama zamanı (ev.d, epoch ms) — kesim için
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