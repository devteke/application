App = App or {}
local Http = {}

-- CreateThread/coroutine içinde çağrılmalı. Sadece /api/ yollarına izin verir.
function Http.get(path)
  local p = promise.new()
  if App.ApiBase == '' or type(path) ~= 'string' or path:sub(1, 5) ~= '/api/' then
    p:resolve({ ok = false, status = 0, body = nil })
    return Citizen.Await(p)
  end
  PerformHttpRequest(App.ApiBase .. path, function(status, body)
    local data
    if status == 200 and body and body ~= '' then
      local okd, dec = pcall(json.decode, body)
      if okd then data = dec end
    end
    p:resolve({ ok = (status == 200 and data ~= nil), status = status, body = data })
  end, 'GET', '', App.ApiHeaders)
  return Citizen.Await(p)
end

App.Http = Http