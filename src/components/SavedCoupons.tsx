import { useState } from "react"
import { useCoupon } from "../context/CouponContext"
import "./SavedCoupons.css"

export default function SavedCoupons() {
  const { saved, removeSaved } = useCoupon()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <aside className="sk">
      <header className="sk__head">Kayıtlı Kuponlar <span className="sk__badge">{saved.length}</span></header>
      {saved.length === 0 && <div className="sk__empty">Henüz kayıtlı kupon yok.</div>}

      <div className="sk__list">
        {saved.map((c, i) => {
          const open = openId === c.id
          const time = new Date(c.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
          return (
            <div className={`skc${open ? " is-open" : ""}`} key={c.id}>
              <button className="skc__head" onClick={() => setOpenId((o) => (o === c.id ? null : c.id))}>
                <span className="skc__title">Kupon #{saved.length - i}</span>
                <span className="skc__meta">{c.bets.length} maç · {c.totalOdd.toFixed(2)}</span>
                <span className="skc__time">{time}</span>
                <span className={`skc__chev${open ? " is-open" : ""}`}>▾</span>
              </button>
              {open && (
                <div className="skc__body">
                  {c.bets.map((b) => (
                    <div className="skc-bet" key={b.eventId}>
                      <span className="skc-bet__match">{b.eventName}</span>
                      <span className="skc-bet__mkt">{b.marketName} : <b>{b.pick}</b></span>
                      <span className="skc-bet__odd">{b.odd.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="skc__sum">
                    <span>Bedel: {c.bedel.toFixed(2)} TL</span>
                    <span>Maks: {c.maxWin.toFixed(2)} TL</span>
                  </div>
                  <button className="skc__del" onClick={() => removeSaved(c.id)}>Sil</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}