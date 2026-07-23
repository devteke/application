import { useState } from "react"
import { useFilters } from "../context/FiltersContext"
import type { MatchRowVM, Cell, SortMode } from "../utils/mapEvents"
import { useCoupon } from "../context/CouponContext"
import MatchDetail from "./MatchDetail"
import "./MatchList.css"

export default function MatchList() {
  const { groups, loading, error, sort } = useFilters()
  const [openId, setOpenId] = useState<number | null>(null)

  if (loading) return <div className="ml-state">Yükleniyor…</div>
  if (error) return <div className="ml-state ml-state--err">Veri alınamadı ({error})</div>
  if (!groups.length) return <div className="ml-state">Maç bulunamadı.</div>

  return (
    <div className="ml">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="ml-daybar">{g.label}</div>
          {g.rows.map((r) => (
            <div key={r.id}>
              <MatchRow r={r} sort={sort} open={openId === r.id} onToggle={() => setOpenId((o) => (o === r.id ? null : r.id))} />
              {openId === r.id && <MatchDetail id={r.id} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function MatchRow({ r, sort, open, onToggle }: { r: MatchRowVM; sort: SortMode; open: boolean; onToggle: () => void }) {
  const topLabel = sort === "league" ? r.dayShort : r.time
  const subLabel = sort === "league" ? r.time : r.leagueCode
  return (
    <div className={`mr${open ? " is-open" : ""}`}>
      <div className="mr-time" onClick={onToggle}>
        <span className="mr-time__h">{topLabel}</span>
        <span className="mr-time__d">{subLabel}</span>
      </div>
      <div className="mr-info" onClick={onToggle}>
        <span className="mr-name">{r.name}</span>
        <span className="mr-icons">
          {r.live && <span className="mr-ic mr-ic--live">●</span>}
          {r.mbs != null && <span className="mr-mbs">{r.mbs}</span>}
        </span>
      </div>

      <OddCell c={r.ms[0]} /><OddCell c={r.ms[1]} /><OddCell c={r.ms[2]} />
      <OddCell c={r.cs[0]} /><OddCell c={r.cs[1]} /><OddCell c={r.cs[2]} />
      <div className="mr-badge">{r.hcap}</div>
      <OddCell c={r.hms[0]} /><OddCell c={r.hms[1]} /><OddCell c={r.hms[2]} />
      <OddCell c={r.auAlt} />
      <div className="mr-line">{r.auLine}</div>
      <OddCell c={r.auUst} />

      <div className="mr-total" onClick={onToggle}>
        +{r.total}
        <span className={`mr-total__ch${open ? " is-open" : ""}`}>▾</span>
      </div>
    </div>
  )
}

function OddCell({ c }: { c: Cell }) {
  const { isPicked, pick } = useCoupon()
  if (!c.bet) return <div className="mr-odd is-empty">{c.txt}</div>
  const active = isPicked(c.bet.eventId, c.bet.marketId, c.bet.on)
  return (
    <button
      className={`mr-odd mr-odd--btn${active ? " is-active" : ""}`}
      onClick={(e) => { e.stopPropagation(); pick(c.bet!) }}
    >
      {c.txt}
    </button>
  )
}