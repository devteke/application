App = App or {}

-- ============================================================
-- Log: konsol + opsiyonel Discord webhook
-- ============================================================
function App.log(level, msg)
    print(('[betting][%s] %s'):format(level, msg))
    if App.Config.Webhook and App.Config.Webhook ~= '' then
        PerformHttpRequest(App.Config.Webhook, function()
        end, 'POST', json.encode({
            content = ('`[%s]` %s'):format(level, msg)
        }), {
            ['Content-Type'] = 'application/json'
        })
    end
end

-- ============================================================
-- Genel NUI RPC: NUI sadece niyet gönderir, server doğrular
-- Anti-flood AKSİYON BAZLI (place ve list birbirini kilitlemez)
-- ============================================================
local rpcCd = {}
RegisterNetEvent('app:srv', function(reqId, action, payload)
    local src = source
    if type(reqId) ~= 'number' or type(action) ~= 'string' then
        return
    end

    local now = GetGameTimer()
    rpcCd[src] = rpcCd[src] or {}
    if rpcCd[src][action] and now < rpcCd[src][action] then
        TriggerClientEvent('app:srvResult', src, reqId, false, 'rate_limited')
        return
    end
    rpcCd[src][action] = now + App.Config.RpcCooldownMs

    CreateThread(function()
        App.Economy.claimPending(src) -- birikmiş offline ödemeleri yatır
        local ok, data
        if action == 'placeCoupon' then
            ok, data = App.Coupons.place(src, payload)
        elseif action == 'listCoupons' then
            ok, data = App.Coupons.list(src)
        elseif action == 'deleteCoupon' then
            ok, data = App.Coupons.delete(src, payload)
        elseif action == 'lbProfile' then
            ok, data = App.Leaderboard.profile(src)
        elseif action == 'lbRegister' then
            ok, data = App.Leaderboard.register(src, payload)
        elseif action == 'lbBoard' then
            ok, data = App.Leaderboard.board(src, payload)
        else
            ok, data = false, 'unknown_action'
        end
        TriggerClientEvent('app:srvResult', src, reqId, ok, data)
    end)
end)

-- ============================================================
-- Read-only API proxy (TEK handler)
-- Path whitelist + token-bucket (burst dostu anti-flood)
-- ============================================================
local ALLOWED = {'/api/web/v1/sportsbook/', '/api/web/v2/sportsbook/', '/api/web/v1/statistics/',
                 '/api/web/match-stats/'}

local function pathOk(p)
    for _, pre in ipairs(ALLOWED) do
        if p:sub(1, #pre) == pre then
            return true
        end
    end
    return false
end

local buckets = {}
local BUCKET_MAX = 25
local BUCKET_REFILL = 12

local function allowApi(src)
    local now = GetGameTimer()
    local b = buckets[src]
    if not b then
        b = {
            tokens = BUCKET_MAX,
            last = now
        }
        buckets[src] = b
    end
    b.tokens = math.min(BUCKET_MAX, b.tokens + ((now - b.last) / 1000) * BUCKET_REFILL)
    b.last = now
    if b.tokens < 1 then
        return false
    end
    b.tokens = b.tokens - 1
    return true
end

RegisterNetEvent('app:apiGet', function(reqId, path, base)
    local src = source
    if type(reqId) ~= 'number' or type(path) ~= 'string' or not pathOk(path) then
        TriggerClientEvent('app:apiResult', src, reqId, false, 'forbidden_path')
        return
    end
    if not allowApi(src) then
        TriggerClientEvent('app:apiResult', src, reqId, false, 'rate_limited')
        return
    end
    local root = App.ApiBase
    if base == 'aggr' then
        root = App.AggrBase
    end
    if not root or root == '' then
        App.log('warn', ('apiGet base=%s yapılandırılmamış (path=%s)'):format(tostring(base), path))
        TriggerClientEvent('app:apiResult', src, reqId, false, 'http_error')
        return
    end
    PerformHttpRequest(root .. path, function(status, body)
        if status ~= 200 then
            App.log('warn', ('apiGet status=%s path=%s'):format(tostring(status), path))
        end
        TriggerClientEvent('app:apiResult', src, reqId, status == 200, body or '')
    end, 'GET', '', App.ApiHeaders)
end)

-- ============================================================
-- Açılışta bülteni ısıt + temizlik + Qbox ödeme kurtarma
-- ============================================================
CreateThread(function()
    App.Bulletin.refresh(true)
end)

AddEventHandler('playerDropped', function()
    local s = source
    rpcCd[s] = nil
    buckets[s] = nil
end)

AddEventHandler('QBCore:Server:PlayerLoaded', function(player)
    local src = player and player.PlayerData and player.PlayerData.source
    if src then
        CreateThread(function()
            Wait(2000)
            App.Economy.claimPending(src)
        end)
    end
end)
