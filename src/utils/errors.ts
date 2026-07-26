// Sunucu (coupons/server/bulletin) ve köprü hata kodları → oyuncuya Türkçe mesaj
const MESSAGES: Record<string, string> = {
  // hız / bağlantı
  rate_limited: "Çok hızlısın 🕒 Birkaç saniye sonra tekrar dene.",
  timeout: "İstek zaman aşımına uğradı. Tekrar dene.",
  http_error: "Sunucuya ulaşılamadı. Bağlantını kontrol et.",
  forbidden_path: "İzin verilmeyen istek.",
  srv_error: "Sunucu hatası. Tekrar dene.",

  // bakiye / oynama
  insufficient_funds: "Yetersiz bakiye 💸",
  charge_failed: "Ödeme alınamadı, tekrar dene.",
  db_error: "İşlem tamamlanamadı, tekrar dene.",
  no_identifier: "Oyuncu doğrulanamadı.",

  // kupon geçerliliği
  invalid_input: "Geçersiz istek.",
  invalid_misli: "Geçersiz misli değeri.",
  invalid_bets: "Geçersiz kupon.",
  invalid_count: "Kupon maç sayısı sınır dışında.",
  invalid_selection: "Geçersiz bahis seçimi.",
  duplicate_event: "Aynı maçtan birden fazla seçim olamaz.",

  // maç / market durumu
  event_not_found: "Maç bulunamadı.",
  betting_closed: "Bu maçın oynanma süresi doldu ⏰",
  market_not_found: "Bu bahis türü bulunamadı.",
  market_not_allowed: "Bu bahis türü oynanamaz.",
  market_closed: "Bu bahis kapandı.",
  outcome_closed: "Bu oran kapandı, güncel oranı kontrol et.",

  // limitler
  odd_too_high: "Toplam oran izin verilen sınırın üstünde.",
  stake_too_high: "Kupon bedeli maksimum sınırı aşıyor.",
  win_too_high: "Maksimum kazanç sınırını aşıyor.",

  // MBS
  mbs_not_met: "MBS sağlanmadı: bu maç için kombinasyon yeterli değil.",

  // sistem
  system_min_selections: "Sistem için en az 3 maç gerekir.",
  system_needs_nonbanko: "Sistem için en az 2 banko-dışı maç gerekir.",
  invalid_sizes: "Bir sistem boyutu seç.",
  invalid_size: "Geçersiz sistem boyutu.",
  invalid_combos: "Geçersiz sistem kombinasyonu.",

  // silme
  not_deletable: "Bu kupon silinemez (bekleyen kuponlar silinemez).",
  unknown_action: "Bilinmeyen işlem.",
}

export function errorText(code: string): string {
  return MESSAGES[code] ?? "Bir hata oluştu. Lütfen tekrar dene."
}

// Error/objeden kodu çıkarıp mesaja çevirir
export function errorMessage(e: unknown): string {
  const code = e instanceof Error ? e.message : String(e ?? "")
  return errorText(code.trim())
}