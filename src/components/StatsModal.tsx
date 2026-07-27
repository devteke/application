import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  fetchSummaries,
  fetchStanding,
  fetchHeadToHead,
  fetchPerformance,
  fetchMissingPlayers,
  fetchLineups,
  fetchSquadStats,
} from "../services/matchStats"
import "./StatsModal.css"

type TabKey = "genel" | "standing" | "h2h" | "perf" | "missing" | "lineup" | "squad"

const TABS: { key: TabKey; label: string }[] = [
  { key: "genel", label: "Genel" },
  { key: "standing", label: "Puan Durumu" },
  { key: "h2h", label: "Aralarındaki" },
  { key: "perf", label: "Son Maçlar" },
  { key: "missing", label: "Sakat/Cezalı" },
  { key: "lineup", label: "İlk 11" },
  { key: "squad", label: "Kadro" },
]

const FETCHERS: Record<TabKey, (id: number) => Promise<any>> = {
  genel: fetchSummaries,
  standing: fetchStanding,
  h2h: fetchHeadToHead,
  perf: fetchPerformance,
  missing: fetchMissingPlayers,
  lineup: fetchLineups,
  squad: fetchSquadStats,
}

type TabState = { loading: boolean; error?: string; data?: any }

export default function StatsModal({
  matchId,
  title,
  onClose,
}: {
  matchId: number
  title: string
  onClose: () => void
}) {
  const [active, setActive] = useState<TabKey>("genel")
  const [cache, setCache] = useState<Partial<Record<TabKey, TabState>>>({})
  const [tick, setTick] = useState(0)
  const loadedRef = useRef<Set<string>>(new Set())
  const [homeName, awayName] = splitTitle(title)

  // Blur/overlay yalnızca maç listesi kolonunu kaplasın diye buraya portal atıyoruz.
  const [host] = useState<HTMLElement>(
    () =>
      ((typeof document !== "undefined" &&
        document.querySelector(".tablet__main")) as HTMLElement) ||
      (typeof document !== "undefined" ? document.body : (null as any))
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  useEffect(() => {
    const key = `${matchId}:${active}:${tick}`
    if (loadedRef.current.has(key)) return
    loadedRef.current.add(key)
    let cancelled = false
    setCache((c) => ({ ...c, [active]: { loading: true } }))
    FETCHERS[active](matchId)
      .then((data) => {
        if (!cancelled) setCache((c) => ({ ...c, [active]: { loading: false, data } }))
      })
      .catch((err) => {
        if (!cancelled)
          setCache((c) => ({ ...c, [active]: { loading: false, error: errText(err) } }))
      })
    return () => {
      cancelled = true
    }
  }, [matchId, active, tick])

  const st = cache[active]

  const overlay = (
    <div className="stx__overlay" onClick={onClose}>
      <div className="stx" onClick={(e) => e.stopPropagation()}>
        <div className="stx__head">
          <div className="stx__title" title={title}>
            {title}
          </div>
          <button className="stx__close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
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
          {st?.loading && <Empty text="Yükleniyor…" />}
          {!st?.loading && st?.error && (
            <div className="stx__err">
              <div>{st.error}</div>
              <button className="stx__retry" onClick={() => setTick((n) => n + 1)}>
                Tekrar dene
              </button>
            </div>
          )}
          {!st?.loading &&
            !st?.error &&
            (st?.data == null ? (
              <Empty />
            ) : (
              <>
                {active === "genel" && <GenelView d={st.data} />}
                {active === "standing" && <StandingView d={st.data} />}
                {active === "h2h" && <H2HView d={st.data} />}
                {active === "perf" && <PerfView d={st.data} home={homeName} away={awayName} />}
                {active === "missing" && (
                  <MissingView d={st.data} home={homeName} away={awayName} />
                )}
                {active === "lineup" && <LineupView d={st.data} />}
                {active === "squad" && <SquadView d={st.data} home={homeName} away={awayName} />}
              </>
            ))}
        </div>
      </div>
    </div>
  )

  if (!host) return null
  return createPortal(overlay, host)
}

/* =============================== Helpers =============================== */
function arr<T = any>(x: any): T[] {
  return Array.isArray(x) ? x : []
}
function num(x: any) {
  return x == null ? "-" : x
}
function splitTitle(title: string): [string, string] {
  const parts = (title || "").split(" - ")
  return [parts[0]?.trim() || "Ev Sahibi", parts[1]?.trim() || "Deplasman"]
}
function fmtDate(ms?: number): string {
  if (!ms) return ""
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(new Date(ms))
  } catch {
    return ""
  }
}
function wdl(me: number, opp: number): "G" | "B" | "M" {
  if (me > opp) return "G"
  if (me === opp) return "B"
  return "M"
}
function errText(err: any): string {
  const code = (err?.message || String(err || "")).trim()
  const map: Record<string, string> = {
    timeout: "Zaman aşımı. Tekrar deneyin.",
    rate_limited: "Çok fazla istek, biraz bekleyin.",
    http_error: "Veri alınamadı.",
    forbidden_path: "Bu veri kaynağına erişilemiyor.",
    srv_error: "Sunucu hatası.",
  }
  return map[code] || "Bir hata oluştu."
}
function teamIntersectId(items: any[], pick: (m: any) => any[]): number | null {
  let ids: number[] | null = null
  for (const m of arr(items)) {
    const cur = pick(m).filter((x: any): x is number => x != null)
    ids = ids == null ? cur : ids.filter((x) => cur.includes(x))
    if (ids.length === 0) break
  }
  return ids && ids.length ? ids[0] : null
}

