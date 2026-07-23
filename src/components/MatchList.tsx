import { useCallback, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useFilters } from "../context/FiltersContext"
import type { MatchRowVM, Cell, SortMode } from "../utils/mapEvents"
import { useCoupon } from "../context/CouponContext"
import MatchDetail from "./MatchDetail"
import "./MatchList.css"

type ListItem =
  | { kind: "header"; key: string; label: string }
  | { kind: "row"; key: string; r: MatchRowVM }

export default function MatchList() {
  const { groups, loading, error, sort } = useFilters()
  const [openId, setOpenId] = useState<number | null>(null)

  // Grupları tek düz listeye çevir (başlık + satırlar)
  const items = useMemo<ListItem[]>(() => {
    const out: ListItem[] = []
    for (const g of groups) {
      out.push({ kind: "header", key: `h:${g.key}`, label: g.label })
      for (const r of g.rows) out.push({ kind: "row", key: `r:${g.key}:${r.id}`, r })
    }
    return out
  }, [groups])

  // Scroll konteyneri: .tablet__content
  // Scroll konteyneri (.tablet__content) — callback ref ile .ml mount olunca yakalanır
  const listElRef = useRef<HTMLDivElement | null>(null)
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  const setListNode = useCallback((node: HTMLDivElement | null) => {
    listElRef.current = node
    if (!node) return
    const sc = node.closest(".tablet__content") as HTMLElement | null
    setScrollEl(sc)
    if (sc) {
      const margin =
        node.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop
      setScrollMargin(margin)
    }
  }, [])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollEl,
    estimateSize: (i) => (items[i].kind === "header" ? 28 : 44),
    overscan: 10,
    scrollMargin,
    getItemKey: (i) => items[i].key,
  })

  if (loading) return <div className="ml-state">Yükleniyor…</div>
  if (error) return <div className="ml-state ml-state--err">Veri alınamadı ({error})</div>
  if (!items.length) return <div className="ml-state">Maç bulunamadı.</div>

  const vItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={setListNode}
      className="ml"
      style={{ height: virtualizer.getTotalSize(), position: "relative" }}
    >
      {vItems.map((vi) => {
        const item = items[vi.index]
        return (
          <div
            key={item.key}
            data-index={vi.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vi.start - scrollMargin}px)`,
            }}
          >
            {item.kind === "header" ? (
              <div className="ml-daybar">{item.label}</div>
            ) : (
              <>
                <MatchRow
                  r={item.r}
                  sort={sort}
                  open={openId === item.r.id}
                  onToggle={() => setOpenId((o) => (o === item.r.id ? null : item.r.id))}
                />
                {openId === item.r.id && <MatchDetail id={item.r.id} />}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MatchRow({
  r, sort, open, onToggle,
}: { r: MatchRowVM; sort: SortMode; open: boolean; onToggle: () => void }) {
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