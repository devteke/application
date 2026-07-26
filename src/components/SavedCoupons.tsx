import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useCoupon } from "../context/CouponContext"
import type { BetMode, BetResult, CouponResult, SavedCoupon } from "../types/coupon"
import "./SavedCoupons.css"

const COUPON_LABEL: Record<CouponResult, string> = {
  won: "Kazandı",
  lost: "Kaybetti",
  pending: "Bekliyor",
  void: "İade",
}

const BET_LABEL: Record<BetResult, string> = {
  won: "Kazandı",
  lost: "Kaybetti",
  void: "İade",
  pending: "Bekliyor",
}

type StatusFilter = "all" | CouponResult
type TypeFilter = "all" | BetMode
type SortFilter = "new" | "old"

const STATUS_TABS: { k: StatusFilter; label: string }[] = [
  { k: "all", label: "Tümü" },
  { k: "pending", label: "Bekliyor" },
  { k: "won", label: "Kazandı" },
  { k: "lost", label: "Kaybetti" },
  { k: "void", label: "İade" },
]

const TYPE_TABS: { k: TypeFilter; label: string }[] = [
  { k: "all", label: "Tümü" },
  { k: "combi", label: "Kombine" },
  { k: "system", label: "Sistem" },
]

const nf = new Intl.NumberFormat("tr-TR")
const money = (n: number) => nf.format(Math.round(n))

function StatusBadge({ result }: { result: CouponResult }) {
  return (
    <span className={`sk-badge sk-badge--${result}`}>{COUPON_LABEL[result]}</span>
  )
}

function metaText(c: SavedCoupon) {
  return c.betType === "system"
    ? `Sistem ${(c.sizes ?? []).join("/")} · ${c.bets.length} maç`
    : `${c.bets.length} maç · ${c.totalOdd.toFixed(2)}`
}

