App = App or {}
local E = {}
local qbx = exports.qbx_core
local MONEY = App.Config.MoneyType or 'bank'

-- Kimlik = citizenid (server'da türetilir, client'a güven yok)
function E.identifier(src)
  local player = qbx:GetPlayer(src)
  return player and player.PlayerData.citizenid or nil
end

function E.getMoney(src)
  local player = qbx:GetPlayer(src)
  if not player then return 0 end
  return player.PlayerData.money[MONEY] or 0
end

function E.removeMoney(src, amount, reason)
  if type(amount) ~= 'number' or amount <= 0 then return false end
  local player = qbx:GetPlayer(src)
  if not player then return false end
  return player.Functions.RemoveMoney(MONEY, amount, reason) == true
end

function E.addMoney(src, amount, reason)
  if type(amount) ~= 'number' or amount <= 0 then return false end
  local player = qbx:GetPlayer(src)
  if not player then return false end
  return player.Functions.AddMoney(MONEY, amount, reason) == true
end

-- Settlement ödemesi (citizenid bazlı; oyuncu offline olabilir)
function E.payByIdentifier(citizenid, amount, reason)
  if type(amount) ~= 'number' or amount <= 0 then return true end
  local online = qbx:GetPlayerByCitizenId(citizenid)
  if online then
    return online.Functions.AddMoney(MONEY, amount, reason or 'bahis-odeme') == true
  end
  MySQL.insert.await(
    'INSERT INTO betting_payouts (citizenid, amount, money_type, reason, created_at) VALUES (?,?,?,?,?)',
    { citizenid, math.floor(amount + 0.5), MONEY, reason or 'bahis-odeme', os.time() * 1000 })
  App.log('info', ('offline ödeme kuyruğa alındı: %s +%d'):format(citizenid, amount))
  return false
end

-- Biriken offline ödemeleri tahsil et
function E.claimPending(src)
  local cid = E.identifier(src)
  if not cid then return end
  local rows = MySQL.query.await(
    'SELECT id, amount, reason FROM betting_payouts WHERE citizenid = ? AND claimed = 0', { cid }) or {}
  for _, r in ipairs(rows) do
    if E.addMoney(src, r.amount, r.reason or 'bahis-odeme') then
      MySQL.update.await('UPDATE betting_payouts SET claimed = 1, claimed_at = ? WHERE id = ?',
        { os.time() * 1000, r.id })
      App.log('info', ('%s bekleyen ödeme aldı +%d (#%d)'):format(cid, r.amount, r.id))
    end
  end
end

App.Economy = E