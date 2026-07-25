local API_BASE = GetConvar('app_api_base', '')
local API_REFERER = GetConvar('app_api_referer', '')
local API_ORIGIN = GetConvar('app_api_origin', '')

local API_HEADERS = {
    ['Referer'] = API_REFERER,
    ['Origin'] = API_ORIGIN,
    ['Accept'] = 'application/json',
    ['User-Agent'] = 'Mozilla/5.0'
}

RegisterNetEvent('app:apiGet', function(reqId, path)
    local src = source
    if API_BASE == '' or type(path) ~= 'string' or path:sub(1, 5) ~= '/api/' then
        TriggerClientEvent('app:apiResult', src, reqId, false, 'bad_config_or_path')
        return
    end
    PerformHttpRequest(API_BASE .. path, function(status, body)
        TriggerClientEvent('app:apiResult', src, reqId, status == 200, body or '')
    end, 'GET', '', API_HEADERS)
end)

App = App or {}

function App.log(level, msg)
    print(('[betting][%s] %s'):format(level, msg))
    if App.Config.Webhook ~= '' then
        PerformHttpRequest(App.Config.Webhook, function()
        end, 'POST', json.encode({
            content = ('`[%s]` %s'):format(level, msg)
        }), {
            ['Content-Type'] = 'application/json'
        })
    end
end

-- Genel NUI RPC: NUI sadece niyet gönderir, server doğrular
local rpcCd = {}
RegisterNetEvent('app:srv', function(reqId, action, payload)
    local src = source
    if type(reqId) ~= 'number' or type(action) ~= 'string' then
        return
    end
    local now = GetGameTimer()
    if rpcCd[src] and now < rpcCd[src] then
        TriggerClientEvent('app:srvResult', src, reqId, false, 'rate_limited');
        return
    end
    rpcCd[src] = now + App.Config.RpcCooldownMs
    CreateThread(function()
        local ok, data
        if action == 'placeCoupon' then
            ok, data = App.Coupons.place(src, payload)
        elseif action == 'listCoupons' then
            ok, data = App.Coupons.list(src)
        else
            ok, data = false, 'unknown_action'
        end
        TriggerClientEvent('app:srvResult', src, reqId, ok, data)
    end)
end)

-- Read-only API proxy: path whitelist + anti-flood
local ALLOWED = {'/api/web/v1/sportsbook/', '/api/web/v2/sportsbook/', '/api/web/v1/statistics/'}
local function pathOk(p)
    for _, pre in ipairs(ALLOWED) do
        if p:sub(1, #pre) == pre then
            return true
        end
    end
    return false
end

local apiCd = {}
RegisterNetEvent('app:apiGet', function(reqId, path)
    local src = source
    if type(reqId) ~= 'number' or type(path) ~= 'string' or not pathOk(path) then
        TriggerClientEvent('app:apiResult', src, reqId, false, 'forbidden_path');
        return
    end
    local now = GetGameTimer()
    if apiCd[src] and now < apiCd[src] then
        TriggerClientEvent('app:apiResult', src, reqId, false, 'rate_limited');
        return
    end
    apiCd[src] = now + App.Config.ApiCooldownMs
    PerformHttpRequest(App.ApiBase .. path, function(status, body)
        TriggerClientEvent('app:apiResult', src, reqId, status == 200, body or '')
    end, 'GET', '', App.ApiHeaders)
end)

CreateThread(function()
    App.Bulletin.refresh(true)
end) -- açılışta ısıt
AddEventHandler('playerDropped', function()
    local s = source;
    rpcCd[s] = nil;
    apiCd[s] = nil
end)
