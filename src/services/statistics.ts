import { apiGet } from "../utils/api"
import type { MatchStatResponse } from "../types/statistics"

const path = (sportType: string, matchId: number) =>
  `/api/web/v1/statistics/sportType/${sportType}/match/${matchId}`

/** Tek maçın sonucunu/istatistiğini çeker. matchId = statistics id (sgi). */
export function fetchMatchStat(matchId: number, sportType = "SOCCER") {
  return apiGet<MatchStatResponse>(path(sportType, matchId))
}