export type LbPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'
export type LbKind = 'net' | 'winners' | 'losers' | 'points'

export interface LbRow {
  rank: number
  name: string
  value: number
  wonCount?: number
  me?: boolean
}

export interface LbBoard {
  rows: LbRow[]
  self?: LbRow | null
}

export interface LbProfile {
  name: string | null
}