/* =============================== Atoms =============================== */
function Empty({ text = "Veri yok" }: { text?: string }) {
  return <div className="stx__empty">{text}</div>
}
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="stc">
      <div className="stc__head">{title}</div>
      <div className="stc__body">{children}</div>
    </div>
  )
}
function Sides({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="stx__two">
      <div className="stx__col">
        <div className="stx__colhead">EV SAHİBİ</div>
        {left}
      </div>
      <div className="stx__col">
        <div className="stx__colhead">DEPLASMAN</div>
        {right}
      </div>
    </div>
  )
}
function ResChip({ r }: { r: "G" | "B" | "M" }) {
  const cls = r === "G" ? "res--w" : r === "B" ? "res--d" : "res--l"
  return <span className={`res ${cls}`}>{r}</span>
}

/* =============================== GENEL =============================== */
function GenelView({ d }: { d: any }) {
  const h2h = arr(d?.HEAD_TO_HEAD?.headToHead)
  const lmHome = arr(d?.LAST_MATCHES?.lastMatches?.HOME)
  const lmAway = arr(d?.LAST_MATCHES?.lastMatches?.AWAY)
  const ouHome = arr(d?.UNDER_OVER?.underOver?.HOME)
  const ouAway = arr(d?.UNDER_OVER?.underOver?.AWAY)
  const misHome = arr(d?.MISSING_PLAYERS?.missingPlayers?.HOME).filter(Boolean)
  const misAway = arr(d?.MISSING_PLAYERS?.missingPlayers?.AWAY).filter(Boolean)
  const standing = arr(d?.STANDING?.standings)
  const stdTeams = arr(standing[0]?.teams)

  return (
    <div className="stx__stack">
      <Card title="Aralarındaki Maçlar">
        {h2h.length ? <H2HList items={h2h.slice(0, 8)} /> : <Empty />}
      </Card>

      <Card title="Son Maçlar (Form)">
        <Sides left={<LastForm list={lmHome} />} right={<LastForm list={lmAway} />} />
      </Card>

      <Card title="Alt / Üst İstatistikleri">
        <Sides left={<OuCol list={ouHome} />} right={<OuCol list={ouAway} />} />
      </Card>

      <Card title="Eksik Oyuncular">
        <Sides left={<MissMini list={misHome} />} right={<MissMini list={misAway} />} />
      </Card>

      <Card title="Puan Durumu">
        {stdTeams.length ? <MiniStanding rows={stdTeams} /> : <Empty />}
      </Card>

      <Card title="Hakem">
        <RefereeView data={d?.REFEREE_TEAM} />
      </Card>
    </div>
  )
}

function H2HList({ items }: { items: any[] }) {
  const list = arr(items)
  if (!list.length) return <Empty />
  return (
    <div className="h2list">
      {list.map((m, i) => (
        <div className="h2row" key={i}>
          <span className="h2row__date">{fmtDate(m?.date)}</span>
          <span className="h2row__t h2row__t--h">{m?.homeTeam ?? "-"}</span>
          <span className="h2row__sc">
            {num(m?.homeTeamFullTimeScore)}-{num(m?.awayTeamFullTimeScore)}
          </span>
          <span className="h2row__t h2row__t--a">{m?.awayTeam ?? "-"}</span>
          <span className="h2row__tour">{m?.tournamentShortName ?? ""}</span>
        </div>
      ))}
    </div>
  )
}

