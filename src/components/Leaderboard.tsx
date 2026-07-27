import { useCallback, useEffect, useState } from 'react'
import './Leaderboard.css'
import { lbGetBoard, lbGetProfile, lbRegister } from '../services/leaderboard'
import type { LbBoard, LbKind, LbPeriod } from '../types/leaderboard'
import { errorMessage } from '../utils/errors'
import { useToast } from '../context/ToastContext'

const PERIODS: { k: LbPeriod; label: string }[] = [
  { k: 'daily', label: 'Günlük' },
  { k: 'weekly', label: 'Haftalık' },
  { k: 'monthly', label: 'Aylık' },
  { k: 'yearly', label: 'Yıllık' },
  { k: 'all', label: 'Tüm Zamanlar' },
]

const KINDS: { k: LbKind; label: string }[] = [
  { k: 'points', label: 'Puan' },
  { k: 'net', label: 'Net (K/Z)' },
  { k: 'winners', label: 'Kazananlar' },
  { k: 'losers', label: 'Kaybedenler' },
]

const nf = new Intl.NumberFormat('tr-TR')
const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard({ onBack }: { onBack?: () => void }) {
  const { notify } = useToast()

  // name: undefined = yükleniyor, null = kayıt yok (sign-up), string = kayıtlı
  const [name, setName] = useState<string | null | undefined>(undefined)
  const [fatal, setFatal] = useState<string | null>(null)

  const [period, setPeriod] = useState<LbPeriod>('weekly')
  const [kind, setKind] = useState<LbKind>('points')
  const [board, setBoard] = useState<LbBoard | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)

  const loadProfile = useCallback(() => {
    setFatal(null)
    setName(undefined)
    lbGetProfile()
      .then((p) => setName(p.name ?? null))
      .catch((e) => setFatal(errorMessage(e)))
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  const loadBoard = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      setBoard(await lbGetBoard(period, kind))
    } catch (e) {
      setErr(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [period, kind])

  useEffect(() => {
    if (!name) return
    loadBoard()
  }, [name, loadBoard])

  const submitName = async () => {
    setSaving(true); setErr(null)
    try {
      const res = await lbRegister(nameInput.trim())
      setName(res.name)
      notify('Sıralamaya katıldın ✓', 'success')
    } catch (e) {
      setErr(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const fmtValue = (v: number) =>
    kind === 'points'
      ? `${nf.format(Math.round(v))} P`
      : `${nf.format(Math.round(Math.abs(v)))} TL`

  const valSign = (v: number) =>
    kind === 'points' ? '' : v > 0 ? '+' : v < 0 ? '-' : ''

  return (
    <div className="tablet__page lb lb--embedded">
      <header className="lb__head">
        <button className="lb__back" onClick={() => onBack?.()} title="Bültene dön">‹</button>
        <span className="lb__headTitle">🏆 Sıralama</span>
      </header>

      {fatal ? (
        <div className="tablet__pageBody">
          <div className="lb__state">
            {fatal}
            <button className="lb__retry" onClick={loadProfile}>Tekrar dene</button>
          </div>
        </div>
      ) : name === undefined ? (
        <div className="tablet__pageBody">
          <div className="lb__state">Yükleniyor…</div>
        </div>
      ) : name === null ? (
        // ---- SIGN-UP (tam sayfa) ----
        <div className="tablet__pageBody">
          <div className="lb-signup">
            <div className="lb-signup__icon">🏅</div>
            <h3 className="lb-signup__title">Sıralamaya katıl</h3>
            <p className="lb-signup__desc">
              Sıralamada görünecek bir takma ad seç. Bu isim herkese açık listelerde görünür
              ve <b>benzersiz</b> olmalıdır.
            </p>
            <input
              className="lb-signup__input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Takma adın"
              maxLength={16}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim().length >= 3) submitName()
              }}
            />
            {err && <div className="lb__err">{err}</div>}
            <button
              className="lb-signup__btn"
              disabled={saving || nameInput.trim().length < 3}
              onClick={submitName}
            >
              {saving ? 'Kaydediliyor…' : 'Kayıt ol'}
            </button>
            <span className="lb-signup__hint">3–16 karakter · harf, rakam, boşluk, . _ -</span>
          </div>
        </div>
      ) : (
        // ---- BOARD ----
        <>
          <div className="lb-filters">
            <div className="lb-fgroup">
              {PERIODS.map((p) => (
                <button
                  key={p.k}
                  className={'lb-chip' + (period === p.k ? ' is-active' : '')}
                  onClick={() => setPeriod(p.k)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className="lb-fdiv" />
            <div className="lb-fgroup">
              {KINDS.map((k) => (
                <button
                  key={k.k}
                  className={'lb-chip' + (kind === k.k ? ' is-active' : '')}
                  onClick={() => setKind(k.k)}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tablet__pageBody">
            {loading ? (
              <div className="lb__state">Yükleniyor…</div>
            ) : err ? (
              <div className="lb__err">{err}</div>
            ) : !board || board.rows.length === 0 ? (
              <div className="lb__state">Bu dönemde veri yok.</div>
            ) : (
              <ul className="lb-list">
                {board.rows.map((r) => (
                  <li
                    key={r.rank}
                    className={
                      'lb-row' +
                      (r.me ? ' lb-row--me' : '') +
                      (r.rank <= 3 ? ` lb-row--top lb-row--top${r.rank}` : '')
                    }
                  >
                    <span className="lb-row__rank">
                      {r.rank <= 3 ? MEDALS[r.rank - 1] : r.rank}
                    </span>
                    <span className="lb-row__name">
                      {r.name}{r.me ? ' (Sen)' : ''}
                    </span>
                    {kind === 'points' && r.wonCount != null && (
                      <span className="lb-row__sub">{r.wonCount} kupon</span>
                    )}
                    <span
                      className={
                        'lb-row__val' +
                        (kind !== 'points'
                          ? r.value > 0 ? ' is-pos' : r.value < 0 ? ' is-neg' : ''
                          : '')
                      }
                    >
                      {valSign(r.value)}{fmtValue(r.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {board?.self && !board.rows.some((r) => r.me) && (
              <div className="lb-self">
                <span className="lb-row__rank">{board.self.rank}</span>
                <span className="lb-row__name">{board.self.name} (Sen)</span>
                <span className="lb-row__val">
                  {valSign(board.self.value)}{fmtValue(board.self.value)}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}