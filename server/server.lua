App = App or {}

-- Konsol + opsiyonel Discord webhook log
function App.log(level, msg)
  print(('[betting][%s] %s'):format(level, msg))
  if App.Config.Webhook ~= '' then
    PerformHttpRequest(App.Config.Webhook, function() end, 'POST',
      json.encode({ content = ('`[%s]` %s'):format(level, msg) }),
      { ['Content-Type'] = 'application/json' })
  end
end

-- ============ Genel NUI RPC (NUI niyet gönderir, server doğrular) ============
local rpcCd = {}
RegisterNetEvent('app:srv', function(reqId, action, payload)
  local src = source
  if type(reqId) ~= 'number' or type(action) ~= 'string' then return end
  local now = GetGameTimer()
  if rpcCd[src] and now < rpcCd[src] then
    TriggerClientEvent('app:srvResult', src, reqId, false, 'rate_limited'); return
  end
  rpcCd[src] = now + App.Config.RpcCooldownMs
  CreateThread(function()
    App.Economy.claimPending(src) -- birikmiş offline ödemeleri yatır
    local ok, data
    if     action == 'placeCoupon' then ok, data = App.Coupons.place(src, payload)
    elseif action == 'listCoupons' then ok, data = App.Coupons.list(src)
    else   ok, data = false, 'unknown_action' end
    TriggerClientEvent('app:srvResult', src, reqId, ok, data)
  end)
end)

-- ============ Read-only API proxy (TEK handler) ============
local ALLOWED = { '/api/web/v1/sportsbook/', '/api/web/v2/sportsbook/', '/api/web/v1/statistics/' }
local function pathOk(p)
  for _, pre in ipairs(ALLOWED) do
    if p:sub(1, #pre) == pre then return true end
  end
  return false
end

local apiCd = {}
RegisterNetEvent('app:apiGet', function(reqId, path)
  local src = source
  if type(reqId) ~= 'number' or type(path) ~= 'string' or not pathOk(path) then
    TriggerClientEvent('app:apiResult', src, reqId, false, 'forbidden_path'); return
  end
  local now = GetGameTimer()
  if apiCd[src] and now < apiCd[src] then
    TriggerClientEvent('app:apiResult', src, reqId, false, 'rate_limited'); return
  end
  apiCd[src] = now + App.Config.ApiCooldownMs
  PerformHttpRequest(App.ApiBase .. path, function(status, body)
    if status ~= 200 then
      App.log('warn', ('apiGet status=%s path=%s body=%s'):format(status, path, tostring(body):sub(1, 200)))
    end
    TriggerClientEvent('app:apiResult', src, reqId, status == 200, body or '')
  end, 'GET', '', App.ApiHeaders)
end)

-- Açılışta bülteni ısıt
CreateThread(function() App.Bulletin.refresh(true) end)

-- Temizlik
AddEventHandler('playerDropped', function()
  local s = source
  rpcCd[s] = nil
  apiCd[s] = nil
end)

-- Qbox: oyuncu yüklenince bekleyen ödemeleri dene
AddEventHandler('QBCore:Server:PlayerLoaded', function(player)
  local src = player and player.PlayerData and player.PlayerData.source
  if src then
    CreateThread(function()
      Wait(2000)
      App.Economy.claimPending(src)
    end)
  end
end)