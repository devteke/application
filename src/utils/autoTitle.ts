// Kırpılmış (ellipsis / satır-clamp) metinlerin üstüne gelince tam halini
// title (tooltip) olarak gösterir. Proje genelinde tek sefer kurulur.
export function installAutoTitle() {
	const isTruncated = (el: HTMLElement) =>
		el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1

	document.addEventListener(
		"mouseover",
		(e) => {
			const el = e.target as HTMLElement | null
			if (!el || el.nodeType !== 1) return

			const cs = getComputedStyle(el)
			const lineClamp = cs.getPropertyValue("-webkit-line-clamp")
			const canClamp = lineClamp !== "" && lineClamp !== "none"
			const canEllipsis = cs.textOverflow === "ellipsis"

			// sadece kırpılma stili olan öğelerle ilgilen
			if (!canClamp && !canEllipsis) {
				if (el.dataset.autotitle) {
					el.removeAttribute("title")
					delete el.dataset.autotitle
				}
				return
			}

			// elle verilmiş bir title varsa ona dokunma
			if (el.title && !el.dataset.autotitle) return

			if (isTruncated(el)) {
				el.title = (el.textContent ?? "").trim()
				el.dataset.autotitle = "1"
			} else if (el.dataset.autotitle) {
				el.removeAttribute("title")
				delete el.dataset.autotitle
			}
		},
		true, // capture: iç öğelerde de yakala
	)
}