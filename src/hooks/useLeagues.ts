import { useEffect, useState } from "react"
import { fetchLeftMenu } from "../services/leftMenu"
import type { LeagueMap } from "../utils/mapEvents"

export function useLeagues() {
    const [leagueMap, setLeagueMap] = useState<LeagueMap>(new Map())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let alive = true
        fetchLeftMenu()
            .then((res) => {
                if (!alive) return
                const m: LeagueMap = new Map()
                for (const sport of res.data ?? []) {
                    for (const country of sport.c ?? []) {
                        for (const league of country.c ?? []) {
                            m.set(league.i, {
                                league: league.n,
                                country: country.n,
                                code: league.c ?? league.sn ?? String(league.i),
                                order: country.p * 1000 + league.p,
                            })
                        }
                    }
                }
                setLeagueMap(m)
            })
            .catch(() => { /* lig adları opsiyonel; hata olursa id ile gösterilir */ })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [])

    return { leagueMap, loading }
}