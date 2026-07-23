import { useEventDetail } from "../hooks/useEventDetail"
import { groupDetailMarkets } from "../utils/mapDetail"
import type { DetailMarket, SbOutcome } from "../types/sportsbook"
import "./MatchDetail.css"
import { useCoupon } from "../context/CouponContext"

const ocLabel = (n: string) => (n === "0" ? "X" : n)
const MANY = 8 // bu sayıdan fazla seçenekli market = yoğun/geniş

export default function MatchDetail({ id }: { id: number }) {
  const { detail, loading, error } = useEventDetail(id)

  if (loading) return <div className="md md--state">Yükleniyor…</div>
  if (error) return <div className="md md--state md--err">Detay alınamadı ({error})</div>
  if (!detail) return null

  const groups = groupDetailMarkets(detail.m ?? [])
  if (!groups.length) return <div className="md md--state">Bu maç için ek market yok.</div>

  const ev = { id: detail.i, name: `${detail.ph} - ${detail.pa}` }

  return (
    <div className="md">
      {groups.map((g) => {
        const wide = g.markets.some((m) => m.o.length > MANY)
        return (
          <section className={`md-card${wide ? " md-card--wide" : ""}`} key={g.key}>
            <header className="md-card__head">{g.label}</header>
            <div className="md-card__body">
              {g.markets.map((m) => <MarketRow key={m.i} m={m} ev={ev} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MarketRow({ m, ev }: { m: DetailMarket; ev: { id: number; name: string } }) {
  const { isPicked, pick } = useCoupon()
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
          const active = isPicked(ev.id, m.i, o.on)
          return (
            <button
              key={o.on ?? i}
              className={`md-oc${open ? "" : " is-off"}${active ? " is-active" : ""}`}
              disabled={!open}
              onClick={() =>
                open &&
                pick({
                  eventId: ev.id,
                  eventName: ev.name,
                  marketId: m.i,
                  marketName: m.n,
                  on: o.on,
                  pick: ocLabel(o.n),
                  odd: o.od,
                })
              }
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