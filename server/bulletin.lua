App = App or {}
local Bulletin, cache = {}, { at = 0, byEvent = {} }

-- NUI'daki pick etiketleriyle BİREBİR aynı (settle bunlara bakıyor)
local LABELS = {
  [1]   = { [1]='1',   [2]='X',   [3]='2'   },  -- Maç Sonucu
  [92]  = { [1]='1-X', [2]='1-2', [3]='X-2' },  -- Çifte Şans
  [100] = { [1]='1',   [2]='X',   [3]='2'   },  -- Handikaplı MS
  [101] = { [1]='Alt', [2]='Üst'             },  -- Alt/Üst
}
local ALLOWED = { [1]=true, [92]=true, [100]=true, [101]=true } -- sadece MatchList marketleri

local function rebuild(events)
  local byEvent = {}
  for _, ev in ipairs(events or {}) do
    local markets = {}
    for _, m in ipairs(ev.m or {}) do
      local outs = {}
      for _, o in ipairs(m.o or {}) do outs[o.on] = o end
      markets[m.i] = { i = m.i, sbt = m.sbt, ov = m.ov, n = m.n, st = m.st, o = outs }
    end
    local name = ev.n
    if (not name or name == '') and ev.p then
      local t = {}; for _, x in ipairs(ev.p) do t[#t+1] = x.n end; name = table.concat(t, ' - ')
    end
    byEvent[ev.i] = { i = ev.i, li = ev.li or ev.i, d = ev.d, name = name, st = ev.st, markets = markets }
  end
  cache.byEvent, cache.at = byEvent, GetGameTimer()
end

function Bulletin.refresh(force)
  if not force and (GetGameTimer() - cache.at) < App.Config.BulletinTTL then return true end
  local res = App.Http.get(App.Config.BulletinPath)
  if res.ok and res.body and res.body.data and res.body.data.e then rebuild(res.body.data.e); return true end
  return false
end

-- Seçimi doğrula, GÜNCEL oranı döndür. now = epoch ms.
function Bulletin.resolve(eventId, marketId, on, now)
  Bulletin.refresh(false)
  local ev = cache.byEvent[eventId]
  if not ev then return nil, 'event_not_found' end
  if (ev.d - App.Config.CutoffLeadMs) <= now then return nil, 'betting_closed' end
  local m = ev.markets[marketId]
  if not m then return nil, 'market_not_found' end
  if not ALLOWED[m.sbt] then return nil, 'market_not_allowed' end     -- whitelist
  if m.st and m.st ~= 'OPEN' then return nil, 'market_closed' end
  local o = m.o[on]
  if not o or type(o.od) ~= 'number' or o.od <= 1 then return nil, 'outcome_closed' end
  local ov
  if m.ov ~= nil then ov = tonumber((tostring(m.ov):gsub(',', '.'))) end
  return {
    eventId = ev.i, statId = ev.li, name = ev.name, startsAt = ev.d,
    marketId = m.i, marketName = m.n, sbt = m.sbt, ov = ov,
    on = on, pick = (LABELS[m.sbt] or {})[on] or tostring(on),
    odd = o.od,   -- OTORİTER ORAN (client'ınki yok sayılır)
  }, nil
end

App.Bulletin = Bulletin