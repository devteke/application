fx_version 'cerulean'
game 'gta5'

author 'Caps Capiks'
description 'FiveM NUI (React + TypeScript + Vite)'
version '0.1.0'

-- Served UI. Run `npm run build` first so ./build exists.
ui_page 'build/index.html'

client_scripts {
	'client/client.lua',
}

server_scripts {
	'server/server.lua',
}

files {
	'build/index.html',
	'build/**/*',
}
