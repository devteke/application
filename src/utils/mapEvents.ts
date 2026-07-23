import type { SbEvent, SbMarket } from "../types/sportsbook"
import type { Bet } from "../types/coupon"

export const DASH = "-"
const TZ = "Europe/Istanbul"
const MONTHS = ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"]

export interface Cell {
  txt: string
  bet: Bet | null
}

export interface MatchRowVM {
  id: number
  time: string
  leagueCode: string
  dayShort: string
  name: string
  live: boolean
  mbs: number | null
  total: number
  ms: Cell[]
  cs: Cell[]
  hcap: string
  hms: Cell[]
  auLine: string
  auAlt: Cell
  auUst: Cell
}

export interface DayGroup {
  key: string
  label: string
  rows: MatchRowVM[]
}

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

const nameOf = (ev: SbEvent) =>
  ev.n?.trim() || (ev.p ?? []).map((x) => x.n).join(" - ")

const findMkt = (ev: SbEvent, sbt: number) =>
  (ev.m ?? []).filter((m): m is SbMarket => !!m && m.sbt === sbt)

const hcapLabel = (ov: unknown) => {
  const n = num(ov)
  const s = String(ov).replace(".", ",")
  return n > 0 ? `+${s}` : s
}

// Modül seviyesinde TEK sefer kurulan formatter'lar (satır başına kurulum yok)
const IST_DTF = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
})
const IST_WEEKDAY_DTF = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" })

function istParts(ms: number) {
  const parts = IST_DTF.formatToParts(new Date(ms))
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  return { y: +g("year"), mo: +g("month"), da: +g("day"), hh: g("hour"), mm: g("minute") }
}

const WEEKDAY_TR: Record<string, string> = {
  Sun: "Paz", Mon: "Pzt", Tue: "Sal", Wed: "Çar", Thu: "Per", Fri: "Cum", Sat: "Cmt",
}
function istWeekday(ms: number): string {
  const wd = IST_WEEKDAY_DTF.format(new Date(ms))
  return WEEKDAY_TR[wd] ?? wd
}

// Bugün/yarın anahtarlarını günde 1 kez hesapla (her event'te tekrar etme)
let _ttCache: { day: number; today: string; tomorrow: string } | null = null
function getTT() {
  const dayNo = Math.floor(Date.now() / 86400000)
  if (!_ttCache || _ttCache.day !== dayNo) {
    _ttCache = {
      day: dayNo,
      today: dayKey(istParts(Date.now())),
      tomorrow: dayKey(istParts(Date.now() + 86400000)),
    }
  }
  return _ttCache
}

const dayKey = (p: { y: number; mo: number; da: number }) =>
  `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.da).padStart(2, "0")}`

export function dayInfo(ms: number) {
  const p = istParts(ms)
  const key = dayKey(p)
  const { today, tomorrow } = getTT()
  const label = key === today ? "BUGÜN" : key === tomorrow ? "YARIN" : `${p.da} ${MONTHS[p.mo - 1]}`
  return { key, label }
}

function cellFor(ev: SbEvent, mkt: SbMarket | undefined, on: number, pick: string): Cell {
  const o = mkt?.o.find((x) => x.on === on)
  if (!mkt || !o || o.od <= 1) return { txt: DASH, bet: null }
  return {
    txt: o.od.toFixed(2),
    bet: { eventId: ev.i, eventName: nameOf(ev), marketId: mkt.i, marketName: mkt.n, on, pick, odd: o.od },
  }
}

function altUstCell(ev: SbEvent, mkt: SbMarket | undefined, which: "Alt" | "Üst"): Cell {
  const key = which.toLocaleLowerCase("tr")
  const o = mkt?.o.find((x) => (x.n ?? "").toLocaleLowerCase("tr").startsWith(key))
  if (!mkt || !o || o.od <= 1) return { txt: DASH, bet: null }
  return {
    txt: o.od.toFixed(2),
    bet: { eventId: ev.i, eventName: nameOf(ev), marketId: mkt.i, marketName: mkt.n, on: o.on, pick: which, odd: o.od },
  }
}

