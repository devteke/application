import { useEffect, useState } from "react"
import { useCoupon } from "../context/CouponContext"
import type { BetResult, CouponResult } from "../types/coupon"
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
    <span className={`sk-badge sk-badge--${result}`}>
      {COUPON_LABEL[result]}
    </span>
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

  // Panel her açıldığında sunucudan güncel listeyi çek
  useEffect(() => {
    refreshSaved()
  }, [refreshSaved])

  const openIndex = saved.findIndex((c) => c.id === openId)
  const openCoupon = openIndex >= 0 ? saved[openIndex] : null

  const cards = (
    <>
      {saved.length === 0 && (
        <div className="sk__empty">Henüz kayıtlı kupon yok.</div>
      )}

      {saved.map((c, i) => {
        const time = new Date(c.createdAt).toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        })

        return (
          <div className={`skc skc--${c.status}`} key={c.id}>
            <button
              className="skc__head"
              onClick={() => setOpenId(c.id)}
            >
              <span className="skc__title">
                Kupon #{saved.length - i}
              </span>

              <span className="skc__meta">
                {metaText(c)}
              </span>

              <StatusBadge result={c.status} />

              <span className="skc__time">{time}</span>

              <span className="skc__go">›</span>
            </button>
          </div>
        )
      })}
    </>
  )

  const modal = openCoupon && (
    <div
      className="sk__overlay"
      onClick={() => setOpenId(null)}
    >
      <div
        className="sk-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sk-modal__head">
          <span className="sk-modal__title">
            Kupon #{saved.length - openIndex}
          </span>

          <span className="sk-modal__meta">
            {metaText(openCoupon)}
          </span>

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
              <div
                className={`skc-bet skc-bet--${r}`}
                key={b.eventId}
              >
                <span className="skc-bet__match">
                  {b.eventName}
                </span>

                <span className="skc-bet__mkt">
                  {b.marketName} : <b>{b.pick}</b>
                </span>

                <span className="skc-bet__odd">
                  {b.odd.toFixed(2)}
                </span>

                <span
                  className={`skc-bet__res skc-bet__res--${r}`}
                >
                  {BET_LABEL[r]}
                </span>
              </div>
            )
          })}
        </div>

        <div className="sk-modal__foot">
          <div className="skc__sum">
            <span>
              Bedel: {openCoupon.bedel.toFixed(2)} TL
            </span>

            {openCoupon.status === "won" ? (
              <span>
                Kazanç: {openCoupon.payout.toFixed(2)} TL
              </span>
            ) : (
              <span>
                Maks: {openCoupon.maxWin.toFixed(2)} TL
              </span>
            )}
          </div>

          {openCoupon.status === "pending" ? (
            <span className="skc__note">
              Aktif kupon silinemez
            </span>
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
          <button
            className="sk__back"
            onClick={() => onBack?.()}
            title="Bültene dön"
          >
            ‹
          </button>

          <span className="sk__headTitle">
            Kayıtlı Kuponlar
          </span>

          <span className="sk__badge">
            {saved.length}
          </span>
        </header>

        <div className="tablet__pageBody">
          <div className="sk__list">
            {cards}
          </div>
        </div>

        {modal}
      </div>
    )
  }

  return (
    <aside className="sk sk--standalone">
      <header className="sk__head">
        <span className="sk__headTitle">
          Kayıtlı Kuponlar
        </span>

        <span className="sk__badge">
          {saved.length}
        </span>
      </header>

      <div className="sk__list">
        {cards}
      </div>

      {modal}
    </aside>
  )
}