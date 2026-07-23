import { useEffect, useState } from 'react'
import './App.css'
import { useNuiEvent } from './utils/useNuiEvent'
import { fetchNui } from './utils/fetchNui'
import { debugData } from './utils/debugData'
import LeftMenu from './components/letfMenu'

import MarketBar from './components/MarketBar'
import TopBar from './components/Topbar'
import MatchList from './components/MatchList'
import { CouponProvider } from './context/CouponContext'
import SavedCoupons from './components/SavedCoupons'
import CouponPanel from './components/CouponPanel'
import { FiltersProvider } from './context/FiltersContext'
debugData<boolean>([{ action: 'setVisible', data: true }])

export default function App() {
  const [view, setView] = useState<'markets' | 'savedCoupons'>('markets')
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

  return (
    <CouponProvider>
      <div className="tablet-stage">
        <div className="tablet-wrap">
          <div className="tablet">
            <div className="tablet__screen">
              <FiltersProvider>
                <LeftMenu
                  onOpenSavedCoupons={() => setView('savedCoupons')}
                  onOpenMarkets={() => setView('markets')}
                />

                <div className="tablet__main">
                  <TopBar />

                  <div className="tablet__content">
                    {view === 'markets' ? (
                      <>
                        <MarketBar />
                        <MatchList />
                      </>
                    ) : (
                      <SavedCoupons embedded onBack={() => setView('markets')} />
                    )}
                  </div>
                </div>
              </FiltersProvider>
            </div>
          </div>


          <CouponPanel />
        </div>
      </div>
    </CouponProvider>
  )
}