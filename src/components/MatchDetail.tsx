import { useEventDetail } from "../hooks/useEventDetail"
import { groupDetailMarkets } from "../utils/mapDetail"
import type { DetailMarket, SbOutcome } from "../types/sportsbook"
import "./MatchDetail.css"

// bare "0" = beraberlik => X
const ocLabel = (n: string) => (n === "0" ? "X" : n)

export default function MatchDetail({ id }: { id: number }) {
  const { detail, loading, error } = useEventDetail(id)

  if (loading) return <div className="md md--state">Yükleniyor…</div>
  if (error) return <div className="md md--state md--err">Detay alınamadı ({error})</div>
  if (!detail) return null

  const groups = groupDetailMarkets(detail.m ?? [])
  if (!groups.length) return <div className="md md--state">Bu maç için ek market yok.</div>

  return (
    <div className="md">
      {groups.map((g) => (
        <section className="md-card" key={g.key}>
          <header className="md-card__head">{g.label}</header>
          <div className="md-card__body">
            {g.markets.map((m) => <MarketRow key={m.i} m={m} />)}
          </div>
        </section>
      ))}
    </div>
  )
}

function MarketRow({ m }: { m: DetailMarket }) {
  const stack = m.o.length > 3
  return (
    <div className={`md-mkt${stack ? " md-mkt--stack" : ""}`}>
      <div className="md-mkt__label">
        <span className="md-mkt__min">{m.min}</span>
        <span className="md-mkt__name">{m.n}</span>
      </div>
      <div className="md-mkt__outcomes">
        {m.o.map((o: SbOutcome, i) => {
          const open = o.od > 1
          return (
            <button
              key={o.on ?? i}
              className={`md-oc${open ? "" : " is-off"}`}
              disabled={!open}
            >
              <span className="md-oc__lbl">{ocLabel(o.n)}</span>
              <span className="md-oc__od">{open ? o.od.toFixed(2) : "-"}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}