import { useState } from 'react'
import './TopBar.css'
import { useFilters } from '../context/FiltersContext'

const svgProps = {
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.9,
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
}

const IconClock = () => (<svg {...svgProps}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>)
const IconTrophy = () => (<svg {...svgProps}><path d="M7 4h10v4a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /><path d="M12 17v4M8 21h8" /></svg>)
const IconCalendar = () => (<svg {...svgProps}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" /></svg>)
const IconFlag = () => (<svg {...svgProps}><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></svg>)
const IconLayers = () => (<svg {...svgProps}><polygon points="12 2 22 8.5 12 15 2 8.5 12 2" /><polyline points="2 15.5 12 22 22 15.5" /></svg>)
const IconTarget = () => (<svg {...svgProps}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></svg>)
const IconTrash = () => (<svg {...svgProps}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>)
const IconCaret = () => (<svg {...svgProps} className="tb-btn__caret"><polyline points="6 9 12 15 18 9" /></svg>)

type MenuKey = 'date' | 'league' | 'mbs'

export default function TopBar() {
	const {
		sort, singleMatch, dateSel, leagueSel, mbsSel,
		setSort, toggleSingleMatch, setDateSel, setLeagueSel, toggleMbs, clearAll,
		dateOptions, leagueOptions, mbsOptions,
	} = useFilters()

	const [menu, setMenu] = useState<MenuKey | null>(null)
	const close = () => setMenu(null)
	const toggle = (k: MenuKey) => setMenu((m) => (m === k ? null : k))

	const dateLabel = dateSel ? (dateOptions.find((d) => d.key === dateSel)?.label ?? 'Tarih') : 'Tarih seç'
	const leagueLabel = leagueSel != null ? (leagueOptions.find((l) => l.cp === leagueSel)?.label ?? 'Lig') : 'Lig seç'
	const mbsLabel = mbsSel.length ? `MBS: ${[...mbsSel].sort((a, b) => a - b).join(', ')}` : 'MBS seç'

	return (
		<div className="topbar">
			{/* Sıralama (segmented) */}
			<div className="tb-segment">
				<button className={'tb-seg__btn' + (sort === 'date' ? ' is-active' : '')} onClick={() => setSort('date')}>
					<IconClock />Tarihe göre
				</button>
				<button className={'tb-seg__btn' + (sort === 'league' ? ' is-active' : '')} onClick={() => setSort('league')}>
					<IconTrophy />Lige göre
				</button>
			</div>

			<span className="tb-divider" />

			{/* Tarih */}
			<div className="tb-dd">
				<button className={'tb-btn' + (dateSel ? ' is-selected' : '')} onClick={() => toggle('date')}>
					<IconCalendar />{dateLabel}<IconCaret />
				</button>
				{menu === 'date' && (
					<div className="tb-menu">
						{dateOptions.length === 0 && <div className="tb-menu__empty">Seçenek yok</div>}
						{dateOptions.map((o) => (
							<button
								key={o.key}
								className={'tb-menu__item' + (dateSel === o.key ? ' is-active' : '')}
								onClick={() => { setDateSel(dateSel === o.key ? null : o.key); close() }}
							>
								{o.label}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Lig */}
			<div className="tb-dd">
				<button className={'tb-btn' + (leagueSel != null ? ' is-selected' : '')} onClick={() => toggle('league')}>
					<IconFlag />{leagueLabel}<IconCaret />
				</button>
				{menu === 'league' && (
					<div className="tb-menu">
						{leagueOptions.length === 0 && <div className="tb-menu__empty">Seçenek yok</div>}
						{leagueOptions.map((o) => (
							<button
								key={o.cp}
								className={'tb-menu__item' + (leagueSel === o.cp ? ' is-active' : '')}
								onClick={() => { setLeagueSel(leagueSel === o.cp ? null : o.cp); close() }}
							>
								{o.label}
							</button>
						))}
					</div>
				)}
			</div>

			{/* MBS (çoklu) */}
			<div className="tb-dd">
				<button className={'tb-btn' + (mbsSel.length ? ' is-selected' : '')} onClick={() => toggle('mbs')}>
					<IconLayers />{mbsLabel}<IconCaret />
				</button>
				{menu === 'mbs' && (
					<div className="tb-menu">
						{mbsOptions.length === 0 && <div className="tb-menu__empty">Seçenek yok</div>}
						{mbsOptions.map((v) => (
							<button
								key={v}
								className={'tb-menu__item' + (mbsSel.includes(v) ? ' is-active' : '')}
								onClick={() => toggleMbs(v)}
							>
								<span className="tb-menu__check">{mbsSel.includes(v) ? '✓' : ''}</span>MBS {v}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Tek maç toggle */}
			<button className={'tb-btn tb-btn--toggle' + (singleMatch ? ' is-active' : '')} onClick={toggleSingleMatch}>
				<IconTarget />Tek maç
			</button>

			{/* Temizle */}
			<button className="tb-btn tb-btn--clear" onClick={() => { clearAll(); close() }}>
				<IconTrash />Temizle
			</button>

			{menu && <div className="tb-backdrop" onClick={close} />}
		</div>
	)
}