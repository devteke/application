export interface PlayerData {
	name: string
	cash: number
	bank: number
	job: string
}

export interface MenuItem {
	id: string
	label: string
	icon?: string
	disabled?: boolean
}
