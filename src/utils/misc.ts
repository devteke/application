// True when running inside a regular browser (Vite dev server), false when
// running inside FiveM's CEF. FiveM injects `invokeNative` onto window.
export const isEnvBrowser = (): boolean => !(window as Window).invokeNative
