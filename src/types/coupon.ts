export interface Bet {
  eventId: number
  eventName: string
  marketId: number
  marketName: string
  on: number
  pick: string   // gösterilecek seçim etiketi: "1","X","2","1-X","Alt"...
  odd: number
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