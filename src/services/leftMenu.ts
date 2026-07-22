import type { LeftMenuResponse } from '../types/leftMenu'
import { isEnvBrowser } from '../utils/misc'

const PATH = '/api/web/v1/sportsbook/left-menu?type=PRE_EVENT'

export async function fetchLeftMenu(): Promise<LeftMenuResponse> {
	// Tarayıcı dev'inde CORS için proxy, FiveM'de doğrudan.
	const base = isEnvBrowser() ? '/misli' : 'https://apivx.misli.com'

	const res = await fetch(base + PATH, {
		headers: { Accept: 'application/json' },
	})
	if (!res.ok) throw new Error(`left-menu isteği başarısız: ${res.status}`)

	return (await res.json()) as LeftMenuResponse
}