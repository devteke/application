import { useEffect, useMemo, useRef, useState } from "react"
import {
  fetchSummaries, fetchStanding, fetchHeadToHead, fetchPerformance,
  fetchMissingPlayers, fetchLineups, fetchSquadStats,
} from "../services/matchStats"
import type {
  SummariesData, StandingData, HeadToHeadData, PerformanceData,
  MissingPlayersData, LineupsData, SquadData,
  H2HMatch, LastMatch, PerfMatch, MissingPlayer, UnderOverMarket,
  StandingSideRow, SquadEntry, LineupTeam,
} from "../services/matchStats"
import "./StatsModal.css"

type TabKey = "genel" | "standing" | "h2h" | "perf" | "missing" | "lineup" | "squad"
const TABS: { key: TabKey; label: string }[] = [
  { key: "genel", label: "Genel" },
  { key: "standing", label: "Puan Durumu" },
  { key: "h2h", label: "Aralarındaki Maçlar" },
  { key: "perf", label: "Son Maçlar" },
  { key: "missing", label: "Sakat / Cezalı" },
  { key: "lineup", label: "İlk 11" },
  { key: "squad", label: "Kadro" },
]
const loaders: Record<TabKey, (id: number) => Promise<unknown>> = {
  genel: fetchSummaries, standing: fetchStanding, h2h: fetchHeadToHead,
  perf: fetchPerformance, missing: fetchMissingPlayers, lineup: fetchLineups, squad: fetchSquadStats,
}

/* ---------- helpers ---------- */
const DTF = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "Europe/Istanbul" })
const fmtDate = (ms: number) => DTF.format(new Date(ms))
const errText = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e ?? "")
  if (m === "timeout") return "İstek zaman aşımına uğradı."
  if (m === "rate_limited") return "Çok fazla istek. Biraz bekleyin."
  if (m === "forbidden_path" || m === "http_error") return "Veri alınamadı."
  return "Veri alınamadı."
}
type WDL = "W" | "D" | "L" | null
const wdl = (my?: number | null, opp?: number | null): WDL =>
  my == null || opp == null ? null : my > opp ? "W" : my < opp ? "L" : "D"
const FormChip = ({ r }: { r: WDL }) =>
  !r ? null : <span className={`fchip fchip--${r.toLowerCase()}`}>{r === "W" ? "G" : r === "D" ? "B" : "M"}</span>

/** listedeki tüm maçlarda ortak olan takım id'si (takip edilen takım) */
function commonTeamId(list: { a: number; b: number }[]): number | null {
  if (!list.length) return null
  let set = new Set([list[0].a, list[0].b])
  for (const m of list) { const ids = new Set([m.a, m.b]); set = new Set([...set].filter((x) => ids.has(x))) }
  return [...set][0] ?? null
}

type TabState = { loading: boolean; data?: unknown; error?: string }

