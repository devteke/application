fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'Caps Capiks'
description 'FiveM Betting NUI'
version '0.2.0'

ui_page 'build/index.html'

client_scripts { 'client/client.lua' }

server_scripts {
  '@oxmysql/lib/MySQL.lua',
  'server/config.lua',
  'server/http.lua',
  'server/economy.lua',
  'server/bulletin.lua',
  'server/settle.lua',
  'server/coupons.lua',
  'server/server.lua',
}

files { 'build/index.html', 'build/**/*' }