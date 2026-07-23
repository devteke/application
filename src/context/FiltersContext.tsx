import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { useEvents } from "../hooks/useEvents"
import { useLeagues } from "../hooks/useLeagues"
import { buildGroups, dayInfo, dayOptionLabel, filterEvents, type DayGroup, type OddSort, type OddSortKey, type SortMode } from "../utils/mapEvents"
import type { SbEvent } from "../types/sportsbook"

export interface DateOption { key: string; label: string }
export interface LeagueOption { cp: number; label: string }

interface FiltersCtx {
  // state
  sort: SortMode
  singleMatch: boolean
  dateSel: string | null
  leagueSel: number | null
  mbsSel: number[]
  // setters
  setSort: (m: SortMode) => void
  toggleSingleMatch: () => void
  setDateSel: (k: string | null) => void
  setLeagueSel: (cp: number | null) => void
  toggleMbs: (v: number) => void
  clearAll: () => void
  // veri / türetilmiş
  loading: boolean
  error: string | null
  dateOptions: DateOption[]
  leagueOptions: LeagueOption[]
  mbsOptions: number[]
  groups: DayGroup[]
  search: string
  setSearch: (s: string) => void
  oddSort: OddSort | null
  toggleOddSort: (key: OddSortKey) => void
}

const Ctx = createContext<FiltersCtx | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useEvents()
  const { leagueMap } = useLeagues()
  const [search, setSearch] = useState("")
  const [oddSort, setOddSort] = useState<OddSort | null>(null)
  const [sort, setSort] = useState<SortMode>("date")
  const [singleMatch, setSingleMatch] = useState(false)
  const [dateSel, setDateSel] = useState<string | null>(null)
  const [leagueSel, setLeagueSel] = useState<number | null>(null)
  const [mbsSel, setMbsSel] = useState<number[]>([])

  const events = useMemo<SbEvent[]>(() => data?.data.e ?? [], [data])

  const dateOptions = useMemo<DateOption[]>(() => {
    const m = new Map<string, string>()
    for (const ev of events) {
      const { key } = dayInfo(ev.d)
      if (!m.has(key)) m.set(key, dayOptionLabel(ev.d))
    }
    return [...m.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([key, label]) => ({ key, label }))
  }, [events])



  const leagueOptions = useMemo<LeagueOption[]>(() => {
    const seen = new Map<number, LeagueOption & { order: number }>()
    for (const ev of events) {
      if (seen.has(ev.cp)) continue
      const info = leagueMap.get(ev.cp)
      seen.set(ev.cp, {
        cp: ev.cp,
        label: info ? `${info.country} · ${info.league}` : `Lig ${ev.cp}`,
        order: info?.order ?? Number.MAX_SAFE_INTEGER,
      })
    }
    return [...seen.values()]
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "tr"))
      .map(({ cp, label }) => ({ cp, label }))
  }, [events, leagueMap])

  const mbsOptions = useMemo<number[]>(() => {
    const s = new Set<number>()
    for (const ev of events) if (ev.mbs != null) s.add(ev.mbs)
    return [...s].sort((a, b) => a - b)
  }, [events])

  const groups = useMemo<DayGroup[]>(() => {
    const filtered = filterEvents(events, { singleMatch, dateSel, leagueSel, mbsSel, search })
    return buildGroups(filtered, { sort, leagueMap, oddSort })
  }, [events, singleMatch, dateSel, leagueSel, mbsSel, search, sort, leagueMap, oddSort])

  const toggleMbs = (v: number) =>
    setMbsSel((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
  const toggleOddSort = (key: OddSortKey) =>
    setOddSort((s) =>
      s?.key !== key ? { key, dir: "desc" }
        : s.dir === "desc" ? { key, dir: "asc" }
          : null,
    )

  const clearAll = () => {
    setSort("date"); setSingleMatch(false); setDateSel(null); setLeagueSel(null); setMbsSel([])
    setSearch(""); setOddSort(null)
  }

  const value: FiltersCtx = {
    sort, singleMatch, dateSel, leagueSel, mbsSel,
    setSort, toggleSingleMatch: () => setSingleMatch((v) => !v),
    setDateSel, setLeagueSel, toggleMbs, clearAll,
    loading, error, dateOptions, leagueOptions, mbsOptions, groups,
    search, setSearch, oddSort, toggleOddSort,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFilters() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useFilters, FiltersProvider içinde kullanılmalı")
  return c
}