// FiveM/CEF native HTML "title" tooltip'ini GÖSTERMEZ (run dev'de Chromium gösterir).
// Bu yüzden kendi tooltip elementimizi çizip body'ye basıyoruz. Konum JS ile hesaplanır,
// böylece scroll/overflow konteynerlerinde kırpılmaz.

const HOVER_DELAY = 350 // ms — üzerine gelince açılma gecikmesi (istediğin gibi ayarla)

let tipEl: HTMLDivElement | null = null
let currentTarget: HTMLElement | null = null
let showTimer: number | null = null

function ensureTip(): HTMLDivElement {
	if (tipEl) return tipEl
	const el = document.createElement('div')
	el.className = 'app-tip'
	el.setAttribute('role', 'tooltip')
	el.style.display = 'none'
	document.body.appendChild(el)
	tipEl = el
	return el
}

function isTruncated(el: HTMLElement): boolean {
	return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
}

function textFor(el: HTMLElement): string {
	// Öncelik: elle verilen ipucu (data-tip / title), yoksa kırpılan tam metin.
	const manual = el.dataset.tip || el.getAttribute('title')
	if (manual && manual.trim()) return manual.trim()
	return (el.textContent ?? '').trim()
}

function place(el: HTMLElement) {
	const tip = ensureTip()
	const r = el.getBoundingClientRect()
	// Önce görünür yap ki ölçebilelim
	tip.style.display = 'block'
	tip.style.left = '0px'
	tip.style.top = '0px'
	const tr = tip.getBoundingClientRect()
	const m = 8

	let left = r.left + r.width / 2 - tr.width / 2
	let top = r.top - tr.height - m // varsayılan: üstte

	if (top < m) top = r.bottom + m // üste sığmazsa alta al
	// Ekran kenarlarına sığdır
	left = Math.max(m, Math.min(left, window.innerWidth - tr.width - m))
	top = Math.max(m, Math.min(top, window.innerHeight - tr.height - m))

	tip.style.left = `${Math.round(left)}px`
	tip.style.top = `${Math.round(top)}px`
}

function render(el: HTMLElement) {
	const text = textFor(el)
	if (!text) return
	const tip = ensureTip()
	tip.textContent = text // XSS güvenli: textContent (innerHTML DEĞİL)
	currentTarget = el
	place(el)
	requestAnimationFrame(() => tip.classList.add('is-show'))
}

function clearTimer() {
	if (showTimer !== null) {
		clearTimeout(showTimer)
		showTimer = null
	}
}

function scheduleShow(el: HTMLElement) {
	// Tooltip zaten açıksa komşu öğeye geçişte gecikmesiz güncelle (akıcı tarama).
	const alreadyOpen = !!(tipEl && tipEl.classList.contains('is-show'))
	clearTimer()
	if (alreadyOpen) {
		render(el)
		return
	}
	showTimer = window.setTimeout(() => {
		showTimer = null
		render(el)
	}, HOVER_DELAY)
}

function hide() {
	clearTimer()
	currentTarget = null
	if (!tipEl) return
	tipEl.classList.remove('is-show')
	tipEl.style.display = 'none'
}

export function installAutoTitle() {
	document.addEventListener(
		'mouseover',
		(e) => {
			const el = e.target as HTMLElement | null
			if (!el || el.nodeType !== 1) return

			// Elle konmuş native title'ı söküp data-tip'e taşı (görünmeyen native tooltip devre dışı).
			if (el.hasAttribute('title')) {
				const t = el.getAttribute('title') || ''
				if (t.trim()) el.dataset.tip = t.trim()
				el.removeAttribute('title')
			}

			const hasManual = !!(el.dataset.tip && el.dataset.tip.trim())

			const cs = getComputedStyle(el)
			const lineClamp = cs.getPropertyValue('-webkit-line-clamp')
			const canClamp = lineClamp !== '' && lineClamp !== 'none'
			const canEllipsis = cs.textOverflow === 'ellipsis'

			if (hasManual) {
				scheduleShow(el) // buton vb. elle ipucu verilenler
			} else if ((canClamp || canEllipsis) && isTruncated(el)) {
				scheduleShow(el) // sadece gerçekten kırpılıyorsa
			} else if (el === currentTarget) {
				hide()
			} else {
				// Kırpılmayan boş bir öğeye girildi: bekleyen açılışı iptal et.
				clearTimer()
			}
		},
		true, // capture: iç öğelerde de yakala
	)

	document.addEventListener(
		'mouseout',
		(e) => {
			const el = e.target as HTMLElement | null
			// Hedeften çıkıldı: hem bekleyen zamanlayıcıyı iptal et hem gizle.
			if (el && (el === currentTarget || showTimer !== null)) hide()
		},
		true,
	)

	// Scroll / tıklama / pencere değişince gizle (yanlış konumda takılı kalmasın)
	document.addEventListener('scroll', hide, true)
	window.addEventListener('mousedown', hide, true)
	window.addEventListener('blur', hide)
}