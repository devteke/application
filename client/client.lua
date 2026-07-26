local isOpen = false

--- Toggles NUI focus + visibility together to avoid input lock bugs.
local function setVisible(state)
    isOpen = state
    SetNuiFocus(state, state)
    SendNUIMessage({
        action = 'setVisible',
        data = state
    })
end

--- Example: push player data to the NUI when opening.
local function openMenu()
    if isOpen then
        return
    end

    -- TODO (backend): fetch real data from the server instead of this stub.
    SendNUIMessage({
        action = 'setPlayer',
        data = {
            name = GetPlayerName(PlayerId()),
            cash = 5230,
            bank = 18400,
            job = 'Mechanic'
        }
    })

    setVisible(true)
end

RegisterCommand('menu', function()
    openMenu()
end, false)

-- Optional keybind (players can rebind in settings).
RegisterKeyMapping('menu', 'NUI menusunu ac', 'keyboard', 'F5')

----------------------------------------------------------------------
-- NUI callbacks (NUI -> client). Always call cb, even on error.
----------------------------------------------------------------------

RegisterNUICallback('closeMenu', function(_, cb)
    setVisible(false)
    cb({
        ok = true
    })
end)

RegisterNUICallback('selectItem', function(data, cb)
    -- Validate input coming from the NUI. Never trust it blindly.
    if type(data) ~= 'table' or type(data.id) ~= 'string' then
        cb({
            ok = false,
            error = 'invalid_input'
        })
        return
    end

    print(('[fivem-nui] selected: %s'):format(data.id))
    -- TODO (backend): TriggerServerEvent here; server re-validates.
    cb({
        ok = true
    })
end)

RegisterNUICallback('apiGet', function(data, cb)
    if type(data) ~= 'table' or type(data.path) ~= 'string' or type(data.reqId) ~= 'number' then
        cb({ ok = false, error = 'invalid_input' })
        return
    end
    local base = (type(data.base) == 'string') and data.base or 'api'
    TriggerServerEvent('app:apiGet', data.reqId, data.path, base)
    cb({ ok = true })
end)

RegisterNetEvent('app:apiResult', function(reqId, ok, body)
    SendNUIMessage({
        action = 'apiResult',
        data = {
            reqId = reqId,
            ok = ok,
            body = body
        }
    })
end)

RegisterNUICallback('srv', function(data, cb)
    if type(data) ~= 'table' or type(data.reqId) ~= 'number' or type(data.action) ~= 'string' then
        cb({
            ok = false,
            error = 'invalid_input'
        });
        return
    end
    TriggerServerEvent('app:srv', data.reqId, data.action, data.payload)
    cb({
        ok = true
    }) -- sonuç app:srvResult ile dönecek
end)

RegisterNetEvent('app:srvResult', function(reqId, ok, data)
    SendNUIMessage({
        action = 'srvResult',
        data = {
            reqId = reqId,
            ok = ok,
            data = data
        }
    })
end)

RegisterNetEvent('app:setPlayer', function(player)
    SendNUIMessage({
        action = 'setPlayer',
        data = player
    }) -- gerçek bakiye server'dan
end)