function buildRow(ev: SbEvent, leagueMap?: LeagueMap): MatchRowVM {
  const p = istParts(ev.d)
  const ms = findMkt(ev, 1)[0]
  const cs = findMkt(ev, 92)[0]
  const hcaps = findMkt(ev, 100)
  const hcap = [...hcaps].sort(
    (a, b) => Math.abs(num(a.ov)) - Math.abs(num(b.ov)) || num(b.ov) - num(a.ov),
  )[0]
  const aus = findMkt(ev, 101)
  const au = aus.find((m) => num(m.ov) === 2.5) ?? [...aus].sort((a, b) => num(a.ov) - num(b.ov))[0]

  return {
    id: ev.i,
    time: `${p.hh}:${p.mm}`,
    leagueCode: leagueMap?.get(ev.cp)?.code || ev.ct || String(ev.cp),
    dayShort: istWeekday(ev.d),
    name: nameOf(ev),
    live: !!ev.l,
    mbs: ev.mbs ?? null,
    total: ev.t ?? 0,
    ms: [cellFor(ev, ms, 1, "1"), cellFor(ev, ms, 2, "X"), cellFor(ev, ms, 3, "2")],
    cs: [cellFor(ev, cs, 1, "1-X"), cellFor(ev, cs, 2, "1-2"), cellFor(ev, cs, 3, "X-2")],
    hcap: hcap ? hcapLabel(hcap.ov) : DASH,
    hms: [cellFor(ev, hcap, 1, "1"), cellFor(ev, hcap, 2, "X"), cellFor(ev, hcap, 3, "2")],
    auLine: au ? String(au.ov).replace(".", ",") : DASH,
    auAlt: altUstCell(ev, au, "Alt"),
    auUst: altUstCell(ev, au, "Üst"),
  }
}

export type SortMode = "date" | "league"

export interface LeagueInfo {
  league: string
  country: string
  code: string
  order: number
}
export type LeagueMap = Map<number, LeagueInfo>

export interface EventFilters {
  singleMatch: boolean
  dateSel: string | null   // dayKey (örn "2026-07-23")
  leagueSel: number | null // cp
  mbsSel: number[]         // çoklu; boşsa filtre yok
}

export function eventDayKey(ms: number): string {
  return dayKey(istParts(ms))
}

export function filterEvents(events: SbEvent[], f: EventFilters): SbEvent[] {
  return events.filter((ev) => {
    if (f.singleMatch && ev.mbs !== 1) return false
    if (f.dateSel && eventDayKey(ev.d) !== f.dateSel) return false
    if (f.leagueSel != null && ev.cp !== f.leagueSel) return false
    if (f.mbsSel.length > 0 && (ev.mbs == null || !f.mbsSel.includes(ev.mbs))) return false
    return true
  })
}

export function buildGroups(
  events: SbEvent[],
  opts: { sort?: SortMode; leagueMap?: LeagueMap } = {},
): DayGroup[] {
  if (opts.sort === "league") return buildLeagueGroups(events, opts.leagueMap)

  const sorted = [...events].sort((a, b) => a.d - b.d)
  const groups: DayGroup[] = []
  const index = new Map<string, DayGroup>()
  for (const ev of sorted) {
    const { key, label } = dayInfo(ev.d)
    let g = index.get(key)
    if (!g) { g = { key, label, rows: [] }; index.set(key, g); groups.push(g) }
    g.rows.push(buildRow(ev, opts.leagueMap))
  }
  return groups
}

function buildLeagueGroups(events: SbEvent[], leagueMap?: LeagueMap): DayGroup[] {
  const sorted = [...events].sort((a, b) => a.d - b.d)
  const index = new Map<number, { g: DayGroup; order: number }>()
  const list: Array<{ g: DayGroup; order: number }> = []
  for (const ev of sorted) {
    let entry = index.get(ev.cp)
    if (!entry) {
      const info = leagueMap?.get(ev.cp)
      const label = info ? `${info.country} · ${info.league}` : `Lig ${ev.cp}`
      entry = { g: { key: String(ev.cp), label, rows: [] }, order: info?.order ?? Number.MAX_SAFE_INTEGER }
      index.set(ev.cp, entry)
      list.push(entry)
    }
    entry.g.rows.push(buildRow(ev, leagueMap))
  }
  return list
    .sort((a, b) => a.order - b.order || a.g.label.localeCompare(b.g.label, "tr"))
    .map((e) => e.g)
}