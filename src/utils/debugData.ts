import { isEnvBrowser } from './misc'

interface DebugEvent<T = unknown> {
	action: string
	data: T
}

/**
 * Simulates SendNUIMessage events while developing in the browser.
 * No-op inside FiveM. Useful to preview menus with mock data.
 */
export function debugData<T = unknown>(
	events: DebugEvent<T>[],
	timer = 300,
): void {
	if (isEnvBrowser() && import.meta.env.MODE === 'development') {
		for (const event of events) {
			setTimeout(() => {
				window.dispatchEvent(
					new MessageEvent('message', {
						data: { action: event.action, data: event.data },
					}),
				)
			}, timer)
		}
	}
}
