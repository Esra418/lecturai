# 🎓 Lecturai — AI Study Companion

> YouTube ders videolarındaki kritik dakikaları saniyeler içinde bul, o ana atla ve sınava odaklan.

🔗 **Canlı Site:** [lecturai-jade.vercel.app](https://lecturai-jade.vercel.app)  
🎬 **Demo Video:** *(yakında eklenecek)*

---

## 💡 Problem

Üniversite öğrencileri sınava hazırlıkta 2+ saatlik YouTube ders videolarını baştan sona izlemek zorunda kalıyor. Videonun yalnızca birkaç kritik dakikası sınav konusunu içeriyor — ama hangi dakika olduğunu bilmiyorlar. Zaman kaybı, motivasyon düşüşü ve verimsiz çalışma döngüsü.

---

## 🚀 Çözüm

Lecturai, YouTube ders videosu linkini yapıştırınca **60 saniyede** şunları sunar:

### 📖 Akıllı Ders Notları
- Videonun içeriğinden otomatik bölüm bazlı ders notları
- Her bölüm için tıklanabilir timestamp — direkt o dakikaya atla
- Anahtar kavramlar ve terimler sözlüğü
- PDF olarak indir

### 🔥 Kritik Dakikalar
- Yeni konu başlangıçlarını otomatik tespit eder
- Sınavda çıkabilecek kritik noktaları işaretler
- Tıkla, direkt o dakikaya git

### 🎯 Kişiselleştirilmiş Sınav Simülatörü
- 1-20 arası soru sayısı seç
- Zorluk seviyesi seç: Kolay / Orta / Zor / Karışık
- Her sorudan sonra açıklama göster
- Yanlış yaptığın konulardan **otomatik yeni sorular üret** (3 tur hakkı)

### 💬 AI Öğrenci Koçu
- Video içeriğine özel sorular sor
- Çalışma programı yaptır
- Sınav stratejisi al
- Quiz sonuçlarına göre kişiselleştirilmiş tavsiye

### 📊 Kişisel Dashboard
- Analiz edilen video sayısı
- Toplam doğru/yanlış istatistikleri
- Günlük çalışma serisi (streak) takibi
- En zayıf konular analizi
- AI koçundan günlük öneri

### 👤 Kişiselleştirme
- İlk girişte onboarding: isim, bölüm, sınav tarihi
- Sınava kaç gün kaldığını otomatik hesapla
- Tüm veriler cihazda saklanır, hesap gerekmez

---

## 🛠 Kullanılan Teknolojiler

| Teknoloji | Kullanım Amacı |
|-----------|---------------|
| **Next.js 16** | Frontend framework |
| **Tailwind CSS** | UI tasarımı |
| **Gemini 2.5 Flash (Google AI)** | Video analizi, quiz üretimi, AI koç |
| **RapidAPI YouTube Transcript** | Video transkripti çekme |
| **Vercel** | Deploy ve hosting |
| **localStorage** | Kullanıcı verisi saklama |
| **Cursor** | AI destekli kod editörü |
| **Claude (Anthropic)** | Kod geliştirme ve mimari |

---

## ⚙️ Nasıl Çalıştırılır?

```bash
# 1. Repoyu klonla
git clone https://github.com/Esra418/lecturai.git
cd lecturai/features

# 2. Bağımlılıkları yükle
npm install

# 3. Environment variables oluştur
cp .env.example .env
# .env dosyasına ekle:
# GEMINI_API_KEY=senin_gemini_keyin
# RAPIDAPI_KEY=senin_rapidapi_keyin

# 4. Geliştirme sunucusunu başlat
npm run dev
```

---

## 📁 Proje Yapısı

```
features/
├── app/
│   ├── page.tsx              # Ana sayfa
│   ├── dashboard/page.tsx    # Kullanıcı dashboard'u
│   ├── onboarding/page.tsx   # İlk giriş ekranı
│   └── api/
│       ├── analyze/route.ts  # Video analiz API
│       ├── chat/route.ts     # AI koç API
│       └── requiz/route.ts   # Yeniden quiz API
├── lib/
│   ├── gemini/analysis.ts    # Gemini AI entegrasyonu
│   ├── transcript.ts         # YouTube transkript
│   ├── storage.ts            # localStorage yönetimi
│   └── youtube.ts            # YouTube URL parser
```

---

## 🎯 Başarı Kriterleri

Öğrenci YouTube linkini yapıştırıp **60 saniyede**:
- ✅ Videonun tüm ders notlarına sahip olur
- ✅ Kritik dakikaları tek tıkla izler
- ✅ Sınav soruları çözer
- ✅ Yanlış konulardan yeni sorular üretir
- ✅ AI koçuna soru sorar
- ✅ Gelişimini dashboard'dan takip eder

---

## 👩‍💻 Geliştirici

**Esra Karakök** — AI Buildathon 2025
