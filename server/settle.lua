App = App or {}
local S = {}

local function o1x2(h, a) if h > a then return '1' elseif h < a then return '2' else return 'X' end end
local function goals(team)
  if not team or not team.s then return nil end
  local g = team.s.r            -- REGÜLASYON (90dk) skoru — bahis buna göre; penaltı/uzatma sayılmaz
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
    if total == line then return 'void' end                            -- tam baraj => iade
    local isUst = (bet.pick == 'Üst')
    return ((total > line) == isUst) and 'won' or 'lost'
  end
  return 'pending'
end

function S.coupon(perBet)
  local lost, pending, won, void = false, false, 0, 0
  for _, r in ipairs(perBet) do
    if r == 'lost' then lost = true
    elseif r == 'pending' then pending = true
    elseif r == 'won' then won = won + 1
    elseif r == 'void' then void = void + 1 end
  end
  if lost then return 'lost' end
  if pending then return 'pending' end
  if won == 0 then return 'void' end   -- hepsi iade
  return 'won'
end

function S.settledOdd(bets, perBet)  -- void => 1.00
  local odd = 1.0
  for i, b in ipairs(bets) do if perBet[i] == 'won' then odd = odd * b.odd end end
  return odd
end

App.Settle = S