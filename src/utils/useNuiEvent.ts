import { useEffect, useRef } from 'react'

interface NuiMessageData<T = unknown> {
	action: string
	data: T
}

type NuiHandler<T> = (data: T) => void

/**
 * Subscribes to messages sent from the FiveM client via SendNUIMessage.
 * The Lua side should send: SendNUIMessage({ action = 'name', data = ... }).
 */
export function useNuiEvent<T = unknown>(
	action: string,
	handler: NuiHandler<T>,
): void {
	const savedHandler = useRef<NuiHandler<T>>(handler)

	useEffect(() => {
		savedHandler.current = handler
	}, [handler])

	useEffect(() => {
		const listener = (event: MessageEvent<NuiMessageData<T>>) => {
			const { action: eventAction, data } = event.data ?? {}
			if (eventAction === action) {
				savedHandler.current(data)
			}
		}

		window.addEventListener('message', listener)
		return () => window.removeEventListener('message', listener)
	}, [action])
}
