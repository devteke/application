import { isEnvBrowser } from './misc'

/**
 * Sends a POST request to the FiveM client (NUI callback).
 *
 * @param eventName  The RegisterNUICallback name on the Lua side.
 * @param data       Payload sent to the client.
 * @param mockData   Value returned instead when running in a browser (dev).
 */
export async function fetchNui<T = unknown>(
	eventName: string,
	data?: unknown,
	mockData?: T,
): Promise<T> {
	// In the browser there is no FiveM client to answer, so return mock data.
	if (isEnvBrowser()) {
		return mockData as T
	}

	const resourceName = window.GetParentResourceName
		? window.GetParentResourceName()
		: 'fivem-nui'

	// Build the CEF callback URL. Protocol is split to keep it literal.
	const protocol = 'https' + '://'
	const url = protocol + resourceName + '/' + eventName

	const resp = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json; charset=UTF-8' },
		body: JSON.stringify(data ?? {}),
	})

	return (await resp.json()) as T
}
