import { useEffect, useMemo, useState } from "react"
import { useCoupon } from "../context/CouponContext"
import type { BetMode, BetResult, CouponResult } from "../types/coupon"
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

// --- SavedCoupons filtre seçenekleri ---
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

const metaText = (c: {
  betType?: string
  sizes?: number[]
  bets: unknown[]
  totalOdd: number
}) =>
  c.betType === "system"
    ? `Sistem ${(c.sizes ?? []).join("/")} · ${c.bets.length} maç`
    : `${c.bets.length} maç · ${c.totalOdd.toFixed(2)}`

function StatusBadge({ result }: { result: CouponResult }) {
  return (
    <span className={`sk-badge sk-badge--${result}`}>{COUPON_LABEL[result]}</span>
  )
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

  // Filtre state'i
  const [fStatus, setFStatus] = useState<StatusFilter>("all")
  const [fType, setFType] = useState<TypeFilter>("all")
  const [fSort, setFSort] = useState<SortFilter>("new")

  // Panel her açıldığında sunucudan güncel listeyi çek
  useEffect(() => {
    refreshSaved()
  }, [refreshSaved])

  // Kupon numarası orijinal sıradan sabit kalsın (filtre/sıralamadan etkilenmesin)
  const numberOf = useMemo(() => {
    const m = new Map<string, number>()
    saved.forEach((c, i) => m.set(c.id, saved.length - i))
    return m
  }, [saved])

  // Filtre + sıralama uygulanmış görünen liste
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

  const cards = (
    <>
      {saved.length === 0 ? (
        <div className="sk__empty">Henüz kayıtlı kupon yok.</div>
      ) : shown.length === 0 ? (
        <div className="sk__empty">Bu filtreye uygun kupon yok.</div>
      ) : (
        shown.map((c) => {
          const time = new Date(c.createdAt).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })

          return (
            <div className={`skc skc--${c.status}`} key={c.id}>
              <button className="skc__head" onClick={() => setOpenId(c.id)}>
                <span className="skc__title">Kupon #{numberOf.get(c.id)}</span>
                <span className="skc__meta">{metaText(c)}</span>
                <StatusBadge result={c.status} />
                <span className="skc__time">{time}</span>
                <span className="skc__go">›</span>
              </button>
            </div>
          )
        })
      )}
    </>
  )

  const modal = openCoupon && (
    <div className="sk__overlay" onClick={() => setOpenId(null)}>
      <div className="sk-modal" onClick={(e) => e.stopPropagation()}>
        <header className="sk-modal__head">
          <span className="sk-modal__title">
            Kupon #{numberOf.get(openCoupon.id)}
          </span>

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
                <span className={`skc-bet__res skc-bet__res--${r}`}>
                  {BET_LABEL[r]}
                </span>
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
          <div className="sk__list">{cards}</div>
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

      <div className="sk__list">{cards}</div>

      {modal}
    </aside>
  )
}