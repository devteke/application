App = App or {}

App.Config = {
  -- Para tipi: 'cash' | 'bank' (Qbox money type)
  MoneyType        = 'bank',

  -- Bahis kuralları (hepsi SERVER tarafında zorlanır)
  UnitPrice        = 1,
  MaxMisli         = 1000,
  MinSelections    = 1,
  MaxSelections    = 20,
  MaxOdd           = 1000.0,
  MaxStake         = 100000,
  CutoffLeadMs     = 15 * 60 * 1000,

  -- Anti-flood
  PlaceCooldownMs  = 1500,
  RpcCooldownMs    = 400,
  ApiCooldownMs    = 300,

  -- Bülten cache
  BulletinTTL      = 30 * 1000,
  BulletinPath     = '/api/web/v1/sportsbook/event/0?sportType=SOCCER&betType=PRE_EVENT',
  StatsPath        = '/api/web/v1/statistics/sportType/%s/match/%s',

  SettleIntervalMs = 60 * 1000,
  Webhook          = GetConvar('app_webhook', ''),
}

App.ApiBase    = GetConvar('app_api_base', '')
App.ApiHeaders = {
  ['Referer']    = GetConvar('app_api_referer', ''),
  ['Origin']     = GetConvar('app_api_origin', ''),
  ['Accept']     = 'application/json',
  ['User-Agent'] = 'Mozilla/5.0',
}