import "./MarketBar.css"
import { useFilters } from "../context/FiltersContext"
import type { OddSort, OddSortKey } from "../utils/mapEvents"

function SortCell({
  id, label, col, sort, onSort,
}: {
  id: OddSortKey
  label: string
  col: number
  sort: OddSort | null
  onSort: (key: OddSortKey) => void
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
  const { search, setSearch, oddSort, toggleOddSort } = useFilters()

  return (
    <div className="marketbar">
      {/* arama: sol iki kolonu ve iki satırı kaplar, dikeyde ortalı */}
      <div className="mb-search">
        <input
          className="mb-search__input"
          placeholder="Maç Ara"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button className="mb-search__clear" onClick={() => setSearch("")}>×</button>}
      </div>

      {/* grup başlıkları (üst satır) */}
      <div className="mb-title mb-title--ms">Maç Sonucu</div>
      <div className="mb-title mb-title--cs">Çifte Şans</div>
      <div className="mb-title mb-title--hms">Handikaplı Maç Sonucu</div>
      <div className="mb-title mb-title--au">Alt/Üst</div>
      <div className="mb-title mb-title--tot" />

      {/* alt satır: sıralanabilir kolonlar */}
      <SortCell id="ms1"  label="1"   col={3}  sort={oddSort} onSort={toggleOddSort} />
      <SortCell id="msX"  label="X"   col={4}  sort={oddSort} onSort={toggleOddSort} />
      <SortCell id="ms2"  label="2"   col={5}  sort={oddSort} onSort={toggleOddSort} />
      <SortCell id="cs1x" label="1-X" col={6}  sort={oddSort} onSort={toggleOddSort} />
      <SortCell id="cs12" label="1-2" col={7}  sort={oddSort} onSort={toggleOddSort} />
      <SortCell id="csx2" label="X-2" col={8}  sort={oddSort} onSort={toggleOddSort} />
      <div className="mb-sub" style={{ gridColumn: 9 }} />{/* handikap rozet kolonu */}
      <SortCell id="h1"   label="1"   col={10} sort={oddSort} onSort={toggleOddSort} />
      <SortCell id="hX"   label="X"   col={11} sort={oddSort} onSort={toggleOddSort} />
      <SortCell id="h2"   label="2"   col={12} sort={oddSort} onSort={toggleOddSort} />
      <SortCell id="alt"  label="Alt" col={13} sort={oddSort} onSort={toggleOddSort} />
      <div className="mb-sub" style={{ gridColumn: 14 }} />{/* alt/üst çizgi kolonu */}
      <SortCell id="ust"  label="Üst" col={15} sort={oddSort} onSort={toggleOddSort} />
      <div className="mb-sub" style={{ gridColumn: 16 }} />{/* toplam kolonu */}
    </div>
  )
}