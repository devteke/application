App = App or {}
local S = {}

local function o1x2(h, a) if h > a then return '1' elseif h < a then return '2' else return 'X' end end
local function goals(team)
  if not team or not team.s then return nil end
  local g = team.s.r            -- REGÜLASYON (90dk) — bahis buna göre
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
    return o1x2(h + (bet.ov or 0), a) == bet.pick and 'won' or 'lost'
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

-- Elementer simetrik polinomlar: e[0..#vals]. e[k] = tüm k'li alt kümelerin çarpım toplamı.
function S.esp(vals)
  local e = { [0] = 1.0 }
  local m = #vals
  for j = 1, m do e[j] = 0.0 end
  for _, x in ipairs(vals) do
    for j = m, 1, -1 do e[j] = e[j] + e[j - 1] * x end
  end
  return e
end

-- SİSTEM sonucu (MBS-duyarlı): kombinasyon toplam boyutu T = B + k; o kombinasyondaki
-- HER bacak (banko dahil) mbs <= T olmalı. Ödeme yalnız MBS-geçerli kombinasyonlardan.
-- bets: her leg { odd, result('won'|'lost'|'void'), mbs, banko }
-- Dönüş: payout(number), status('won'|'lost'|'void')
function S.system(bets, sizes, misli)
  local bankos, nb = {}, {}
  for _, b in ipairs(bets) do
    if b.banko then bankos[#bankos + 1] = b else nb[#nb + 1] = b end
  end
  local B = #bankos

  -- Banko: biri kaybettiyse tüm kombinasyonlar düşer; won => çarpan, void => *1
  local bankoEff = 1.0
  for _, b in ipairs(bankos) do
    if b.result == 'lost' then return 0, 'lost' end
    if b.result == 'won' then bankoEff = bankoEff * b.odd end
  end

  local sawWon, sawLost = false, false
  for _, b in ipairs(bets) do
    if b.result == 'won' then sawWon = true
    elseif b.result == 'lost' then sawLost = true end
  end

  local total, anyValid = 0.0, false
  for _, k in ipairs(sizes or {}) do
    local T = B + k
    -- Banko MBS: hepsi mbs<=T olmalı, değilse bu boyut komple iptal
    local bankoOk = true
    for _, b in ipairs(bankos) do
      if (b.mbs or 1) > T then bankoOk = false break end
    end
    if bankoOk then
      -- Uygun banko-dışı bacaklar: mbs<=T. Kaybedenler kombinasyondan hariç.
      local vals, eligCount = {}, 0
      for _, b in ipairs(nb) do
        if (b.mbs or 1) <= T then
          eligCount = eligCount + 1
          if b.result == 'won' then vals[#vals + 1] = b.odd
          elseif b.result == 'void' then vals[#vals + 1] = 1.0 end
          -- lost => hariç
        end
      end
      if eligCount >= k then
        anyValid = true
        local e = S.esp(vals)
        local ek = e[k] or 0.0
        if ek > 0 then total = total + bankoEff * ek end
      end
    end
  end

  if not anyValid then return 0, 'lost' end
  local payout = math.floor(total * (misli or 0) + 0.5)
  if payout <= 0 then return 0, 'lost' end
  if not sawWon and not sawLost then return payout, 'void' end  -- hepsi void => iade
  return payout, 'won'
end

App.Settle = S