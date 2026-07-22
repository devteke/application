import { useState } from 'react'
import './TopBar.css'

type SortMode = 'date' | 'league'

const svgProps = {
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.9,
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
}

const IconClock = () => (
	<svg {...svgProps}>
		<circle cx="12" cy="12" r="9" />
		<polyline points="12 7 12 12 15 14" />
	</svg>
)
const IconTrophy = () => (
	<svg {...svgProps}>
		<path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
		<path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
		<path d="M12 17v4M8 21h8" />
	</svg>
)
const IconCalendar = () => (
	<svg {...svgProps}>
		<rect x="3" y="4" width="18" height="18" rx="2" />
		<line x1="3" y1="9" x2="21" y2="9" />
		<line x1="8" y1="2" x2="8" y2="6" />
		<line x1="16" y1="2" x2="16" y2="6" />
	</svg>
)
const IconFlag = () => (
	<svg {...svgProps}>
		<path d="M4 22V4M4 4h13l-2 4 2 4H4" />
	</svg>
)
const IconLayers = () => (
	<svg {...svgProps}>
		<polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
		<polyline points="2 15.5 12 22 22 15.5" />
	</svg>
)
const IconTarget = () => (
	<svg {...svgProps}>
		<circle cx="12" cy="12" r="9" />
		<circle cx="12" cy="12" r="3.5" />
	</svg>
)
const IconTrash = () => (
	<svg {...svgProps}>
		<polyline points="3 6 5 6 21 6" />
		<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
		<path d="M10 11v6M14 11v6" />
		<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
	</svg>
)
const IconCaret = () => (
	<svg {...svgProps} className="tb-btn__caret">
		<polyline points="6 9 12 15 18 9" />
	</svg>
)

export default function TopBar() {
	const [sort, setSort] = useState<SortMode>('date')
	const [singleMatch, setSingleMatch] = useState(false)
	const [dateSel, setDateSel] = useState<string | null>(null)
	const [leagueSel, setLeagueSel] = useState<string | null>(null)
	const [mbsSel, setMbsSel] = useState<string | null>(null)

	const clearAll = () => {
		setSort('date')
		setSingleMatch(false)
		setDateSel(null)
		setLeagueSel(null)
		setMbsSel(null)
	}

	return (
		<div className="topbar">
			{/* Sıralama (segmented) */}
			<div className="tb-segment">
				<button
					className={'tb-seg__btn' + (sort === 'date' ? ' is-active' : '')}
					onClick={() => setSort('date')}
				>
					<IconClock />
					Tarihe göre
				</button>
				<button
					className={'tb-seg__btn' + (sort === 'league' ? ' is-active' : '')}
					onClick={() => setSort('league')}
				>
					<IconTrophy />
					Lige göre
				</button>
			</div>

			<span className="tb-divider" />

			{/* Filtreler — tıklayınca dropdown açılacak (sonraki adım) */}
			<button
				className={'tb-btn' + (dateSel ? ' is-selected' : '')}
				onClick={() => {
					/* TODO: tarih seçici aç */
				}}
			>
				<IconCalendar />
				{dateSel ?? 'Tarih seç'}
				<IconCaret />
			</button>

			<button
				className={'tb-btn' + (leagueSel ? ' is-selected' : '')}
				onClick={() => {
					/* TODO: lig seçici aç */
				}}
			>
				<IconFlag />
				{leagueSel ?? 'Lig seç'}
				<IconCaret />
			</button>

			<button
				className={'tb-btn' + (mbsSel ? ' is-selected' : '')}
				onClick={() => {
					/* TODO: MBS seçici aç */
				}}
			>
				<IconLayers />
				{mbsSel ?? 'MBS seç'}
				<IconCaret />
			</button>

			{/* Tek maç toggle */}
			<button
				className={'tb-btn tb-btn--toggle' + (singleMatch ? ' is-active' : '')}
				onClick={() => setSingleMatch((v) => !v)}
			>
				<IconTarget />
				Tek maç
			</button>

			{/* Temizle — sağa yaslı */}
			<button className="tb-btn tb-btn--clear" onClick={clearAll}>
				<IconTrash />
				Temizle
			</button>
		</div>
	)
}