export interface LeftMenuResponse {
	success: boolean
	data: SportCategory[]
}

// Spor (Futbol, Basketbol, ...)
export interface SportCategory {
	i: number // spor id
	st: string // spor anahtarı: SOCCER, BASKETBALL, E_FOOTBALL, ...
	n: string // görünen ad
	p: number // sıra (öncelik)
	t: number // toplam sayı
	c: CountryCategory[] // ülkeler
}

// Ülke / bölge
export interface CountryCategory {
	i: string // ülke kodu (NO, FI, INT, ...)
	n: string // ülke adı
	p: number
	t: number
	ip?: string // logo/bayrak — ŞİMDİLİK KULLANILMIYOR (placeholder)
	c: LeagueCategory[] // ligler
}

// Lig / turnuva
export interface LeagueCategory {
	i: number // lig id
	p: number
	sn?: string // kısa ad (bazılarında yok)
	n: string // lig adı
	c?: string // kod (bazılarında yok)
	t: number
}