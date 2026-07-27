App = App or {}
local L = {}

-- === Dönem başlangıcı (ms epoch) ===
local function periodStartMs(period)
  if period == 'all' then return 0 end
  local now = os.time()
  local t = os.date('*t', now)
  local midnight = os.time({ year = t.year, month = t.month, day = t.day, hour = 0, min = 0, sec = 0 })
  if period == 'daily' then
    return midnight * 1000
  elseif period == 'weekly' then
    local daysFromMon = (t.wday + 5) % 7      -- Pazartesi = 0
    return (midnight - daysFromMon * 86400) * 1000
  elseif period == 'monthly' then
    return os.time({ year = t.year, month = t.month, day = 1, hour = 0, min = 0, sec = 0 }) * 1000
  elseif period == 'yearly' then
    return os.time({ year = t.year, month = 1, day = 1, hour = 0, min = 0, sec = 0 }) * 1000
  end
  return 0
end

local VALID_PERIODS = { daily = true, weekly = true, monthly = true, yearly = true, all = true }
local VALID_KINDS   = { net = true, winners = true, losers = true, points = true }

-- === Profil: oyuncunun kayıtlı ismi var mı? ===
function L.profile(src)
  local cid = App.Economy.identifier(src)
  if not cid then return false, 'no_identifier' end
  local name = MySQL.scalar.await('SELECT name FROM app_players WHERE citizenid = ?', { cid })
  return true, { name = name or nil }
end

-- === İsim kaydı (sign up) — tüm doğrulama sunucuda ===
local function sanitizeName(raw)
  if type(raw) ~= 'string' then return nil end
  return (raw:gsub('^%s+', ''):gsub('%s+$', ''):gsub('%s+', ' '))
end

function L.register(src, payload)
  if type(payload) ~= 'table' then return false, 'invalid_input' end
  local cid = App.Economy.identifier(src)
  if not cid then return false, 'no_identifier' end

  local cfg  = App.Config.Leaderboard.Name
  local name = sanitizeName(payload.name)
  if not name or name == '' then return false, 'invalid_name' end

  local len = utf8.len(name) or #name
  if len < cfg.MinLen or len > cfg.MaxLen then return false, 'name_length' end
  -- Harf, rakam, boşluk, . _ - ve Türkçe karakterler dışında izin yok
  if name:find('[^%w %._%-ğüşöçıİĞÜŞÖÇ]') then return false, 'name_charset' end

  -- Benzersizlik (büyük/küçük harf duyarsız)
  local taken = MySQL.scalar.await(
    'SELECT 1 FROM app_players WHERE LOWER(name) = LOWER(?) AND citizenid <> ? LIMIT 1',
    { name, cid })
  if taken then return false, 'name_taken' end

  local now = os.time() * 1000
  MySQL.insert.await(
    'INSERT INTO app_players (citizenid, name, created_at, updated_at) VALUES (?,?,?,?) '
    .. 'ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = VALUES(updated_at)',
    { cid, name, now, now })
  App.log('info', ('leaderboard: %s ismini kaydetti -> %s'):format(cid, name))
  return true, { name = name }
end

-- === Board (sıralama listesi) ===
function L.board(src, payload)
  if type(payload) ~= 'table' then return false, 'invalid_input' end
  local period, kind = payload.period, payload.kind
  if not VALID_PERIODS[period] then return false, 'invalid_period' end
  if not VALID_KINDS[kind]     then return false, 'invalid_kind' end

  local cid     = App.Economy.identifier(src)
  local startMs = periodStartMs(period)
  local limit   = App.Config.Leaderboard.TopLimit
  local anon    = App.Config.Leaderboard.AnonName
  local rows

  if kind == 'points' then
    local p = App.Config.Leaderboard.Points
    rows = MySQL.query.await(
      'SELECT c.identifier AS cid, COALESCE(pl.name, ?) AS name, '
      .. 'SUM(GREATEST(?, ROUND(? * POW(c.total_odd, ?) * POW(GREATEST(JSON_LENGTH(c.bets),1), ?)))) AS value, '
      .. 'COUNT(*) AS won_count '
      .. 'FROM betting_coupons c '
      .. 'LEFT JOIN app_players pl ON pl.citizenid = c.identifier '
      .. "WHERE c.status = 'won' AND c.settled_at >= ? "
      .. 'GROUP BY c.identifier '
      .. 'ORDER BY value DESC LIMIT ?',
      { anon, p.MinPoints, p.Base, p.OddWeight, p.CountWeight, startMs, limit }) or {}
  else
    -- Para: net kâr = SUM(payout) - SUM(stake)
    local order  = (kind == 'losers') and 'value ASC' or 'value DESC'
    local having = (kind == 'winners') and 'HAVING value > 0 '
               or  (kind == 'losers')  and 'HAVING value < 0 ' or ''
    rows = MySQL.query.await(
      'SELECT c.identifier AS cid, COALESCE(pl.name, ?) AS name, '
      .. 'SUM(c.payout) - SUM(c.stake) AS value, '
      .. 'SUM(c.stake) AS staked, SUM(c.payout) AS won_total '
      .. 'FROM betting_coupons c '
      .. 'LEFT JOIN app_players pl ON pl.citizenid = c.identifier '
      .. "WHERE c.status IN ('won','lost','void') AND c.settled_at >= ? "
      .. 'GROUP BY c.identifier '
      .. having
      .. 'ORDER BY ' .. order .. ' LIMIT ?',
      { anon, startMs, limit }) or {}
  end

  -- citizenid'yi CLIENT'A SIZDIRMA; sadece isim/değer/sıra/me gönder
  local out, self = {}, nil
  for i, r in ipairs(rows) do
    local me = (cid ~= nil and r.cid == cid)
    local row = {
      rank     = i,
      name     = r.name,
      value    = tonumber(r.value) or 0,
      wonCount = r.won_count and tonumber(r.won_count) or nil,
      me       = me or nil,
    }
    out[#out + 1] = row
    if me then self = row end
  end

  return true, { rows = out, self = self }
end

App.Leaderboard = L