export default function StatsModal({ matchId, title, onClose }: { matchId: number; title: string; onClose: () => void }) {
  const [active, setActive] = useState<TabKey>("genel")
  const [cache, setCache] = useState<Partial<Record<TabKey, TabState>>>({})
  const [tick, setTick] = useState(0)
  const loadedRef = useRef<Set<string>>(new Set())

  const [homeName, awayName] = useMemo(() => {
    const i = title.indexOf(" - ")
    return i > 0 ? [title.slice(0, i), title.slice(i + 3)] : [title, ""]
  }, [title])

  useEffect(() => {
    const key = `${matchId}:${active}:${tick}`
    if (loadedRef.current.has(key)) return
    loadedRef.current.add(key)
    let alive = true
    setCache((c) => ({ ...c, [active]: { loading: true } }))
    loaders[active](matchId)
      .then((d) => alive && setCache((c) => ({ ...c, [active]: { loading: false, data: d } })))
      .catch((e) => alive && setCache((c) => ({ ...c, [active]: { loading: false, error: errText(e) } })))
    return () => { alive = false }
  }, [active, matchId, tick])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [onClose])

  const st = cache[active]

  return (
    <div className="stx__overlay" onClick={onClose}>
      <div className="stx" onClick={(e) => e.stopPropagation()}>
        <div className="stx__head">
          <span className="stx__title">{title}</span>
          <button className="stx__close" onClick={onClose}>×</button>
        </div>

        <div className="stx__tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`stx__tab${active === t.key ? " is-active" : ""}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="stx__body">
          {st?.loading && <div className="stx__state">Yükleniyor…</div>}
          {st?.error && (
            <div className="stx__state stx__state--err">
              {st.error}
              <button className="stx__retry" onClick={() => setTick((n) => n + 1)}>Tekrar dene</button>
            </div>
          )}
          {!st?.loading && !st?.error && st?.data != null && (
            <>
              {active === "genel" && <GenelView d={st.data as SummariesData} />}
              {active === "standing" && <StandingView d={st.data as StandingData} />}
              {active === "h2h" && <H2HView d={st.data as HeadToHeadData} home={homeName} away={awayName} />}
              {active === "perf" && <PerfView d={st.data as PerformanceData} home={homeName} away={awayName} />}
              {active === "missing" && <MissingView d={st.data as MissingPlayersData} home={homeName} away={awayName} />}
              {active === "lineup" && <LineupView d={st.data as LineupsData} />}
              {active === "squad" && <SquadView d={st.data as SquadData} home={homeName} away={awayName} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================ GENEL ============================ */
function GenelView({ d }: { d: SummariesData }) {
  const h2h = d.HEAD_TO_HEAD?.headToHead ?? []
  const last = d.LAST_MATCHES?.lastMatches
  const miss = d.MISSING_PLAYERS?.missingPlayers
  const ref = d.REFEREE_TEAM
  const standing = d.STANDING?.standings?.[0]
  const ou = d.UNDER_OVER?.underOver

  return (
    <div className="stx__stack">
      <Card title="Aralarındaki Maçlar">
        {h2h.length ? h2h.map((m, i) => <H2HLine key={i} m={m} />) : <Empty />}
      </Card>

      <Card title="Son Maçlar (Form)">
        <div className="stx__two">
          <MiniForm title="Ev Sahibi" list={last?.HOME ?? []} />
          <MiniForm title="Deplasman" list={last?.AWAY ?? []} />
        </div>
      </Card>

      <Card title="Alt / Üst İstatistikleri">
        <div className="stx__two">
          <OuCol title="Ev Sahibi" list={ou?.HOME ?? []} />
          <OuCol title="Deplasman" list={ou?.AWAY ?? []} />
        </div>
      </Card>

      <Card title="Eksik Oyuncular">
        <div className="stx__two">
          <MissCol title="Ev Sahibi" list={miss?.HOME ?? []} />
          <MissCol title="Deplasman" list={miss?.AWAY ?? []} />
        </div>
      </Card>

      <Card title="Puan Durumu">
        {standing?.teams?.length ? <MiniStanding rows={standing.teams} /> : <Empty />}
      </Card>

      <Card title="Hakem">
        {ref?.referee ? (
          <>
            <div className="ref__name">
              {ref.referee.name}
              {ref.referee.country?.shortName ? <span className="ref__country">{ref.referee.country.shortName}</span> : null}
            </div>
            <div className="stx__two">
              <RefStat title="Ev Sahibi" s={ref.team?.HOME} />
              <RefStat title="Deplasman" s={ref.team?.AWAY} />
            </div>
          </>
        ) : <Empty />}
      </Card>
    </div>
  )
}

function H2HLine({ m }: { m: H2HMatch }) {
  return (
    <div className="mln">
      <span className="mln__date">{fmtDate(m.date)}</span>
      <span className="mln__teams">{m.homeTeam} — {m.awayTeam}</span>
      <span className="mln__score">{m.homeTeamFullTimeScore}-{m.awayTeamFullTimeScore}
        <em> ({m.homeTeamHalfTimeScore}-{m.awayTeamHalfTimeScore})</em>
      </span>
      {m.tournamentShortName ? <span className="mln__meta">{m.tournamentShortName}</span> : null}
    </div>
  )
}

function MiniForm({ title, list }: { title: string; list: LastMatch[] }) {
  const played = list.filter((m) => m.status === "ENDED")
  const tracked = commonTeamId(played.map((m) => ({ a: m.homeTeam.id, b: m.awayTeam.id })))
  const recent = [...played].sort((a, b) => b.date - a.date).slice(0, 5)
  return (
    <div className="stx__col">
      <div className="stx__colhead">{title}</div>
      {recent.length ? recent.map((m) => {
        const home = tracked === m.homeTeam.id
        const me = home ? m.homeTeam : m.awayTeam
        const opp = home ? m.awayTeam : m.homeTeam
        const r = wdl(me.scores.CURRENT, opp.scores.CURRENT)
        return (
          <div className="mln mln--sm" key={m.id}>
            <FormChip r={r} />
            <span className="mln__teams">{home ? "" : "@"}{opp.shortName}</span>
            <span className="mln__score">{me.scores.CURRENT ?? "-"}-{opp.scores.CURRENT ?? "-"}</span>
          </div>
        )
      }) : <Empty />}
    </div>
  )
}

function OuCol({ title, list }: { title: string; list: UnderOverMarket[] }) {
  return (
    <div className="stx__col">
      <div className="stx__colhead">{title}</div>
      {list.length ? list.map((m, i) => {
        const alt = m.outcomes.find((o) => o.no === 1)?.count ?? 0
        const ust = m.outcomes.find((o) => o.no === 2)?.count ?? 0
        const tot = alt + ust || 1
        return (
          <div className="ou" key={i}>
            <div className="ou__title">{m.tabName} <em>({m.title})</em></div>
            <div className="ou__bar">
              <span className="ou__alt" style={{ width: `${(alt / tot) * 100}%` }} />
              <span className="ou__ust" style={{ width: `${(ust / tot) * 100}%` }} />
            </div>
            <div className="ou__nums"><span>Alt {alt}</span><span>Üst {ust}</span></div>
          </div>
        )
      }) : <Empty />}
    </div>
  )
}

function MissCol({ title, list }: { title: string; list: MissingPlayer[] }) {
  return (
    <div className="stx__col">
      <div className="stx__colhead">{title}</div>
      {list.length ? list.map((p) => (
        <div className="mp" key={p.id}>
          <div className="mp__top">
            <span className="mp__name">{p.knownName}</span>
            <span className={`mp__type mp__type--${(p.missingType?.[0] ?? "").toLowerCase()}`}>
              {p.positionShortName}
            </span>
          </div>
          <div className="mp__reason">{p.missingReason}</div>
        </div>
      )) : <div className="stx__empty">Eksik yok</div>}
    </div>
  )
}

function MiniStanding({ rows }: { rows: StandingSideRow[] }) {
  return (
    <table className="sttab">
      <thead><tr><th>#</th><th className="sttab__name">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>P</th></tr></thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.team.id}>
            <td>{t.position}</td>
            <td className="sttab__name">{t.team.teamName}</td>
            <td>{t.played}</td><td>{t.won}</td><td>{t.draw}</td><td>{t.lost}</td>
            <td className="sttab__p">{t.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RefStat({ title, s }: { title: string; s?: import("../services/matchStats").RefereeTeamStat }) {
  if (!s || s.matchCount === 0) return <div className="stx__col"><div className="stx__colhead">{title}</div><Empty /></div>
  const G = [
    ["Maç", s.matchCount], ["G-B-M", `${s.win}-${s.draw}-${s.lose}`],
    ["Sarı", s.yellowCard], ["Kırmızı", s.redCard], ["Penaltı", s.penaltiesAwarded],
    ["Gol A/Y", `${s.totalGoalsScored}/${s.totalGoalsConceded}`],
  ] as const
  return (
    <div className="stx__col">
      <div className="stx__colhead">{title}</div>
      <div className="ref__grid">
        {G.map(([k, v]) => <div className="refstat" key={k}><span className="refstat__k">{k}</span><span className="refstat__v">{v}</span></div>)}
      </div>
    </div>
  )
}

/* ============================ PUAN DURUMU ============================ */
function StandingView({ d }: { d: StandingData }) {
  const t = d.tournamentStandings?.[0]
  const [side, setSide] = useState<"OVERALL" | "HOME" | "AWAY">("OVERALL")
  if (!t) return <Empty />
  const rows = t.standings[side] ?? []
  const hi = new Set([d.homeTeamId, d.awayTeamId])
  return (
    <div className="stx__stack">
      <div className="sttoggle">
        {(["OVERALL", "HOME", "AWAY"] as const).map((s) => (
          <button key={s} className={`sttoggle__btn${side === s ? " is-active" : ""}`} onClick={() => setSide(s)}>
            {s === "OVERALL" ? "Genel" : s === "HOME" ? "İç Saha" : "Deplasman"}
          </button>
        ))}
      </div>
      <div className="stc__head">{t.name}</div>
      <table className="sttab">
        <thead>
          <tr>
            <th>#</th><th className="sttab__name">Takım</th>
            <th>O</th><th>G</th><th>B</th><th>M</th><th>A</th><th>Y</th><th>P</th>
            {side === "OVERALL" && <th>Form</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((t2) => (
            <tr key={t2.team.id} className={hi.has(t2.team.id) ? "is-hl" : ""}>
              <td>{t2.position}</td>
              <td className="sttab__name">{t2.team.teamName}</td>
              <td>{t2.played}</td><td>{t2.won}</td><td>{t2.draw}</td><td>{t2.lost}</td>
              <td>{t2.scored}</td><td>{t2.against}</td>
              <td className="sttab__p">{t2.points}</td>
              {side === "OVERALL" && (
                <td className="sttab__form">
                  {(t2.form ?? []).slice(-5).map((f, i) => <FormChip key={i} r={f === "W" ? "W" : f === "L" ? "L" : "D"} />)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ============================ ARALARINDAKİ MAÇLAR ============================ */
function H2HView({ d, home, away }: { d: HeadToHeadData; home: string; away: string }) {
  if (!d?.length) return <Empty />
  let hw = 0, dr = 0, aw = 0
  for (const m of d) {
    const hs = m.homeTeamFullTimeScore, as = m.awayTeamFullTimeScore
    // güncel maçtaki ev sahibi tarafını bul
    const homeIsCurrentHome = m.homeTeamCurrentSide === "HOME"
    const curHomeScore = homeIsCurrentHome ? hs : as
    const curAwayScore = homeIsCurrentHome ? as : hs
    if (curHomeScore > curAwayScore) hw++
    else if (curHomeScore < curAwayScore) aw++
    else dr++
  }
  return (
    <div className="stx__stack">
      <div className="h2sum">
        <div className="h2sum__cell"><b>{hw}</b><span>{home || "Ev"}</span></div>
        <div className="h2sum__cell h2sum__cell--d"><b>{dr}</b><span>Beraberlik</span></div>
        <div className="h2sum__cell"><b>{aw}</b><span>{away || "Deplasman"}</span></div>
      </div>
      <Card title={`Karşılaşmalar (${d.length})`}>
        {d.map((m, i) => <H2HLine key={i} m={m} />)}
      </Card>
    </div>
  )
}

/* ============================ SON MAÇLAR ============================ */
function PerfView({ d, home, away }: { d: PerformanceData; home: string; away: string }) {
  return (
    <div className="stx__two">
      <PerfCol title={home || "Ev Sahibi"} list={d.homeTeam ?? []} />
      <PerfCol title={away || "Deplasman"} list={d.awayTeam ?? []} />
    </div>
  )
}
function PerfCol({ title, list }: { title: string; list: PerfMatch[] }) {
  const played = list.filter((m) => m.s === "ENDED")
  const tracked = commonTeamId(played.map((m) => ({ a: m.ht.i, b: m.at.i })))
  const recent = [...played].sort((a, b) => b.d - a.d)
  let g = 0, b = 0, l = 0
  const rows = recent.map((m) => {
    const homeIs = tracked === m.ht.i
    const me = homeIs ? m.ht : m.at
    const opp = homeIs ? m.at : m.ht
    const r = wdl(me.s?.c, opp.s?.c)
    if (r === "W") g++; else if (r === "D") b++; else if (r === "L") l++
    return { m, homeIs, me, opp, r }
  })
  return (
    <div className="stx__col">
      <div className="stx__colhead">{title} <em>{g}G {b}B {l}M</em></div>
      {rows.length ? rows.map(({ m, homeIs, me, opp, r }) => (
        <div className="mln mln--sm" key={m.i}>
          <FormChip r={r} />
          <span className="mln__venue">{homeIs ? "İç" : "Dış"}</span>
          <span className="mln__teams">{opp.sn || opp.n}</span>
          <span className="mln__score">{me.s?.c ?? "-"}-{opp.s?.c ?? "-"}</span>
          <span className="mln__date">{fmtDate(m.d)}</span>
        </div>
      )) : <Empty />}
    </div>
  )
}

/* ============================ SAKAT / CEZALI ============================ */
function MissingView({ d, home, away }: { d: MissingPlayersData; home: string; away: string }) {
  return (
    <div className="stx__two">
      <MissFull title={home || "Ev Sahibi"} list={d.homeTeam ?? []} />
      <MissFull title={away || "Deplasman"} list={d.awayTeam ?? []} />
    </div>
  )
}
function MissFull({ title, list }: { title: string; list: MissingPlayer[] }) {
  return (
    <div className="stx__col">
      <div className="stx__colhead">{title}</div>
      {list.length ? list.map((p) => (
        <div className="mp mp--full" key={p.id}>
          <div className="mp__top">
            <span className="mp__name">{p.knownName}</span>
            <span className="mp__pos">{p.position}</span>
          </div>
          <div className="mp__reason">{p.missingReason}</div>
          {p.stats && (
            <div className="mp__stats">
              <span>Maç {p.stats.matchesCount}</span>
              <span>Gol {p.stats.goals}</span>
              <span>Asist {p.stats.assists}</span>
              <span>Dk {p.stats.totalMinutes}</span>
            </div>
          )}
        </div>
      )) : <div className="stx__empty">Eksik oyuncu yok</div>}
    </div>
  )
}

/* ============================ İLK 11 ============================ */
function LineupView({ d }: { d: LineupsData }) {
  if (!d.homeTeam && !d.awayTeam) return <div className="stx__empty">Kadro henüz açıklanmadı.</div>
  return (
    <div className="stx__stack">
      {d.provisionalLineup && <div className="stx__note">Muhtemel kadro (henüz kesinleşmedi)</div>}
      <div className="stx__two">
        <LineupCol t={d.homeTeam} />
        <LineupCol t={d.awayTeam} />
      </div>
    </div>
  )
}
function LineupCol({ t }: { t: LineupTeam | null }) {
  if (!t) return <div className="stx__col"><div className="stx__empty">Kadro yok</div></div>
  return (
    <div className="stx__col">
      <div className="stx__colhead">{t.name}</div>
      <div className="lup__sec">İlk 11</div>
      {t.starting.map((p) => (
        <div className="lup__p" key={p.id}>
          <span className="lup__no">{p.shirtNumber}</span>
          <span className="lup__name">{p.name}</span>
          <span className="lup__pos">{p.position}</span>
        </div>
      ))}
      <div className="lup__sec">Yedekler</div>
      {t.bench.map((p) => (
        <div className="lup__p lup__p--sub" key={p.id}>
          <span className="lup__no">{p.shirtNumber}</span>
          <span className="lup__name">{p.name}</span>
          <span className="lup__pos">{p.position}</span>
        </div>
      ))}
    </div>
  )
}

/* ============================ KADRO VE İSTATİSTİK ============================ */
function SquadView({ d, home, away }: { d: SquadData; home: string; away: string }) {
  return (
    <div className="stx__stack">
      <SquadTable title={home || "Ev Sahibi"} list={d.hts ?? []} />
      <SquadTable title={away || "Deplasman"} list={d.ats ?? []} />
    </div>
  )
}
function SquadTable({ title, list }: { title: string; list: SquadEntry[] }) {
  return (
    <div>
      <div className="stc__head">{title}</div>
      {list.length ? (
        <table className="sttab sttab--squad">
          <thead>
            <tr>
              <th>#</th><th className="sttab__name">Oyuncu</th><th>P</th>
              <th>Maç</th><th>Dk</th><th>G</th><th>A</th><th>SK</th><th>KK</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.p.i}>
                <td>{e.p.sno || "-"}</td>
                <td className="sttab__name">{e.p.n}</td>
                <td>{e.p.psn}</td>
                <td>{e.s.mc}</td><td>{e.s.tm}</td><td>{e.s.g}</td><td>{e.s.a}</td>
                <td>{e.s.yc}</td><td>{e.s.rc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <Empty />}
    </div>
  )
}

/* ---------- ortak küçük bileşenler ---------- */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="stc">
      <div className="stc__head">{title}</div>
      <div className="stc__body">{children}</div>
    </section>
  )
}
const Empty = () => <div className="stx__empty">Veri yok</div>