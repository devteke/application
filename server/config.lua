App = App or {}

App.Config = {
    -- Para tipi: 'cash' | 'bank' (Qbox money type)
    MoneyType = 'bank',

    -- Bahis kuralları (HEPSI server tarafında zorlanır — important.txt: client'a güvenme)
    UnitPrice = 1,
    MaxMisli = 20000, -- en fazla misli
    MinSelections = 1,
    MaxSelections = 20, -- en fazla bet adedi
    MaxWin = 12500000, -- en fazla kazanç (TL) — 0 => sınırsız
    MaxOdd = 0, -- toplam oran tavanı — 0 => kapalı (MaxWin devrede)
    MaxStake = 100000, -- 0 => kapalı
    CutoffLeadMs = 15 * 60 * 1000,

    -- Anti-flood
    PlaceCooldownMs = 1500,
    RpcCooldownMs = 400,
    ApiCooldownMs = 300,

    -- Bülten cache
    BulletinTTL = 30 * 1000,
    BulletinPath = '/api/web/v1/sportsbook/event/0?sportType=SOCCER&betType=PRE_EVENT',
    StatsPath = '/api/web/v1/statistics/sportType/%s/match/%s',

    SettleIntervalMs = 60 * 1000,
    UseTestStats = GetConvar('app_use_test_stats', 'false') == 'true',
    -- === Leaderboard (sıralama) ===
    Leaderboard = {
        TopLimit = 100, -- her listede en fazla kaç oyuncu
        AnonName = 'İsimsiz', -- ismini kaydetmemiş oyuncu etiketi

        Name = {
            MinLen = 3,
            MaxLen = 16
        },

        -- Zorluk puanı SADECE kazanan (won) kuponlara verilir:
        --   puan = max(MinPoints, round(Base * total_odd^OddWeight * maçSayısı^CountWeight))
        --   -> oran ne kadar yüksekse (kazanması zor) o kadar çok puan
        --   -> maç sayısı ne kadar fazlaysa o kadar çok puan
        Points = {
            Base = 10, -- taban çarpan
            OddWeight = 1.0, -- oran (zorluk) ağırlığı
            CountWeight = 0.5, -- maç sayısı ağırlığı
            MinPoints = 1 -- kazanan kupon en az bu kadar puan alır
        }
    },
    Webhook = GetConvar('app_webhook', '')
}

App.ApiBase = GetConvar('app_api_base', '')
App.AggrBase = GetConvar('app_aggr_base', '')
App.ApiHeaders = {
    ['Referer'] = GetConvar('app_api_referer', ''),
    ['Origin'] = GetConvar('app_api_origin', ''),
    ['Accept'] = 'application/json',
    ['User-Agent'] = 'Mozilla/5.0'
}
