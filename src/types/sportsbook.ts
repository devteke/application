export interface SbOutcome {
  on: number      // seçim no (1,2,3)
  n: string       // etiket ("1","0","2","Alt","Üst"...)
  od: number      // güncel oran (od<=1 => kapalı)
  lodd?: number
  ro: number
}

export interface SbMarket {
  i: number
  v: number
  st: string
  t: number       // tip
  s: number       // alttip
  min: number
  sbt: number
  ov?: string     // baraj/handikap ("2.5","1","-1"...)
  n: string
  o: SbOutcome[]
}

export interface SbEvent {
  i: number
  d: number       // başlangıç (epoch ms)
  s: string
  st: string      // spor (SOCCER)
  n: string       // "Ev - Deplasman"
  p: { i: number; n: string }[] | null
  cp: number      // lig id
  ct: string | null // ülke kodu (INT, US...)
  t: number       // toplam oran sayısı ("+t" rozeti)
  mbs: number | null
  l: boolean      // canlı
  m: SbMarket[] | null
}

export interface EventsResponse {
  success: boolean
  data: {
    v: number
    d: boolean
    h: Record<string, unknown>
    e: SbEvent[]
  }
}