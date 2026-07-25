import type { LeftMenuResponse } from '../types/leftMenu'
import { apiGet } from '../utils/api'

const PATH = '/api/web/v1/sportsbook/left-menu?type=PRE_EVENT'

export function fetchLeftMenu(): Promise<LeftMenuResponse> {
  return apiGet<LeftMenuResponse>(PATH)
}