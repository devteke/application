import { srvRequest } from '../utils/api'
import type { LbBoard, LbKind, LbPeriod, LbProfile } from '../types/leaderboard'

export function lbGetProfile(): Promise<LbProfile> {
  return srvRequest<LbProfile>('lbProfile')
}
export function lbRegister(name: string): Promise<LbProfile> {
  return srvRequest<LbProfile>('lbRegister', { name })
}
export function lbGetBoard(period: LbPeriod, kind: LbKind): Promise<LbBoard> {
  return srvRequest<LbBoard>('lbBoard', { period, kind })
}