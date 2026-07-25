App = App or {}
local Coupons, cd = {}, {}

local function onCooldown(src, key, ms)
  local now = GetGameTimer(); cd[src] = cd[src] or {}
  if cd[src][key] and now < cd[src][key] then return true end
  cd[src][key] = now + ms; return false
end
local function newId() return ('%d-%06d'):format(os.time(), math.random(0, 999999)) end

-- === OYNAMA ===
function Coupons.place(src, payload)
  if onCooldown(src, 'place', App.Config.PlaceCooldownMs) then return false, 'rate_limited' end

  if type(payload) ~= 'table' then return false, 'invalid_input' end
  local misli = payload.misli
  if type(misli) ~= 'number' or misli ~= math.floor(misli) or misli < 1 or misli > App.Config.MaxMisli then
    return false, 'invalid_misli'
  end
  local sel = payload.bets
  if type(sel) ~= 'table' then return false, 'invalid_bets' end
  local n = #sel
  if n < App.Config.MinSelections or n > App.Config.MaxSelections then return false, 'invalid_count' end

  local now, resolved, seen, totalOdd = os.time() * 1000, {}, {}, 1.0
  for _, b in ipairs(sel) do
    if type(b) ~= 'table' or type(b.eventId) ~= 'number'
       or type(b.marketId) ~= 'number' or type(b.on) ~= 'number' then
      return false, 'invalid_selection'
    end
    if seen[b.eventId] then return false, 'duplicate_event' end
    seen[b.eventId] = true
    local r, err = App.Bulletin.resolve(b.eventId, b.marketId, b.on, now)
    if not r then return false, err end
    totalOdd = totalOdd * r.odd
    resolved[#resolved + 1] = r
  end

  if totalOdd > App.Config.MaxOdd then return false, 'odd_too_high' end
  local stake = misli * App.Config.UnitPrice
  if stake > App.Config.MaxStake then return false, 'stake_too_high' end
  local maxWin = math.floor(stake * totalOdd + 0.5)

  local ident = App.Economy.identifier(src)
  if not ident then return false, 'no_identifier' end

  if App.Economy.getMoney(src) < stake then
    App.log('warn', ('%s yetersiz bakiye (stake=%d)'):format(ident, stake))
    return false, 'insufficient_funds'
  end
  if not App.Economy.removeMoney(src, stake, 'bahis-kupon') then return false, 'charge_failed' end

  local id, bets = newId(), {}
  for _, r in ipairs(resolved) do
    bets[#bets + 1] = {
      eventId = r.eventId, statId = r.statId, name = r.name, startsAt = r.startsAt,
      marketId = r.marketId, marketName = r.marketName, sbt = r.sbt, ov = r.ov,
      on = r.on, pick = r.pick, odd = r.odd, sportType = 'SOCCER',
    }
  end
  local ok = pcall(function()
    MySQL.insert.await(
      'INSERT INTO betting_coupons (id,identifier,misli,stake,total_odd,max_win,status,bets,created_at) '
      .. 'VALUES (?,?,?,?,?,?,?,?,?)',
      { id, ident, misli, stake, totalOdd, maxWin, 'pending', json.encode(bets), now })
  end)
  if not ok then
    App.Economy.addMoney(src, stake, 'bahis-iade')
    return false, 'db_error'
  end

  App.log('info', ('%s kupon açtı %s stake=%d oran=%.2f'):format(ident, id, stake, totalOdd))
  return true, { id = id, stake = stake, totalOdd = totalOdd, maxWin = maxWin }
end

-- === LİSTELEME (yalnız gizlenmemiş) ===
function Coupons.list(src)
  local ident = App.Economy.identifier(src)
  if not ident then return false, 'no_identifier' end
  local rows = MySQL.query.await(
    'SELECT id,misli,stake,total_odd,max_win,status,payout,bets,created_at,settled_at '
    .. 'FROM betting_coupons WHERE identifier = ? AND hidden = 0 ORDER BY created_at DESC LIMIT 100', { ident }) or {}
  local out = {}
  for _, r in ipairs(rows) do
    out[#out + 1] = {
      id       = r.id,
      misli    = tonumber(r.misli) or 0,
      bedel    = tonumber(r.stake) or 0,
      totalOdd = tonumber(r.total_odd) or 0,
      maxWin   = tonumber(r.max_win) or 0,
      status   = r.status,
      payout   = tonumber(r.payout) or 0,
      createdAt = tonumber(r.created_at) or 0,
      bets     = json.decode(r.bets),
    }
  end
  return true, out
end

-- === SİLME (yalnız kendi + SONUÇLANMIŞ kuponlar; soft-delete) ===
function Coupons.delete(src, payload)
  if type(payload) ~= 'table' or type(payload.id) ~= 'string' or payload.id == '' then
    return false, 'invalid_input'
  end
  local ident = App.Economy.identifier(src)
  if not ident then return false, 'no_identifier' end
  -- pending (aktif bahis) silinemez; sadece won/lost/void gizlenir. Sahiplik zorunlu.
  local affected = MySQL.update.await(
    "UPDATE betting_coupons SET hidden = 1 "
    .. "WHERE id = ? AND identifier = ? AND status <> 'pending' AND hidden = 0",
    { payload.id, ident })
  if not affected or affected < 1 then return false, 'not_deletable' end
  App.log('info', ('%s kupon sildi (gizledi) %s'):format(ident, payload.id))
  return true, { id = payload.id }
end

-- === SONUÇLANDIRMA ===
local function settleOnce()
  local rows = MySQL.query.await(
    "SELECT id,identifier,stake,bets FROM betting_coupons WHERE status='pending' LIMIT 200", {}) or {}
  if #rows == 0 then return end

  local need = {}
  for _, r in ipairs(rows) do
    for _, b in ipairs(json.decode(r.bets)) do need[b.statId] = b.sportType or 'SOCCER' end
  end

  local stats = {}
  for statId, sport in pairs(need) do
    local override = MySQL.scalar.await('SELECT data FROM betting_stats_test WHERE stat_id = ?', { statId })
    if override then
      local okd, dec = pcall(json.decode, override)
      if okd and dec then stats[statId] = dec.data or dec end
    else
      local res = App.Http.get((App.Config.StatsPath):format(sport, statId))
      if res.ok and res.body and res.body.data then stats[statId] = res.body.data end
      Wait(150)
    end
  end

  for _, r in ipairs(rows) do
    local bets, perBet = json.decode(r.bets), {}
    for i, b in ipairs(bets) do
      perBet[i] = App.Settle.bet(b, stats[b.statId])
      b.result  = perBet[i]
    end
    local result = App.Settle.coupon(perBet)
    if result ~= 'pending' then
      local stake = tonumber(r.stake) or 0
      local payout = 0
      if result == 'won'  then payout = math.floor(stake * App.Settle.settledOdd(bets, perBet) + 0.5)
      elseif result == 'void' then payout = stake end
      if payout > 0 then App.Economy.payByIdentifier(r.identifier, payout, 'bahis-' .. result) end
      MySQL.update.await(
        "UPDATE betting_coupons SET status=?, payout=?, bets=?, settled_at=? WHERE id=? AND status='pending'",
        { result, payout, json.encode(bets), os.time() * 1000, r.id })
      App.log('info', ('kupon %s => %s payout=%d'):format(r.id, result, payout))
    end
  end
end

CreateThread(function()
  while true do
    Wait(App.Config.SettleIntervalMs)
    local ok, err = pcall(settleOnce)
    if not ok then App.log('error', 'settle: ' .. tostring(err)) end
  end
end)

App.Coupons = Coupons