import { useCoupon } from "../context/CouponContext"
import { BETTING } from "../config/betting"
import "./CouponPanel.css"

export default function CouponPanel() {
  const {
    active, misli, totalOdd, bedel, maxWin, remove, clear, setMisli, save,
    mode, setMode, isBanko, toggleBanko, sizes, toggleSize, nonBankoCount, combos,
  } = useCoupon()

  const empty = active.length === 0
  const isSystem = mode === "system"
  const validSizes = sizes.filter((k) => k >= 1 && k <= nonBankoCount)
  const sysInvalid = isSystem && (nonBankoCount < 2 || validSizes.length === 0)
  const canPlay = !empty && !sysInvalid

  return (
    <aside className={`kp${empty ? " is-collapsed" : ""}`}>
      <header className="kp__top">
        <span className="kp__title">KUPONUM</span>
        <span className="kp__count">{active.length}</span>
        <span className="kp__odd">{empty ? "-" : totalOdd.toFixed(2)}</span>
      </header>

      <div className="kp__mode">
        <button className={`kp__modebtn${!isSystem ? " is-on" : ""}`} onClick={() => setMode("combi")}>Kombine</button>
        <button className={`kp__modebtn${isSystem ? " is-on" : ""}`} onClick={() => setMode("system")}>Sistem</button>
      </div>

      <div className="kp__list">
        {empty && <div className="kp__empty">Kupon boş. Bir orana tıklayarak bahis ekleyin.</div>}
        {active.map((b) => (
          <div className="kp-bet" key={b.eventId}>
            {isSystem && (
              <button
                className={`kp-bet__banko${isBanko(b.eventId) ? " is-on" : ""}`}
                onClick={() => toggleBanko(b.eventId)}
                title="Banko (her kombinasyonda)"
              >B</button>
            )}
            <div className="kp-bet__main">
              <span className="kp-bet__match">{b.eventName}</span>
              <span className="kp-bet__mkt">
                {b.marketName} : <b className="kp-bet__pick">{b.pick}</b>
              </span>
            </div>
            <span className="kp-bet__odd">{b.odd.toFixed(2)}</span>
            <button className="kp-bet__x" onClick={() => remove(b.eventId)} title="Kaldır">×</button>
          </div>
        ))}
      </div>

      {isSystem && !empty && (
        <div className="kp__sys">
          <div className="kp__sys-row">
            {Array.from({ length: nonBankoCount }, (_, i) => i + 1).map((k) => (
              <button
                key={k}
                className={`kp__sizechip${sizes.includes(k) ? " is-on" : ""}`}
                onClick={() => toggleSize(k)}
              >{k}</button>
            ))}
          </div>
          <div className="kp__sys-info">
            {nonBankoCount < 2
              ? <span className="kp__sys-warn">Sistem için en az 2 banko-dışı maç gerekir</span>
              : validSizes.length === 0
                ? <span className="kp__sys-warn">Bir sistem boyutu seçin</span>
                : <span>{combos} kombinasyon</span>}
          </div>
        </div>
      )}

      <div className="kp__misli">
        <span>Misli</span>
        <div className="kp-stepper">
          <button className="kp-stepper__btn" onClick={() => setMisli(misli - 1)} disabled={misli <= 1} aria-label="Azalt">−</button>
          <input
            className="kp-stepper__inp"
            type="text"
            inputMode="numeric"
            value={misli}
            onChange={(e) => setMisli(parseInt(e.target.value.replace(/\D/g, ""), 10))}
          />
          <button className="kp-stepper__btn" onClick={() => setMisli(misli + 1)} disabled={misli >= BETTING.maxMisli} aria-label="Artır">+</button>
        </div>
      </div>

      <div className="kp__sum">
        <div className="kp-row"><span>Kupon Bedeli</span><span>{bedel.toFixed(2)} TL</span></div>
        <div className="kp-row kp-row--strong"><span>{isSystem ? "Kombinasyon" : "Toplam Oran"}</span><span>{empty ? "-" : isSystem ? combos : totalOdd.toFixed(2)}</span></div>
        <div className="kp-row kp-row--accent"><span>Maksimum Kazanç</span><span>{maxWin.toFixed(2)} TL</span></div>
      </div>

      <label className="kp__chk"><input type="checkbox" defaultChecked /> Tüm oran değişikliklerini kabul et</label>
      <label className="kp__chk"><input type="checkbox" defaultChecked /> Sadece yükselen oranları kabul et</label>

      <div className="kp__actions">
        <button className="kp__icon" title="Temizle" onClick={clear} disabled={empty}>🗑</button>
        <button className="kp__icon" title="Kaydet" onClick={save} disabled={!canPlay}>💾</button>
        <button className="kp__play" onClick={save} disabled={!canPlay}>HEMEN OYNA</button>
      </div>
    </aside>
  )
}