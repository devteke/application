// FiveM injects this global into the NUI (CEF) runtime.
declare global {
	interface Window {
		GetParentResourceName?: () => string
		invokeNative?: unknown
	}
}

export {}
