export type MatchStatus =
  | "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED" | "POSTPONED" | (string & {})

export interface MatchTeam {
  i: number
  n: string
  sn?: string
  s?: { r: number; c: number } | null // skor: c = nihai (fallback r)
  broi?: number
}

export interface MatchStat {
  i: number
  sgi: number
  n: string          // "Ev - Deplasman"
  d: number
  s: MatchStatus     // "ENDED" => sonuçlanabilir
  st: string         // "SOCCER"
  min?: number
  ht: MatchTeam      // ev sahibi (home)
  at: MatchTeam      // deplasman (away)
  li?: number
}

export interface MatchStatResponse {
  success: boolean
  data: MatchStat
}