export default function SavedCoupons({
  embedded,
  onBack,
}: {
  embedded?: boolean
  onBack?: () => void
}) {
  const { saved, removeSaved, refreshSaved } = useCoupon()
  const [openId, setOpenId] = useState<string | null>(null)

  // filtreler
  const [fStatus, setFStatus] = useState<StatusFilter>("all")
  const [fType, setFType] = useState<TypeFilter>("all")
  const [fSort, setFSort] = useState<SortFilter>("new")

  useEffect(() => {
    refreshSaved()
  }, [refreshSaved])

  // Kupon numarası orijinal sıradan sabit
  const numberOf = useMemo(() => {
    const m = new Map<string, number>()
    saved.forEach((c, i) => m.set(c.id, saved.length - i))
    return m
  }, [saved])

  const shown = useMemo(() => {
    const arr = saved.filter(
      (c) =>
        (fStatus === "all" || c.status === fStatus) &&
        (fType === "all" || (c.betType ?? "combi") === fType),
    )
    return [...arr].sort((a, b) =>
      fSort === "new" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
    )
  }, [saved, fStatus, fType, fSort])

  const openCoupon = saved.find((c) => c.id === openId) ?? null

  // --- Sanal liste (MatchList ile aynı yaklaşım): scroll konteyneri .tablet__pageBody ---
  const listElRef = useRef<HTMLDivElement | null>(null)
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  const setListNode = useCallback((node: HTMLDivElement | null) => {
    listElRef.current = node
    if (!node) return
    const sc = node.closest(".tablet__pageBody") as HTMLElement | null
    setScrollEl(sc)
    if (sc) {
      const margin =
        node.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop
      setScrollMargin(margin)
    }
  }, [])

  const virtualizer = useVirtualizer({
    count: shown.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 100,
    overscan: 8,
    scrollMargin,
    getItemKey: (i) => shown[i].id,
  })

  // --- Kart render (hem sanal listede hem standalone'da kullanılır) ---
  const renderCard = (c: SavedCoupon) => {
    const dateStr = new Date(c.createdAt).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
    const isSystem = c.betType === "system"
    const winLabel = c.status === "won" ? "Kazanç" : "Maks. Kazanç"
    const winVal = c.status === "won" ? c.payout : c.maxWin

    return (
      <button className={`skc2 skc2--${c.status}`} onClick={() => setOpenId(c.id)}>
        <span className="skc2__accent" />

        <div className="skc2__main">
          <div className="skc2__row skc2__row--top">
            <span className="skc2__no">#{numberOf.get(c.id)}</span>
            <span className={`skc2__type skc2__type--${isSystem ? "system" : "combi"}`}>
              {isSystem ? `Sistem ${(c.sizes ?? []).join("/")}` : "Kombine"}
            </span>
            <StatusBadge result={c.status} />
          </div>

          <div className="skc2__row skc2__row--mid">
            <span className="skc2__stat">
              <span className="skc2__k">Maç</span>
              <span className="skc2__v">{c.bets.length}</span>
            </span>
            <span className="skc2__stat">
              <span className="skc2__k">Toplam Oran</span>
              <span className="skc2__v">{c.totalOdd.toFixed(2)}</span>
            </span>
            <span className="skc2__stat">
              <span className="skc2__k">Bedel</span>
              <span className="skc2__v">{money(c.bedel)} TL</span>
            </span>
            <span className="skc2__stat skc2__stat--win">
              <span className="skc2__k">{winLabel}</span>
              <span className="skc2__v">{money(winVal)} TL</span>
            </span>
          </div>
        </div>

        <div className="skc2__side">
          <span className="skc2__date">{dateStr}</span>
          <span className="skc2__go">›</span>
        </div>
      </button>
    )
  }

  const filterBar = (
    <div className="sk-filters">
      <div className="sk-fgroup">
        {STATUS_TABS.map((t) => (
          <button
            key={t.k}
            className={"sk-fchip" + (fStatus === t.k ? " is-active" : "")}
            onClick={() => setFStatus(t.k)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <span className="sk-fdiv" />

      <div className="sk-fgroup">
        {TYPE_TABS.map((t) => (
          <button
            key={t.k}
            className={"sk-fchip" + (fType === t.k ? " is-active" : "")}
            onClick={() => setFType(t.k)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        className="sk-fsort"
        onClick={() => setFSort((s) => (s === "new" ? "old" : "new"))}
        title="Tarihe göre sırala"
      >
        {fSort === "new" ? "Yeni → Eski" : "Eski → Yeni"}
      </button>
    </div>
  )

  const emptyState =
    saved.length === 0 ? (
      <div className="sk__empty">Henüz kayıtlı kupon yok.</div>
    ) : shown.length === 0 ? (
      <div className="sk__empty">Bu filtreye uygun kupon yok.</div>
    ) : null

  const modal = openCoupon && (
    <div className="sk__overlay" onClick={() => setOpenId(null)}>
      <div className="sk-modal" onClick={(e) => e.stopPropagation()}>
        <header className="sk-modal__head">
          <span className="sk-modal__title">Kupon #{numberOf.get(openCoupon.id)}</span>
          <span className="sk-modal__meta">{metaText(openCoupon)}</span>
          <StatusBadge result={openCoupon.status} />
          <button
            className="sk-modal__close"
            onClick={() => setOpenId(null)}
            title="Kapat"
          >
            ×
          </button>
        </header>

        <div className="sk-modal__body">
          {openCoupon.bets.map((b) => {
            const r: BetResult = b.result ?? "pending"
            return (
              <div className={`skc-bet skc-bet--${r}`} key={b.eventId}>
                <span className="skc-bet__match">{b.eventName}</span>
                <span className="skc-bet__mkt">
                  {b.marketName} : <b>{b.pick}</b>
                </span>
                <span className="skc-bet__odd">{b.odd.toFixed(2)}</span>
                <span className={`skc-bet__res skc-bet__res--${r}`}>{BET_LABEL[r]}</span>
              </div>
            )
          })}
        </div>

        <div className="sk-modal__foot">
          <div className="skc__sum">
            <span>Bedel: {openCoupon.bedel.toFixed(2)} TL</span>
            {openCoupon.status === "won" ? (
              <span>Kazanç: {openCoupon.payout.toFixed(2)} TL</span>
            ) : (
              <span>Maks: {openCoupon.maxWin.toFixed(2)} TL</span>
            )}
          </div>

          {openCoupon.status === "pending" ? (
            <span className="skc__note">Aktif kupon silinemez</span>
          ) : (
            <button
              className="skc__del"
              onClick={() => {
                removeSaved(openCoupon.id)
                setOpenId(null)
              }}
            >
              Sil
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (embedded) {
    return (
      <div className="tablet__page sk sk--embedded">
        <header className="sk__head">
          <button className="sk__back" onClick={() => onBack?.()} title="Bültene dön">
            ‹
          </button>
          <span className="sk__headTitle">Kayıtlı Kuponlar</span>
          <span className="sk__badge">{saved.length}</span>
        </header>

        {filterBar}

        <div className="tablet__pageBody">
          {emptyState ?? (
            <div
              ref={setListNode}
              className="sk__vlist"
              style={{ height: virtualizer.getTotalSize(), position: "relative" }}
            >
              {virtualizer.getVirtualItems().map((vi) => {
                const c = shown[vi.index]
                return (
                  <div
                    key={c.id}
                    data-index={vi.index}
                    ref={virtualizer.measureElement}
                    className="sk__vitem"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${vi.start - scrollMargin}px)`,
                    }}
                  >
                    {renderCard(c)}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {modal}
      </div>
    )
  }

  return (
    <aside className="sk sk--standalone">
      <header className="sk__head">
        <span className="sk__headTitle">Kayıtlı Kuponlar</span>
        <span className="sk__badge">{saved.length}</span>
      </header>

      {filterBar}

      <div className="sk__list sk__list--plain">
        {emptyState ?? shown.map((c) => <div key={c.id}>{renderCard(c)}</div>)}
      </div>

      {modal}
    </aside>
  )
}