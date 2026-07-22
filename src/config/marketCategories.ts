export interface Category {
  key: string
  label: string
  codes: number[]   // market sbt kodları
}

// Sıra = "Tümü" görünümündeki kart sırası
export const CATEGORIES: Category[] = [
  { key: "ms",      label: "Maç Sonucu", codes: [1, 92, 100, 90, 88, 36, 77, 69, 72, 11] },
  { key: "au",      label: "Alt/Üst",    codes: [101, 60, 603, 604, 722, 723, 729, 730] },
  { key: "gol",     label: "Goller",     codes: [4, 89, 87, 91, 719, 720, 821, 861, 862, 866, 6, 84, 85] },
  { key: "skor",    label: "Skor",       codes: [86, 717, 718] },
  { key: "kombine", label: "Kombine",    codes: [7, 698, 699, 700, 724] },
]

const CODE_TO_CAT = new Map<number, string>()
for (const c of CATEGORIES) for (const code of c.codes) CODE_TO_CAT.set(code, c.key)

// Tanınmayan kodlar (ör. ileride gelen Korner/Kart) otomatik "Diğer"e düşer
export function categoryOf(sbt: number): string {
  return CODE_TO_CAT.get(sbt) ?? "diger"
}