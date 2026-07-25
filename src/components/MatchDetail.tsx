import { useEventDetail } from "../hooks/useEventDetail"
import { groupDetailMarkets } from "../utils/mapDetail"
import type { DetailMarket, SbOutcome } from "../types/sportsbook"
import "./MatchDetail.css"

const ocLabel = (n: string) => (n === "0" ? "X" : n)
const MANY = 8

export default function MatchDetail({ id }: { id: number }) {
  const { detail, loading, error } = useEventDetail(id)

  if (loading) return <div className="md md--state">Yükleniyor…</div>
  if (error) return <div className="md md--state md--err">Detay alınamadı ({error})</div>
  if (!detail) return null

  const groups = groupDetailMarkets(detail.m ?? [])
  if (!groups.length) return <div className="md md--state">Bu maç için ek market yok.</div>

  return (
    <div className="md">
      {groups.map((g) => {
        const wide = g.markets.some((m) => m.o.length > MANY)
        return (
          <section className={`md-card${wide ? " md-card--wide" : ""}`} key={g.key}>
            <header className="md-card__head">{g.label}</header>
            <div className="md-card__body">
              {g.markets.map((m) => <MarketRow key={m.i} m={m} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MarketRow({ m }: { m: DetailMarket }) {
  const many = m.o.length > MANY
  const stack = m.o.length > 3
  return (
    <div className={`md-mkt${stack ? " md-mkt--stack" : ""}${many ? " md-mkt--grid" : ""}`}>
      <div className="md-mkt__label">
        <span className="md-mkt__min">{m.min}</span>
        <span className="md-mkt__name">{m.n}</span>
      </div>
      <div className="md-mkt__outcomes">
        {m.o.map((o: SbOutcome, i) => {
          const open = o.od > 1
          // Salt-görüntü: MatchDetail'den bahis OYNANMAZ (sadece MatchList).
          return (
            <div
              key={o.on ?? i}
              className={`md-oc md-oc--readonly${open ? "" : " is-off"}`}
              aria-disabled={!open}
            >
              <span className="md-oc__lbl">{ocLabel(o.n)}</span>
              <span className="md-oc__od">{open ? o.od.toFixed(2) : "-"}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}