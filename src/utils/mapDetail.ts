import { CATEGORIES, categoryOf } from "../config/marketCategories"
import type { DetailMarket } from "../types/sportsbook"

export interface MarketGroup {
  key: string
  label: string
  markets: DetailMarket[]
}

function sortMarkets(a: DetailMarket[]): DetailMarket[] {
  return [...a].sort((x, y) => x.sbt - y.sbt || (x.ov ?? 0) - (y.ov ?? 0))
}

export function groupDetailMarkets(markets: DetailMarket[]): MarketGroup[] {
  const byCat = new Map<string, DetailMarket[]>()
  for (const m of markets) {
    const key = categoryOf(m.sbt)
    const arr = byCat.get(key)
    if (arr) arr.push(m)
    else byCat.set(key, [m])
  }

  const out: MarketGroup[] = []
  for (const c of CATEGORIES) {
    const arr = byCat.get(c.key)
    if (arr?.length) out.push({ key: c.key, label: c.label, markets: sortMarkets(arr) })
  }
  const other = byCat.get("diger")
  if (other?.length) out.push({ key: "diger", label: "Diğer", markets: sortMarkets(other) })
  return out
}