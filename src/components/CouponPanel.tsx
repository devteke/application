import { useCoupon } from "../context/CouponContext"
import "./CouponPanel.css"

export default function CouponPanel() {
  const { active, misli, totalOdd, bedel, maxWin, remove, clear, setMisli, save } = useCoupon()
  const empty = active.length === 0

  return (
    <aside className="kp">
      <header className="kp__top">
        <span className="kp__title">KUPONUM</span>
        <span className="kp__count">{active.length}</span>
        <span className="kp__odd">{empty ? "-" : totalOdd.toFixed(2)}</span>
      </header>

      <div className="kp__list">
        {empty && <div className="kp__empty">Kupon boş. Bir orana tıklayarak bahis ekleyin.</div>}
        {active.map((b) => (
          <div className="kp-bet" key={b.eventId}>
            <div className="kp-bet__main">
              <span className="kp-bet__match">{b.eventName}</span>
              <span className="kp-bet__mkt">{b.marketName} : <b className="kp-bet__pick">{b.pick}</b></span>
            </div>
            <span className="kp-bet__odd">{b.odd.toFixed(2)}</span>
            <button className="kp-bet__x" onClick={() => remove(b.eventId)} title="Kaldır">×</button>
          </div>
        ))}
      </div>

      <div className="kp__misli">
        <span>Misli</span>
        <input type="number" min={1} value={misli}
          onChange={(e) => setMisli(parseInt(e.target.value, 10))} />
      </div>

      <div className="kp__sum">
        <div className="kp-row"><span>Kupon Bedeli</span><span>{bedel.toFixed(2)} TL</span></div>
        <div className="kp-row kp-row--strong"><span>Toplam Oran</span><span>{empty ? "-" : totalOdd.toFixed(2)}</span></div>
        <div className="kp-row kp-row--accent"><span>Maksimum Kazanç</span><span>{maxWin.toFixed(2)} TL</span></div>
      </div>

      <label className="kp__chk"><input type="checkbox" defaultChecked /> Tüm oran değişikliklerini kabul et</label>
      <label className="kp__chk"><input type="checkbox" defaultChecked /> Sadece yükselen oranları kabul et</label>

      <div className="kp__actions">
        <button className="kp__icon" title="Temizle" onClick={clear} disabled={empty}>🗑</button>
        <button className="kp__icon" title="Kaydet" onClick={save} disabled={empty}>💾</button>
        <button className="kp__play" onClick={save} disabled={empty}>HEMEN OYNA</button>
      </div>
    </aside>
  )
}