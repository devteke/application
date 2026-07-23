import { useEffect, useState } from 'react'
import './leftMenu.css'
import { fetchLeftMenu } from '../services/leftMenu'
import type { SportCategory } from '../types/leftMenu'
import { useFilters } from '../context/FiltersContext'

const SPORT_ICONS: Record<string, string> = {
	SOCCER: '⚽',
	BASKETBALL: '🏀',
	E_FOOTBALL: '🎮',
	E_BASKETBALL: '🕹️',
	VOLLEYBALL: '🏐',
	TENNIS: '🎾',
	AMERICAN_FOOTBALL: '🏈',
	SNOOKER: '🎱',
}

function Chevron({ small }: { small?: boolean }) {
	return (
		<svg
			className={small ? 'lm-chev lm-chev--sm' : 'lm-chev'}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.4"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="9 6 15 12 9 18" />
		</svg>
	)
}

export default function LeftMenu(props: {
	onOpenSavedCoupons?: () => void
	onOpenMarkets?: () => void
}) {
	const { onOpenSavedCoupons, onOpenMarkets } = props
	const [sports, setSports] = useState<SportCategory[]>([])
	const [collapsed, setCollapsed] = useState(false)
	// Tek-aktif ana tab (accordion)
	const [activeSport, setActiveSport] = useState<number | null>(null)
	const [openCountries, setOpenCountries] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { leagueSel, setLeagueSel } = useFilters()

	const selectLeague = (cp: number) => {
		onOpenMarkets?.()                                  // kupon ekranındaysa bültene dön
		setLeagueSel(leagueSel === cp ? null : cp)         // aynısına tıklama = kaldır
	}
	useEffect(() => {
		let cancelled = false
		fetchLeftMenu()
			.then((res) => {
				if (cancelled) return
				setSports([...(res.data ?? [])].sort((a, b) => a.p - b.p))
			})
			.catch((e) => {
				if (!cancelled) setError(String(e))
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [])

	// Ana tab: sadece biri açık kalır; tekrar tıklanınca kapanır
	const handleSportClick = (id: number) => {
		if (collapsed) {
			setCollapsed(false)
			setActiveSport(id)
			return
		}
		setActiveSport((cur) => (cur === id ? null : id))
	}

	// Alt kategori (ülke) toggle; seçilince ait olduğu spor aktif olur
	const toggleCountry = (sportId: number, key: string) => {
		setActiveSport(sportId)
		setOpenCountries((prev) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})
	}

	return (
		<aside className={'lm' + (collapsed ? ' lm--collapsed' : '')}>
			<div className="lm__header">
				{!collapsed && <span className="lm__title">Spor Bülteni</span>}
				<button
					className="lm__toggle"
					onClick={() =>
						setCollapsed((c) => {
							const next = !c
							if (next) setActiveSport(null)
							return next
						})
					}
					title={collapsed ? 'Genişlet' : 'Daralt'}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="15 6 9 12 15 18" />
					</svg>
				</button>
			</div>

			<div className="lm__list">
				{loading && !collapsed && <div className="lm__state">Yükleniyor…</div>}
				{error && !collapsed && <div className="lm__state">Hata: {error}</div>}

				{!loading &&
					!error &&
					sports.map((sport) => {
						const sportOpen = activeSport === sport.i
						const countries = [...sport.c].sort((a, b) => a.p - b.p)

						return (
							<div key={sport.i} className="lm-sport">
								{/* --- Ana tab (spor) --- */}
								<button
									className={'lm-sport__head' + (sportOpen ? ' is-open' : '')}
									onClick={() => handleSportClick(sport.i)}
									title={collapsed ? sport.n : undefined}
								>
									<span className="lm-sport__icon">
										{SPORT_ICONS[sport.st] ?? '🏅'}
									</span>
									<span className="lm-sport__name">{sport.n}</span>
									<span className="lm-count">{sport.t}</span>
									<Chevron />
								</button>

								{!collapsed && sportOpen && (
									<div className="lm-sport__body">
										{countries.map((country) => {
											const key = `${sport.i}:${country.i}`
											const countryOpen = openCountries.has(key)
											const leagues = [...country.c].sort((a, b) => a.p - b.p)

											return (
												<div key={key} className="lm-country">
													{/* --- Sub (ülke) --- */}
													<button
														className={
															'lm-country__head' +
															(countryOpen ? ' is-open' : '')
														}
														onClick={() => toggleCountry(sport.i, key)}
													>
														<span className="lm-flag" aria-hidden />
														<span className="lm-country__name">
															{country.n}
														</span>
														<span className="lm-count">{country.t}</span>
														<Chevron small />
													</button>

													{countryOpen && (
														<ul className="lm-leagues">
															{leagues.map((league) => (
																<li key={league.i} className="lm-league">
																	<button
																		type="button"
																		className={'lm-league__btn' + (leagueSel === league.i ? ' is-active' : '')}
																		onClick={() => selectLeague(league.i)}
																		title={league.n}
																	>
																		<span className="lm-league__name">{league.n}</span>
																		<span className="lm-league__count">{league.t}</span>
																	</button>
																</li>
															))}
														</ul>
													)}
												</div>
											)
										})}
									</div>
								)}
							</div>
						)
					})}
			</div>
			<div className="lm__footer">
				<button
					className="lm-footbtn"
					onClick={() => onOpenSavedCoupons?.()}
					title="Kayıtlı Kuponlar"
				>
					<span className="lm-footbtn__ic">🧾</span>
					<span className="lm-footbtn__txt">Kayıtlı Kuponlar</span>
				</button>

				<button
					className="lm-footbtn lm-footbtn--muted"
					onClick={() => onOpenMarkets?.()}
					title="Spor Bülteni"
				>
					<span className="lm-footbtn__ic">🏟</span>
					<span className="lm-footbtn__txt">Bülten</span>
				</button>
			</div>
		</aside>
	)
}