App = App or {}

App.Config = {
    Framework = GetConvar('app_framework', 'standalone'),

    -- Bahis kuralları (hepsi SERVER tarafında zorlanır)
    UnitPrice = 1, -- 1 misli = kaç para
    MaxMisli = 1000,
    MinSelections = 1,
    MaxSelections = 20,
    MaxOdd = 1000.0, -- imkânsız oran koruması
    MaxStake = 100000, -- imkânsız bedel koruması
    CutoffLeadMs = 15 * 60 * 1000,
    MoneyType = 'bank',
    -- Anti-flood
    PlaceCooldownMs = 1500,
    RpcCooldownMs = 400,
    ApiCooldownMs = 300,

    -- Bülten cache (oran otoritesi buradan okunur)
    BulletinTTL = 30 * 1000,
    BulletinPath = '/api/web/v1/sportsbook/event/0?sportType=SOCCER&betType=PRE_EVENT',
    StatsPath = '/api/web/v1/statistics/sportType/%s/match/%s',

    SettleIntervalMs = 60 * 1000,
    Webhook = GetConvar('app_webhook', '')
}

App.ApiBase = GetConvar('app_api_base', '')
App.ApiHeaders = {
    ['Referer'] = GetConvar('app_api_referer', ''),
    ['Origin'] = GetConvar('app_api_origin', ''),
    ['Accept'] = 'application/json',
    ['User-Agent'] = 'Mozilla/5.0'
}
