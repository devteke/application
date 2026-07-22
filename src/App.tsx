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


debugData<boolean>([{ action: 'setVisible', data: true }])

export default function App() {
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
				<SavedCoupons />
				<div className="tablet">
					<div className="tablet__screen">
						<LeftMenu />
						<div className="tablet__main">
							<TopBar />
							<div className="tablet__content">
								<MarketBar />
								<MatchList />
							</div>
						</div>
					</div>
				</div>
				<CouponPanel />
			</div>
		</CouponProvider>
	)
}