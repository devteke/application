import { useState } from "react"
import "./MarketBar.css"

type SortState = { key: string; dir: "asc" | "desc" } | null

function SortCell({
  id, label, col, sort, onSort,
}: {
  id: string
  label: string
  col: number
  sort: SortState
  onSort: (key: string) => void
}) {
  const active = sort?.key === id
  const dir = active ? sort!.dir : null
  return (
    <button
      className={`mb-sub mb-sort${active ? " is-active" : ""}`}
      style={{ gridColumn: col }}
      onClick={() => onSort(id)}
    >
      <span className="mb-sort__lbl">{label}</span>
      <span className="mb-sort__carets">
        <span className={`mb-caret${dir === "asc" ? " is-on" : ""}`}>▲</span>
        <span className={`mb-caret${dir === "desc" ? " is-on" : ""}`}>▼</span>
      </span>
    </button>
  )
}

export default function MarketBar() {
  const [q, setQ] = useState("")
  const [sort, setSort] = useState<SortState>(null)

  const onSort = (key: string) =>
    setSort((s) =>
      s?.key !== key ? { key, dir: "desc" }
      : s.dir === "desc" ? { key, dir: "asc" }
      : null,
    )

  return (
    <div className="marketbar">
      {/* arama: sol iki kolonu ve iki satırı kaplar, dikeyde ortalı */}
      <div className="mb-search">
        <input
          className="mb-search__input"
          placeholder="Maç Ara"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && <button className="mb-search__clear" onClick={() => setQ("")}>×</button>}
      </div>

      {/* grup başlıkları (üst satır) */}
      <div className="mb-title mb-title--ms">Maç Sonucu</div>
      <div className="mb-title mb-title--cs">Çifte Şans</div>
      <div className="mb-title mb-title--hms">Handikaplı Maç Sonucu</div>
      <div className="mb-title mb-title--au">Alt/Üst</div>
      <div className="mb-title mb-title--tot" />

      {/* alt satır: sıralanabilir kolonlar */}
      <SortCell id="ms1"  label="1"   col={3}  sort={sort} onSort={onSort} />
      <SortCell id="msX"  label="X"   col={4}  sort={sort} onSort={onSort} />
      <SortCell id="ms2"  label="2"   col={5}  sort={sort} onSort={onSort} />
      <SortCell id="cs1x" label="1-X" col={6}  sort={sort} onSort={onSort} />
      <SortCell id="cs12" label="1-2" col={7}  sort={sort} onSort={onSort} />
      <SortCell id="csx2" label="X-2" col={8}  sort={sort} onSort={onSort} />
      <div className="mb-sub" style={{ gridColumn: 9 }} />{/* handikap rozet kolonu */}
      <SortCell id="h1"   label="1"   col={10} sort={sort} onSort={onSort} />
      <SortCell id="hX"   label="X"   col={11} sort={sort} onSort={onSort} />
      <SortCell id="h2"   label="2"   col={12} sort={sort} onSort={onSort} />
      <SortCell id="alt"  label="Alt" col={13} sort={sort} onSort={onSort} />
      <div className="mb-sub" style={{ gridColumn: 14 }} />{/* alt/üst çizgi kolonu */}
      <SortCell id="ust"  label="Üst" col={15} sort={sort} onSort={onSort} />
      <div className="mb-sub" style={{ gridColumn: 16 }} />{/* toplam kolonu */}
    </div>
  )
}