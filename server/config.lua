App = App or {}

App.Config = {
  -- Para tipi: 'cash' | 'bank' (Qbox money type)
  MoneyType        = 'bank',

  -- Bahis kuralları (HEPSI server tarafında zorlanır — important.txt: client'a güvenme)
  UnitPrice        = 1,
  MaxMisli         = 20000,        -- en fazla misli
  MinSelections    = 1,
  MaxSelections    = 20,           -- en fazla bet adedi
  MaxWin           = 12500000,     -- en fazla kazanç (TL) — 0 => sınırsız
  MaxOdd           = 0,            -- toplam oran tavanı — 0 => kapalı (MaxWin devrede)
  MaxStake         = 100000,       -- 0 => kapalı
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
App.AggrBase   = GetConvar('app_aggr_base', '')
App.ApiHeaders = {
  ['Referer']    = GetConvar('app_api_referer', ''),
  ['Origin']     = GetConvar('app_api_origin', ''),
  ['Accept']     = 'application/json',
  ['User-Agent'] = 'Mozilla/5.0',
}