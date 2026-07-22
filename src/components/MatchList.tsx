import { useMemo, useState } from "react"
import { useEvents } from "../hooks/useEvents"
import { buildGroups, type MatchRowVM } from "../utils/mapEvents"
import MatchDetail from "./MatchDetail"
import "./MatchList.css"

export default function MatchList() {
  const { data, loading, error } = useEvents()
  const [openId, setOpenId] = useState<number | null>(null)
  const groups = useMemo(() => (data ? buildGroups(data.data.e) : []), [data])

  if (loading) return <div className="ml-state">Yükleniyor…</div>
  if (error) return <div className="ml-state ml-state--err">Veri alınamadı ({error})</div>
  if (!groups.length) return <div className="ml-state">Maç bulunamadı.</div>

  const toggle = (id: number) => setOpenId((cur) => (cur === id ? null : id))

  return (
    <div className="ml">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="ml-daybar">{g.label}</div>
          {g.rows.map((r) => (
            <div key={r.id}>
              <MatchRow r={r} open={openId === r.id} onToggle={() => toggle(r.id)} />
              {openId === r.id && <MatchDetail id={r.id} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function MatchRow({
  r, open, onToggle,
}: {
  r: MatchRowVM
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className={`mr${open ? " is-open" : ""}`} onClick={onToggle}>
      <div className="mr-time">
        <span className="mr-time__h">{r.time}</span>
        <span className="mr-time__d">{r.sub}</span>
      </div>

      <div className="mr-info">
        <span className="mr-name">{r.name}</span>
        <span className="mr-icons">
          {r.live && <span className="mr-ic mr-ic--live">●</span>}
          {r.mbs != null && <span className="mr-mbs">{r.mbs}</span>}
        </span>
      </div>

      <Odd v={r.ms[0]} /><Odd v={r.ms[1]} /><Odd v={r.ms[2]} />
      <Odd v={r.cs[0]} /><Odd v={r.cs[1]} /><Odd v={r.cs[2]} />
      <div className="mr-badge">{r.hcap}</div>
      <Odd v={r.hms[0]} /><Odd v={r.hms[1]} /><Odd v={r.hms[2]} />
      <Odd v={r.auAlt} />
      <div className="mr-line">{r.auLine}</div>
      <Odd v={r.auUst} />
      <div className="mr-total">
        +{r.total}
        <span className={`mr-total__ch${open ? " is-open" : ""}`}>▾</span>
      </div>
    </div>
  )
}

function Odd({ v }: { v: string }) {
  return <div className={`mr-odd${v === "-" ? " is-empty" : ""}`}>{v}</div>
}