import { useEffect, useState } from 'react'
import './App.css'
import { useNuiEvent } from './utils/useNuiEvent'
import { fetchNui } from './utils/fetchNui'
import { debugData } from './utils/debugData'
import LeftMenu from './components/letfMenu'

import MarketBar from './components/MarketBar'
import TopBar from './components/Topbar'
import MatchList from './components/MatchList'


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
		<div className="tablet-stage">
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
		</div>
	)
}