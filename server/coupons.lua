App = App or {}
local Coupons, cd = {}, {}

local function onCooldown(src, key, ms)
  local now = GetGameTimer(); cd[src] = cd[src] or {}
  if cd[src][key] and now < cd[src][key] then return true end
  cd[src][key] = now + ms; return false
end
local function newId() return ('%d-%06d'):format(os.time(), math.random(0, 999999)) end

local function nCk(n, k)
  if k < 0 or k > n then return 0 end
  if k == 0 or k == n then return 1 end
  k = math.min(k, n - k)
  local res = 1
  for i = 1, k do res = res * (n - k + i) // i end
  return res
end

-- === OYNAMA (kombine + sistem) ===
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

  local btype = (payload.type == 'system') and 'system' or 'combi'

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
    r.banko = (btype == 'system') and (b.banko == true) or false
    totalOdd = totalOdd * r.odd
    resolved[#resolved + 1] = r
  end

  local combos, cleanSizes, stake, maxWin

  if btype == 'system' then
    if n < 3 then return false, 'system_min_selections' end
    local M, bankoProd, nb = 0, 1.0, {}
    for _, r in ipairs(resolved) do
      if r.banko then bankoProd = bankoProd * r.odd else M = M + 1; nb[#nb + 1] = r.odd end
    end
    if M < 2 then return false, 'system_needs_nonbanko' end  -- en az 2 banko-dışı maç

    local sizes = payload.sizes
    if type(sizes) ~= 'table' or #sizes == 0 then return false, 'invalid_sizes' end
    local seenK = {}
    cleanSizes, combos = {}, 0
    for _, k in ipairs(sizes) do
      if type(k) ~= 'number' or k ~= math.floor(k) or k < 1 or k > M then return false, 'invalid_size' end
      if not seenK[k] then
        seenK[k] = true
        cleanSizes[#cleanSizes + 1] = k
        combos = combos + nCk(M, k)
      end
    end
    if combos < 1 then return false, 'invalid_combos' end

    local e = App.Settle.esp(nb)
    local sum = 0.0
    for _, k in ipairs(cleanSizes) do sum = sum + (e[k] or 0) end
    stake  = misli * combos * App.Config.UnitPrice
    maxWin = math.floor(misli * bankoProd * sum + 0.5)
  else
    if App.Config.MaxOdd > 0 and totalOdd > App.Config.MaxOdd then return false, 'odd_too_high' end
    combos = 1
    stake  = misli * App.Config.UnitPrice
    maxWin = math.floor(stake * totalOdd + 0.5)
  end

  if App.Config.MaxStake > 0 and stake  > App.Config.MaxStake then return false, 'stake_too_high' end
  if App.Config.MaxWin   > 0 and maxWin > App.Config.MaxWin   then return false, 'win_too_high' end

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
      banko = r.banko or nil,
    }
  end

  local meta = json.encode({ type = btype, sizes = cleanSizes, combos = combos })

  local ok = pcall(function()
    MySQL.insert.await(
      'INSERT INTO betting_coupons (id,identifier,misli,stake,total_odd,max_win,status,bets,meta,created_at) '
      .. 'VALUES (?,?,?,?,?,?,?,?,?,?)',
      { id, ident, misli, stake, totalOdd, maxWin, 'pending', json.encode(bets), meta, now })
  end)
  if not ok then
    App.Economy.addMoney(src, stake, 'bahis-iade')
    return false, 'db_error'
  end

  App.log('info', ('%s %s kupon açtı %s stake=%d combos=%d'):format(ident, btype, id, stake, combos))
  return true, { id = id, stake = stake, totalOdd = totalOdd, maxWin = maxWin, combos = combos }
end

-- === LİSTELEME (yalnız gizlenmemiş) ===
function Coupons.list(src)
  local ident = App.Economy.identifier(src)
  if not ident then return false, 'no_identifier' end
  local rows = MySQL.query.await(
    'SELECT id,misli,stake,total_odd,max_win,status,payout,bets,meta,created_at,settled_at '
    .. 'FROM betting_coupons WHERE identifier = ? AND hidden = 0 ORDER BY created_at DESC LIMIT 100', { ident }) or {}
  local out = {}
  for _, r in ipairs(rows) do
    local meta = r.meta and json.decode(r.meta) or nil
    out[#out + 1] = {
      id        = r.id,
      misli     = tonumber(r.misli) or 0,
      bedel     = tonumber(r.stake) or 0,
      totalOdd  = tonumber(r.total_odd) or 0,
      maxWin    = tonumber(r.max_win) or 0,
      status    = r.status,
      payout    = tonumber(r.payout) or 0,
      createdAt = tonumber(r.created_at) or 0,
      betType   = meta and meta.type or 'combi',
      sizes     = meta and meta.sizes or nil,
      combos    = meta and meta.combos or 1,
      bets      = json.decode(r.bets),
    }
  end
  return true, out
end

-- === SİLME (yalnız kendi + SONUÇLANMIŞ; soft-delete) ===
function Coupons.delete(src, payload)
  if type(payload) ~= 'table' or type(payload.id) ~= 'string' or payload.id == '' then
    return false, 'invalid_input'
  end
  local ident = App.Economy.identifier(src)
  if not ident then return false, 'no_identifier' end
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
    "SELECT id,identifier,misli,stake,bets,meta FROM betting_coupons WHERE status='pending' LIMIT 200", {}) or {}
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
    local bets, perBet, pending = json.decode(r.bets), {}, false
    for i, b in ipairs(bets) do
      perBet[i] = App.Settle.bet(b, stats[b.statId])
      if perBet[i] == 'pending' then pending = true end
      b.result = perBet[i]
    end

    if not pending then
      local meta   = r.meta and json.decode(r.meta) or { type = 'combi' }
      local stake  = tonumber(r.stake) or 0
      local result, payout

      if meta.type == 'system' then
        payout, result = App.Settle.system(bets, perBet, meta.sizes or {}, tonumber(r.misli) or 0)
      else
        result = App.Settle.coupon(perBet)
        payout = 0
        if result == 'won'  then payout = math.floor(stake * App.Settle.settledOdd(bets, perBet) + 0.5)
        elseif result == 'void' then payout = stake end
      end

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