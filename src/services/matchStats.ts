import { apiGet } from "../utils/api"

/* ---------- ortak ---------- */
export interface TeamRef { id: number; teamName: string }

/* ---------- 1) summaries (genel) ---------- */
export interface StandingRow {
  team: TeamRef
  positionStatus?: string | null
  positionStatusId?: number | null
  scored: number; against: number; position: number; delta: number
  played: number; won: number; draw: number; lost: number; points: number
  form?: string[]
}
export interface StandingGroup { name: string; teams: StandingRow[] }

export interface UnderOverMarket {
  marketType: string; tabName: string; specialOddValue: string; title: string
  played: number; outcomes: { no: number; count: number }[]
}
export interface MissingPlayerStats {
  lineupCount: number; substituteCount: number; totalMinutes: number; matchesCount: number
  assists: number; goals: number; penaltyGoals: number; yellowCards: number; redCards: number
}
export interface MissingPlayer {
  id: number; knownName: string; knownNameMedium: string; knownNameShort: string
  missingReason: string; missingType: string[]
  position: string; positionShortName: string
  country: string; countryShortName: string
  stats?: MissingPlayerStats
}
export interface LastMatchTeam {
  id: number; teamName: string; shortName: string
  scores: { REGULAR: number | null; HALF_TIME: number | null; CURRENT: number | null }
}
export interface LastMatch {
  id: number; date: number; status: string
  homeTeam: LastMatchTeam; awayTeam: LastMatchTeam
  stage?: { name: string; order: number }
  season?: { id: number; name: string }
  referee?: string; stadium?: string
}
export interface RefereeTeamStat {
  matchCount: number; win: number; draw: number; lose: number
  totalGoalsScored: number; totalGoalsConceded: number
  yellowCard: number; redCard: number; penaltiesAwarded: number
}
export interface H2HMatch {
  homeTeam: string; awayTeam: string
  homeTeamCurrentSide: "HOME" | "AWAY"; awayTeamCurrentSide: "HOME" | "AWAY"
  homeTeamHalfTimeScore: number; homeTeamFullTimeScore: number
  awayTeamHalfTimeScore: number; awayTeamFullTimeScore: number
  date: number; tournamentShortName: string | null; tournamentName: string | null
}
export interface SummariesData {
  HEAD_TO_HEAD?: { headToHead: H2HMatch[] } | null
  LAST_MATCHES?: { lastMatches: { HOME: LastMatch[]; AWAY: LastMatch[] } } | null
  MISSING_PLAYERS?: { missingPlayers: { HOME: MissingPlayer[]; AWAY: MissingPlayer[] } } | null
  REFEREE_TEAM?: {
    referee: { id: number; name: string; country?: { name: string; shortName: string } | null; age?: number | null } | null
    team: { HOME: RefereeTeamStat; AWAY: RefereeTeamStat }
  } | null
  STANDING?: { standings: StandingGroup[] } | null
  UNDER_OVER?: { underOver: { HOME: UnderOverMarket[]; AWAY: UnderOverMarket[] } } | null
}

/* ---------- 2) standing (puan durumu) ---------- */
export interface StandingSideRow extends StandingRow {}
export interface StandingTournament {
  name: string
  standings: { HOME: StandingSideRow[]; AWAY: StandingSideRow[]; OVERALL: StandingSideRow[] }
}
export interface StandingData {
  homeTeamId: number; awayTeamId: number
  tournamentStandings: StandingTournament[]
}

/* ---------- 3) head-to-head ---------- */
export type HeadToHeadData = H2HMatch[]

/* ---------- 4) performance (son maçlar) ---------- */
export interface PerfTeam {
  i: number; n: string; sn?: string; p?: number
  s?: { r: number | null; c: number | null; ht: number | null }
}
export interface PerfMatch {
  i: number; d: number; s: string; abbr?: string
  at: PerfTeam; ht: PerfTeam
  se?: { i: number; n: string }; sta?: { n: string; o: number }
}
export interface PerformanceData { homeTeam: PerfMatch[]; awayTeam: PerfMatch[] }

/* ---------- 5) missing-players (sakat/cezalı) ---------- */
export interface MissingPlayersData { homeTeam: MissingPlayer[] | null; awayTeam: MissingPlayer[] | null }

/* ---------- 6) lineups (ilk 11) ---------- */
export interface LineupPlayer { id: number; name: string; positionId: number; shirtNumber: number; position: string }
export interface LineupTeam { name: string; shortName: string; teamId: number; starting: LineupPlayer[]; bench: LineupPlayer[] }
export interface LineupsData { homeTeam: LineupTeam | null; awayTeam: LineupTeam | null; provisionalLineup: boolean }

/* ---------- 7) squad-stats (kadro ve istatistik) ---------- */
export interface SquadPlayer {
  i: number; n: string; mn: string; sn: string
  a: number | null; pi: number; sno: number; p: string; psn: string
}
export interface SquadStatLine {
  lc: number; sc: number; tm: number; mc: number
  a: number; g: number; pg: number; yc: number; rc: number
}
export interface SquadEntry { p: SquadPlayer; s: SquadStatLine }
export interface SquadData { hts: SquadEntry[]; ats: SquadEntry[] }

/* ---------- fetchers ---------- */
const data = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data)

export const fetchSummaries = (matchId: number) =>
  data(apiGet<{ data: SummariesData }>(`/api/web/match-stats/v1/summaries?matchId=${matchId}`, "aggr"))

export const fetchStanding = (matchId: number) =>
  data(apiGet<{ data: StandingData }>(`/api/web/v1/statistics/match/${matchId}/standing`))

export const fetchHeadToHead = (matchId: number) =>
  data(apiGet<{ data: HeadToHeadData }>(`/api/web/v1/statistics/match/${matchId}/head-to-head`))

export const fetchPerformance = (matchId: number) =>
  data(apiGet<{ data: PerformanceData }>(`/api/web/v1/statistics/match/${matchId}/performance`))

export const fetchMissingPlayers = (matchId: number) =>
  data(apiGet<{ data: MissingPlayersData }>(`/api/web/v1/statistics/match/${matchId}/missing-players`))

export const fetchLineups = (matchId: number) =>
  data(apiGet<{ data: LineupsData }>(`/api/web/match-stats/v1/match/${matchId}/lineups`, "aggr"))

export const fetchSquadStats = (matchId: number) =>
  data(apiGet<{ data: SquadData }>(`/api/web/v1/statistics/squad-stats/${matchId}`))