import { useEffect, useState } from 'react'
import './App.css'
import { useNuiEvent } from './utils/useNuiEvent'
import { fetchNui } from './utils/fetchNui'
import { debugData } from './utils/debugData'
import LeftMenu from './components/letfMenu'
import Leaderboard from './components/Leaderboard'
import MarketBar from './components/MarketBar'
import TopBar from './components/Topbar'
import MatchList from './components/MatchList'
import { CouponProvider } from './context/CouponContext'
import SavedCoupons from './components/SavedCoupons'
import CouponPanel from './components/CouponPanel'
import { FiltersProvider } from './context/FiltersContext'
import { ToastProvider } from './context/ToastContext'
import ToastHost from './components/Toast'
debugData<boolean>([{ action: 'setVisible', data: true }])

export default function App() {
  const [view, setView] = useState<'markets' | 'savedCoupons' | 'leaderboard'>('markets')
  const [visible, setVisible] = useState(false)
  useNuiEvent<boolean>('setVisible', setVisible)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        setVisible(false)
        fetchNui('closeMenu', undefined, { ok: true })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  if (!visible) return null

  const isMarkets = view === 'markets'

  return (
    <ToastProvider>
      <CouponProvider>
        <div className="tablet-stage">
          <div className="tablet-wrap">
            <div className="tablet">
              <div className="tablet__screen">
                <FiltersProvider>
                  <LeftMenu
                    onOpenSavedCoupons={() => setView('savedCoupons')}
                    onOpenMarkets={() => setView('markets')}
                    onOpenLeaderboard={() => setView('leaderboard')}
                  />
                  <div className="tablet__main">
                    {/* Maç listesi filtreleri yalnızca bültende */}
                    {isMarkets && <TopBar />}

                    <div
                      className={
                        'tablet__content' + (isMarkets ? '' : ' tablet__content--page')
                      }
                    >
                      {view === 'markets' && (
                        <>
                          <MarketBar />
                          <MatchList />
                        </>
                      )}
                      {view === 'savedCoupons' && (
                        <SavedCoupons embedded onBack={() => setView('markets')} />
                      )}
                      {view === 'leaderboard' && (
                        <Leaderboard onBack={() => setView('markets')} />
                      )}
                    </div>
                  </div>
                </FiltersProvider>
              </div>
            </div>

            <CouponPanel />
          </div>
        </div>

        <ToastHost />
      </CouponProvider>
    </ToastProvider>
  )
}