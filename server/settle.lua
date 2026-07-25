App = App or {}
local S = {}

local function o1x2(h, a) if h > a then return '1' elseif h < a then return '2' else return 'X' end end
local function goals(team)
  if not team or not team.s then return nil end
  local g = team.s.r            -- REGÜLASYON (90dk) — bahis buna göre; penaltı/uzatma sayılmaz
  if g == nil then g = team.s.c end
  if type(g) ~= 'number' then return nil end
  return g
end

-- 'won' | 'lost' | 'void' | 'pending'
function S.bet(bet, stat)
  if not stat then return 'pending' end
  local st = string.upper(stat.s or '')
  if st == 'CANCELLED' or st == 'POSTPONED' then return 'void' end
  if st ~= 'ENDED' then return 'pending' end
  local h, a = goals(stat.ht), goals(stat.at)
  if h == nil or a == nil then return 'pending' end

  local sbt = bet.sbt
  if sbt == 1 then
    return o1x2(h, a) == bet.pick and 'won' or 'lost'
  elseif sbt == 92 then
    local r, win = o1x2(h, a), ({
      ['1-X'] = { ['1']=true, ['X']=true },
      ['1-2'] = { ['1']=true, ['2']=true },
      ['X-2'] = { ['X']=true, ['2']=true },
    })[bet.pick] or {}
    return win[r] and 'won' or 'lost'
  elseif sbt == 100 then
    return o1x2(h + (bet.ov or 0), a) == bet.pick and 'won' or 'lost'  -- handikap ev sahibine
  elseif sbt == 101 then
    local line, total = bet.ov or 0, h + a
    if total == line then return 'void' end
    local isUst = (bet.pick == 'Üst')
    return ((total > line) == isUst) and 'won' or 'lost'
  end
  return 'pending'
end

-- KOMBİNE sonucu
function S.coupon(perBet)
  local lost, pending, won = false, false, 0
  for _, r in ipairs(perBet) do
    if r == 'lost' then lost = true
    elseif r == 'pending' then pending = true
    elseif r == 'won' then won = won + 1 end
  end
  if lost then return 'lost' end
  if pending then return 'pending' end
  if won == 0 then return 'void' end
  return 'won'
end

function S.settledOdd(bets, perBet)  -- void => 1.00
  local odd = 1.0
  for i, b in ipairs(bets) do if perBet[i] == 'won' then odd = odd * b.odd end end
  return odd
end

-- Elementer simetrik polinomlar: e[0..#odds]. e[k] = tüm k'li alt kümelerin çarpım toplamı.
function S.esp(odds)
  local e = { [0] = 1.0 }
  local m = #odds
  for j = 1, m do e[j] = 0.0 end
  for _, x in ipairs(odds) do
    for j = m, 1, -1 do e[j] = e[j] + e[j - 1] * x end
  end
  return e
end

-- SİSTEM sonucu: banko her kombinasyonda; k-boyutlu banko-dışı kombinasyonlar.
-- Dönüş: payout(number), status('won'|'lost'|'void')
function S.system(bets, perBet, sizes, misli)
  local bankoEff, anyBankoLost = 1.0, false
  local surv, allVoid = {}, true
  for i, b in ipairs(bets) do
    local res = perBet[i]
    if res ~= 'void' then allVoid = false end
    if b.banko then
      if res == 'lost' then anyBankoLost = true
      elseif res == 'won' then bankoEff = bankoEff * b.odd end
      -- void => *1
    else
      if res == 'won' then surv[#surv + 1] = b.odd
      elseif res == 'void' then surv[#surv + 1] = 1.0 end
      -- lost => hiçbir kombinasyonda kalamaz
    end
  end

  if anyBankoLost then return 0, 'lost' end     -- banko düştüyse tüm kombinasyonlar düşer

  local e = S.esp(surv)
  local sum = 0.0
  for _, k in ipairs(sizes) do
    local ek = e[k]
    if ek then sum = sum + ek end             -- k > hayatta kalan sayısı => 0
  end

  local payout = math.floor(misli * bankoEff * sum + 0.5)
  if payout <= 0 then return 0, 'lost' end
  if allVoid then return payout, 'void' end     -- hepsi iade => bedel iadesi
  return payout, 'won'
end

App.Settle = S