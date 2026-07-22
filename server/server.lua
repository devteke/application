-- Backend goes here (next step).
--
-- Golden rule: never trust the client. Re-validate every payload that
-- arrives from a client event before acting on it or writing to the DB.

-- Example skeleton for later:
-- RegisterNetEvent('fivem-nui:selectItem', function(itemId)
-- 	local src = source
-- 	if type(itemId) ~= 'string' then return end
-- 	-- validate: does this player own/allowed this action?
-- end)

print('[fivem-nui] server resource started')
