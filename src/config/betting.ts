export const BETTING = {
  // Maç başlamadan bu kadar ÖNCE bahis kapanır (liste + kupon).
  cutoffLeadMs: 15 * 60 * 1000, // 15 dk

  // Otorite SUNUCU (server/config.lua). Bunlar sadece UI clamp/gösterim içindir; eşit tut.
  maxMisli: 20000,
  maxSelections: 20,
  maxWin: 12_500_000,
}