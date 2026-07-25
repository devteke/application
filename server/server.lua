local API_BASE = GetConvar('app_api_base', '')
local API_REFERER = GetConvar('app_api_referer', '')
local API_ORIGIN = GetConvar('app_api_origin', '')

local API_HEADERS = {
  ['Referer']    = API_REFERER,
  ['Origin']     = API_ORIGIN,
  ['Accept']     = 'application/json',
  ['User-Agent'] = 'Mozilla/5.0',
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