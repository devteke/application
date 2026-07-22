import type { MenuItem, PlayerData } from '../types'

// Placeholder data used only during browser development.
export const mockPlayer: PlayerData = {
	name: 'Caps Capiks',
	cash: 5230,
	bank: 18400,
	job: 'Mechanic',
}

export const mockMenuItems: MenuItem[] = [
	{ id: 'inventory', label: 'Envanter', icon: '\uD83C\uDF92' },
	{ id: 'garage', label: 'Garaj', icon: '\uD83D\uDE97' },
	{ id: 'phone', label: 'Telefon', icon: '\uD83D\uDCF1' },
	{ id: 'settings', label: 'Ayarlar', icon: '\u2699\uFE0F' },
]
