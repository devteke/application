import type { SbEvent, SbMarket, SbOutcome } from "../types/sportsbook"

const DASH = "-"
const TZ = "Europe/Istanbul"
const num = (v?: string) => (v == null ? 0 : parseFloat(v.replace(",", ".")))

export interface MatchRowVM {
  id: number
  start: number
  time: string
  sub: string
  name: string
  live: boolean
  mbs: number | null
  total: number
  ms: [string, string, string]   // 1 / X / 2
  cs: [string, string, string]   // 1-X / 1-2 / X-2
  hcap: string                   // "+1h"
  hms: [string, string, string]  // 1 / X / 2
  auLine: string                 // "2,5"
  auAlt: string
  auUst: string
}

export interface DayGroup { key: string; label: string; rows: MatchRowVM[] }

const outcome = (m: SbMarket | null, on: number): SbOutcome | null =>
  m?.o.find((x) => x.on === on) ?? null

// od <= 1 => kapalı/pasif => "-"
const odd = (o: SbOutcome | null): string =>
  o && o.od > 1 ? o.od.toFixed(2) : DASH

const pick = (list: SbMarket[], t: number, s: number): SbMarket | null =>
  list.find((x) => x.t === t && x.s === s) ?? null

function hcapLabel(ov?: string): string {
  if (ov == null) return ""
  return `${num(ov) > 0 ? "+" : ""}${ov}h`
}

export function buildRow(ev: SbEvent): MatchRowVM {
  const list = ev.m ?? []

  const ms = pick(list, 1, 1)   // Maç Sonucu
  const cs = pick(list, 2, 92)  // Çifte Şans

  // Handikap: birden fazla olabilir -> ana çizgiyi seç (|ov| en küçük, pozitif öncelik)
  const hms =
    list
      .filter((x) => x.t === 2 && x.s === 100)
      .sort((a, b) => Math.abs(num(a.ov)) - Math.abs(num(b.ov)) || num(b.ov) - num(a.ov))[0] ?? null

  // Alt/Üst: 2.5 çizgisini tercih et
  const aus = list.filter((x) => x.t === 2 && x.s === 101)
  const au = aus.find((x) => x.ov === "2.5") ?? aus[0] ?? null

  return {
    id: ev.i,
    start: ev.d,
    time: fmtTime(ev.d),
    sub: ev.ct ?? DASH,               // şimdilik ülke kodu (lig kısa adı left-menu ile bağlanacak)
    name: ev.n,
    live: !!ev.l,
    mbs: ev.mbs ?? null,
    total: ev.t ?? 0,
    ms: [odd(outcome(ms, 1)), odd(outcome(ms, 2)), odd(outcome(ms, 3))],   // on2 = "0" = X
    cs: [odd(outcome(cs, 1)), odd(outcome(cs, 2)), odd(outcome(cs, 3))],
    hcap: hms ? hcapLabel(hms.ov) : "",
    hms: [odd(outcome(hms, 1)), odd(outcome(hms, 2)), odd(outcome(hms, 3))],
    auLine: au?.ov ? au.ov.replace(".", ",") : "",
    auAlt: odd(outcome(au, 1)),
    auUst: odd(outcome(au, 2)),
  }
}

function ymd(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(ms)
}

function fmtTime(ms: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit",
  }).format(ms)
}

const MONTHS = ["OCA","ŞUB","MAR","NİS","MAY","HAZ","TEM","AĞU","EYL","EKİ","KAS","ARA"]
function dayLabel(key: string): string {
  const now = Date.now()
  if (key === ymd(now)) return "BUGÜN"
  if (key === ymd(now + 86_400_000)) return "YARIN"
  const [, m, d] = key.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

// Tarihe göre sırala + güne göre grupla
export function buildGroups(events: SbEvent[]): DayGroup[] {
  const rows = events.map(buildRow).sort((a, b) => a.start - b.start)
  const map = new Map<string, MatchRowVM[]>()
  for (const r of rows) {
    const k = ymd(r.start)
    const arr = map.get(k)
    if (arr) arr.push(r)
    else map.set(k, [r])
  }
  return [...map].map(([key, rows]) => ({ key, label: dayLabel(key), rows }))
}