function LastForm({ list }: { list: any[] }) {
  const items = arr(list)
  if (!items.length) return <Empty />
  const tid = teamIntersectId(items, (m) => [m?.homeTeam?.id, m?.awayTeam?.id])
  const rows = items.slice(0, 6).map((m) => {
    const meIsHome = tid != null ? m?.homeTeam?.id === tid : true
    const me = meIsHome ? m?.homeTeam : m?.awayTeam
    const opp = meIsHome ? m?.awayTeam : m?.homeTeam
    const ms = me?.scores?.REGULAR ?? me?.scores?.CURRENT
    const os = opp?.scores?.REGULAR ?? opp?.scores?.CURRENT
    const has = ms != null && os != null
    return {
      r: has ? wdl(ms, os) : null,
      opp: opp?.shortName || opp?.teamName || "-",
      sc: has ? `${ms}-${os}` : "-",
      date: m?.date,
    }
  })
  return (
    <div className="lf">
      <div className="lf__chips">
        {rows.map((r, i) =>
          r.r ? <ResChip key={i} r={r.r} /> : <span key={i} className="res res--n">-</span>
        )}
      </div>
      <div className="lf__list">
        {rows.map((r, i) => (
          <div className="lf__row" key={i}>
            <span className="lf__date">{fmtDate(r.date)}</span>
            <span className="lf__opp">{r.opp}</span>
            <span className="lf__sc">{r.sc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OuCol({ list }: { list: any[] }) {
  const items = arr(list)
  if (!items.length) return <Empty />
  return (
    <div className="ou">
      {items.map((m, i) => {
        const alt = arr(m?.outcomes).find((o: any) => o?.no === 1)?.count ?? 0
        const ust = arr(m?.outcomes).find((o: any) => o?.no === 2)?.count ?? 0
        return (
          <div className="ou__row" key={i}>
            <span className="ou__t">{m?.tabName || m?.title || "-"}</span>
            <span className="ou__v ou__v--alt">Alt {alt}</span>
            <span className="ou__v ou__v--ust">Üst {ust}</span>
          </div>
        )
      })}
    </div>
  )
}

function MissMini({ list }: { list: any[] }) {
  const items = arr(list).filter(Boolean)
  if (!items.length) return <Empty text="Eksik yok" />
  return (
    <div className="mln">
      {items.map((p, i) => (
        <div className="mln__row" key={i}>
          <span className="mln__name">
            {p?.knownNameMedium || p?.knownName || p?.knownNameShort || "-"}
          </span>
          <span className="mln__reason">
            {p?.missingReason || arr(p?.missingType)[0] || ""}
          </span>
        </div>
      ))}
    </div>
  )
}

function MiniStanding({ rows }: { rows: any[] }) {
  const items = arr(rows)
  if (!items.length) return <Empty />
  return (
    <table className="sttab">
      <thead>
        <tr>
          <th>#</th>
          <th className="sttab__name">Takım</th>
          <th>O</th>
          <th>G</th>
          <th>B</th>
          <th>M</th>
          <th>P</th>
        </tr>
      </thead>
      <tbody>
        {items.map((t, i) => (
          <tr key={`${i}-${t?.team?.id ?? ""}`}>
            <td>{t?.position ?? "-"}</td>
            <td className="sttab__name">{t?.team?.teamName ?? "-"}</td>
            <td>{t?.played ?? "-"}</td>
            <td>{t?.won ?? "-"}</td>
            <td>{t?.draw ?? "-"}</td>
            <td>{t?.lost ?? "-"}</td>
            <td className="sttab__p">{t?.points ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RefereeView({ data }: { data: any }) {
  const r = data?.referee
  const stat = (s: any) =>
    s ? (
      <div className="refstat">
        <div className="refstat__row"><span>Maç</span><b>{s.matchCount ?? 0}</b></div>
        <div className="refstat__row"><span>G/B/M</span><b>{s.win ?? 0}-{s.draw ?? 0}-{s.lose ?? 0}</b></div>
        <div className="refstat__row"><span>Sarı Kart</span><b>{s.yellowCard ?? 0}</b></div>
        <div className="refstat__row"><span>Kırmızı Kart</span><b>{s.redCard ?? 0}</b></div>
        <div className="refstat__row"><span>Penaltı</span><b>{s.penaltiesAwarded ?? 0}</b></div>
      </div>
    ) : (
      <Empty />
    )
  if (!r && !data?.team) return <Empty />
  return (
    <div className="stx__stack">
      <div className="ref__name">
        {r?.name || "-"}
        {r?.country?.name ? ` · ${r.country.name}` : ""}
      </div>
      <Sides left={stat(data?.team?.HOME)} right={stat(data?.team?.AWAY)} />
    </div>
  )
}

/* =============================== PUAN DURUMU =============================== */
function StandingView({ d }: { d: any }) {
  const t = arr(d?.tournamentStandings)[0]
  const [side, setSide] = useState<"OVERALL" | "HOME" | "AWAY">("OVERALL")
  if (!t) return <Empty />
  const rows = arr(t?.standings?.[side])
  const hi = new Set([d?.homeTeamId, d?.awayTeamId].filter((x: any) => x != null))
  return (
    <div className="stx__stack">
      <div className="sttoggle">
        {(["OVERALL", "HOME", "AWAY"] as const).map((s) => (
          <button
            key={s}
            className={`sttoggle__btn${side === s ? " is-active" : ""}`}
            onClick={() => setSide(s)}
          >
            {s === "OVERALL" ? "Genel" : s === "HOME" ? "İç Saha" : "Deplasman"}
          </button>
        ))}
      </div>
      {t?.name ? <div className="stc__head">{t.name}</div> : null}
      {rows.length ? (
        <table className="sttab">
          <thead>
            <tr>
              <th>#</th>
              <th className="sttab__name">Takım</th>
              <th>O</th>
              <th>G</th>
              <th>B</th>
              <th>M</th>
              <th>A</th>
              <th>Y</th>
              <th>P</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t2, i) => {
              const id = t2?.team?.id
              return (
                <tr key={`${side}-${i}-${id ?? ""}`} className={id && hi.has(id) ? "is-hl" : ""}>
                  <td>{t2?.position ?? "-"}</td>
                  <td className="sttab__name">{t2?.team?.teamName ?? "-"}</td>
                  <td>{t2?.played ?? "-"}</td>
                  <td>{t2?.won ?? "-"}</td>
                  <td>{t2?.draw ?? "-"}</td>
                  <td>{t2?.lost ?? "-"}</td>
                  <td>{t2?.scored ?? "-"}</td>
                  <td>{t2?.against ?? "-"}</td>
                  <td className="sttab__p">{t2?.points ?? "-"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <Empty />
      )}
    </div>
  )
}

/* =============================== ARALARINDAKİ =============================== */
function H2HView({ d }: { d: any }) {
  const items = arr(Array.isArray(d) ? d : d?.data)
  if (!items.length) return <Empty />
  return (
    <div className="stx__stack">
      <Card title="Aralarındaki Maçlar">
        <H2HList items={items} />
      </Card>
    </div>
  )
}

/* =============================== SON MAÇLAR =============================== */
function PerfView({ d, home, away }: { d: any; home: string; away: string }) {
  return (
    <div className="stx__stack">
      <Card title={home}>
        <PerfList list={d?.homeTeam} />
      </Card>
      <Card title={away}>
        <PerfList list={d?.awayTeam} />
      </Card>
    </div>
  )
}
function PerfList({ list }: { list: any[] }) {
  const items = arr(list)
  if (!items.length) return <Empty />
  const tid = teamIntersectId(items, (m) => [m?.ht?.i, m?.at?.i])
  return (
    <div className="pf">
      {items.slice(0, 10).map((m, i) => {
        const meIsHt = tid != null ? m?.ht?.i === tid : true
        const me = meIsHt ? m?.ht : m?.at
        const opp = meIsHt ? m?.at : m?.ht
        const ended = m?.s === "ENDED"
        const ms = me?.s?.c ?? me?.s?.r
        const os = opp?.s?.c ?? opp?.s?.r
        const has = ended && ms != null && os != null
        return (
          <div className="pf__row" key={i}>
            {has ? <ResChip r={wdl(ms, os)} /> : <span className="res res--n">-</span>}
            <span className="pf__date">{fmtDate(m?.d)}</span>
            <span className="pf__side">{meIsHt ? "İç" : "Dep"}</span>
            <span className="pf__opp">{opp?.n || opp?.sn || "-"}</span>
            <span className="pf__sc">{has ? `${ms}-${os}` : ended ? "-" : "—"}</span>
          </div>
        )
      })}
    </div>
  )
}

/* =============================== SAKAT/CEZALI =============================== */
function MissingView({ d, home, away }: { d: any; home: string; away: string }) {
  return (
    <div className="stx__stack">
      <Card title={home}>
        <MissFull list={d?.homeTeam} />
      </Card>
      <Card title={away}>
        <MissFull list={d?.awayTeam} />
      </Card>
    </div>
  )
}
function MissFull({ list }: { list: any[] }) {
  const items = arr(list).filter(Boolean)
  if (!items.length) return <Empty text="Eksik/cezalı oyuncu yok" />
  return (
    <div className="mln">
      {items.map((p, i) => {
        const type = (arr(p?.missingType)[0] || "").toString().toUpperCase()
        const badge =
          type.includes("SUSPEND") || type.includes("CARD") ? "mln__badge--susp" : "mln__badge--inj"
        return (
          <div className="mln__row2" key={i}>
            <span className="mln__name">{p?.knownNameMedium || p?.knownName || "-"}</span>
            <span className="mln__pos">{p?.positionShortName || p?.position || ""}</span>
            <span className={`mln__badge ${badge}`}>
              {p?.missingReason || arr(p?.missingType)[0] || "-"}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* =============================== İLK 11 =============================== */
function LineupView({ d }: { d: any }) {
  const h = d?.homeTeam
  const a = d?.awayTeam
  if (!h && !a) return <Empty />
  return (
    <div className="stx__stack">
      {d?.provisionalLineup ? <div className="lup__note">Tahmini kadro</div> : null}
      <Sides left={<LineupCol t={h} />} right={<LineupCol t={a} />} />
    </div>
  )
}
function LineupCol({ t }: { t: any }) {
  const starting = arr(t?.starting)
  const bench = arr(t?.bench)
  if (!starting.length && !bench.length) return <Empty />
  return (
    <div className="lup">
      {t?.name ? <div className="lup__team">{t.name}</div> : null}
      <div className="lup__sub">İlk 11</div>
      {starting.length ? (
        starting.map((p, i) => <PlayerRow key={p?.id ?? i} p={p} />)
      ) : (
        <Empty />
      )}
      {bench.length ? (
        <>
          <div className="lup__sub">Yedekler</div>
          {bench.map((p, i) => <PlayerRow key={p?.id ?? `b${i}`} p={p} />)}
        </>
      ) : null}
    </div>
  )
}
function PlayerRow({ p }: { p: any }) {
  return (
    <div className="lup__row">
      <span className="lup__no">{p?.shirtNumber ?? "-"}</span>
      <span className="lup__name">{p?.name || "-"}</span>
      <span className="lup__pos">{p?.position || ""}</span>
    </div>
  )
}

/* =============================== KADRO & İSTATİSTİK =============================== */
function SquadView({ d, home, away }: { d: any; home: string; away: string }) {
  return (
    <div className="stx__stack">
      <Card title={home}>
        <SquadTable rows={d?.hts} />
      </Card>
      <Card title={away}>
        <SquadTable rows={d?.ats} />
      </Card>
    </div>
  )
}
function SquadTable({ rows }: { rows: any[] }) {
  const items = arr(rows)
  if (!items.length) return <Empty />
  return (
    <div className="sqwrap">
      <table className="sqtab">
        <thead>
          <tr>
            <th className="sqtab__name">Oyuncu</th>
            <th>Poz</th>
            <th>M</th>
            <th>G</th>
            <th>A</th>
            <th>SK</th>
            <th>KK</th>
            <th>Dk</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => {
            const p = r?.p ?? {}
            const s = r?.s ?? {}
            return (
              <tr key={p?.i ?? i}>
                <td className="sqtab__name">{p?.mn || p?.n || p?.sn || "-"}</td>
                <td>{p?.psn || p?.p || ""}</td>
                <td>{s?.mc ?? 0}</td>
                <td>{s?.g ?? 0}</td>
                <td>{s?.a ?? 0}</td>
                <td>{s?.yc ?? 0}</td>
                <td>{s?.rc ?? 0}</td>
                <td>{s?.tm ?? 0}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}