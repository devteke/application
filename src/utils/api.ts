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
    if (!ok) { p.reject(new Error(typeof body === "string" && body ? body : "http_error")); return }
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

const srvPending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>()
let srvSeq = 0, srvListening = false

function ensureSrvListener() {
  if (srvListening) return
  srvListening = true
  window.addEventListener("message", (e: MessageEvent) => {
    const msg = e.data
    if (!msg || msg.action !== "srvResult") return
    const { reqId, ok, data } = msg.data ?? {}
    const p = srvPending.get(reqId); if (!p) return
    srvPending.delete(reqId)
    ok ? p.resolve(data) : p.reject(new Error(String(data ?? "srv_error")))
  })
}

export async function srvRequest<T = unknown>(action: string, payload?: unknown): Promise<T> {
  if (isEnvBrowser()) { /* dev mock */ return undefined as T }
  ensureSrvListener()
  const reqId = ++srvSeq
  const promise = new Promise<T>((resolve, reject) => {
    srvPending.set(reqId, { resolve, reject })
    setTimeout(() => { if (srvPending.delete(reqId)) reject(new Error("timeout")) }, 15000)
  })
  await fetchNui("srv", { reqId, action, payload })
  return promise
}