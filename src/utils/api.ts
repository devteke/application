import { fetchNui } from "./fetchNui"
import { isEnvBrowser } from "./misc"

const DEV_PREFIX = "/misli" // dev'de Vite proxy; FiveM'de kullanılmaz

type Pending = { resolve: (v: unknown) => void; reject: (e: unknown) => void }
const pending = new Map<number, Pending>()
let seq = 0
let listening = false

function ensureListener() {
  if (listening) return
  listening = true
  window.addEventListener("message", (e: MessageEvent) => {
    const msg = e.data
    if (!msg || msg.action !== "apiResult") return
    const { reqId, ok, body } = msg.data ?? {}
    const p = pending.get(reqId)
    if (!p) return
    pending.delete(reqId)
    if (!ok) { p.reject(new Error("http_error")); return }
    try { p.resolve(typeof body === "string" ? JSON.parse(body) : body) }
    catch (err) { p.reject(err) }
  })
}

/** GET. path daima "/api/..." ile başlar (base'siz). */
export async function apiGet<T>(path: string): Promise<T> {
  if (isEnvBrowser()) {
    const r = await fetch(DEV_PREFIX + path, { headers: { Accept: "application/json" } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return (await r.json()) as T
  }
  ensureListener()
  const reqId = ++seq
  const promise = new Promise<T>((resolve, reject) => {
    pending.set(reqId, { resolve: resolve as (v: unknown) => void, reject })
    setTimeout(() => { if (pending.delete(reqId)) reject(new Error("timeout")) }, 15000)
  })
  await fetchNui("apiGet", { reqId, path })
  return promise
}