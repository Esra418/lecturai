# Lecturai — Tech Stack

## Teknolojiler

### Frontend
- **Next.js 16** — React tabanlı, hızlı web uygulaması, App Router
- **Tailwind CSS** — Modern, mobil uyumlu tasarım
- **TypeScript** — Tip güvenli kod

### AI & API
- **Gemini 2.5 Flash (Google AI Studio)** — Video transkripti analizi, ders notu üretimi, quiz üretimi, AI koç
- **RapidAPI YouTube Transcript API** — YouTube video transkripti çekme (Türkçe dahil tüm diller)

### Veri Saklama
- **localStorage** — Kullanıcı profili, video geçmişi, quiz sonuçları, streak verisi (hesap gerekmez)

### Deploy
- **Vercel** — Next.js için en uyumlu platform, otomatik GitHub deploy

### Araçlar
- **Cursor** — AI destekli kod editörü (agent modu)
- **GitHub** — Versiyon kontrolü ve teslim
- **Claude (Anthropic)** — Kod geliştirme ve mimari kararlar

## Neden Bu Seçimler?

| Teknoloji | Neden? |
|-----------|--------|
| Gemini 2.5 Flash | Ücretsiz, güçlü analiz, uzun transkript desteği |
| RapidAPI Transcript | Vercel'den YouTube'a erişim sorunu çözdü, Türkçe çalışıyor |
| Next.js 16 | Vercel ile direkt uyumlu, App Router ile API route'ları kolay |
| Tailwind CSS | Cursor ile hızlı UI üretimi, mobil uyumlu |
| localStorage | Hesap gerektirmeden kişiselleştirme, sıfır backend maliyeti |
| Vercel | Tek tıkla deploy, GitHub entegrasyonu, ücretsiz |

## API Anahtarları
- **Gemini:** aistudio.google.com → "Get API Key" → ücretsiz (günlük 50 istek)
- **RapidAPI:** rapidapi.com → "Youtube Transcript" → ücretsiz plan (aylık 100 istek)

## Environment Variables
```
GEMINI_API_KEY=your_gemini_key
RAPIDAPI_KEY=your_rapidapi_key
```
