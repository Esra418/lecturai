# Lecturai — Product Requirements Document (PRD)

## Genel Bakış
Lecturai, başta YKS (TYT/AYT) hazırlık öğrencileri ve üniversite öğrencilerinin
YouTube ders videolarını hızlıca analiz etmesini sağlayan AI destekli bir web
uygulamasıdır. Kullanıcı bir link yapıştırır; Lecturai hangi dakikayı izleyeceğini,
sınava çıkması muhtemel konuları, kişisel sınav sorularını ve gelişim istatistiklerini
60 saniyede sunar.

## Kullanıcı Hikayesi
"Sınava 2 gün kaldı. 3 saatlik bir ders videosu var.
Lecturai'a linki yapıştırıyorum, kritik dakikaları görüyorum,
tıklıyorum — direkt o konuya atlıyorum. Sonra 20 soruluk sınav çözüyorum,
yanlış yaptıklarımdan yeni sorular üretiyor. AI koçum sınav stratejimi planlıyor."

## Özellikler

### 1. Kişiselleştirme (Onboarding)
- İlk girişte kullanıcıdan isim, bölüm ve sınav tarihi alınır
- Sınava kaç gün kaldığı otomatik hesaplanır
- Tüm veriler localStorage'da saklanır, hesap gerekmez

### 2. Video Analizi
- Kullanıcı YouTube linki girer (Türkçe dahil her dil)
- RapidAPI ile video transkripti çekilir
- Gemini 2.5 Flash ile analiz yapılır

### 3. Akıllı Ders Notları
- Bölüm bazlı ders notları otomatik oluşturulur
- Her bölüm videonun ilgili saniyesine bağlanır (deep-link)
- Anahtar kavramlar ve terimler sözlüğü
- PDF olarak indirilebilir

### 4. Kritik Dakika Tespiti
- Yeni konu başlangıçları tespit edilir
- Sınavda çıkabilecek kritik noktalar işaretlenir
- Tıkla → video tam o andan başlar

### 5. Kişiselleştirilmiş Sınav Simülatörü
- 1-20 arası soru sayısı seçilebilir
- Zorluk seviyesi seçilebilir: Kolay / Orta / Zor / Karışık
- Her sorudan sonra açıklama gösterilir
- Yanlış cevapta "Bu konuya git →" butonu

### 6. Yanlış Konulardan Yeni Soru Üretimi
- Sınav bitince yanlış yapılan konular tespit edilir
- Gemini o konulardan tamamen yeni sorular üretir
- Maximum 3 tur hakkı

### 7. AI Öğrenci Koçu
- Video içeriğine özel sorular sorulabilir
- Çalışma programı yapılabilir
- Sınav stratejisi alınabilir
- Quiz sonuçlarına göre kişiselleştirilmiş tavsiye

### 8. Kişisel Dashboard
- Analiz edilen video sayısı
- Toplam doğru/yanlış istatistikleri
- Günlük çalışma serisi (streak) takibi
- En zayıf konular analizi
- AI koçundan günlük öneri

## Ekranlar

### Onboarding Ekranı
- 3 adımlı kurulum: isim, bölüm, sınav tarihi
- Sınava kaç gün kaldığı gösterilir

### Ana Ekran
- Kullanıcı adı ve Dashboard linki
- YouTube link giriş kutusu
- "Analiz Et" butonu
- AI koç ipuçları

### Sonuç Ekranı (4 sekme)
- Ders Notları — bölümler, terimler, sonuç
- Kritik Dakikalar — tıklanabilir timestamp listesi
- Sınav — soru sayısı/zorluk seçimi, quiz, yeniden quiz
- AI Koç — sohbet arayüzü

### Dashboard Ekranı
- İstatistik kartları
- Streak banner
- Zayıf konular
- AI koç önerisi
- Son videolar ve sınavlar

## Teknik Gereksinimler
- Frontend: Next.js 16 + Tailwind CSS
- AI: Gemini 2.5 Flash (Google AI Studio)
- Transkript: RapidAPI YouTube Transcript API
- Deploy: Vercel
- Veri saklama: localStorage (hesap gerektirmez)

## Başarı Kriteri
- Kullanıcı linki yapıştırır, 60 saniyede sonuç alır
- Türkçe videolar sorunsuz çalışır
- Kritik dakika tespiti isabetli
- Sınav soruları videodaki konularla örtüşür
- Mobilde sorunsuz çalışır
- Dashboard gerçek ilerlemeyi yansıtır

## Kapsam Dışı (v2 — Premium)
- Google/GitHub ile kullanıcı girişi
- Bulut tabanlı veri senkronizasyonu
- PDF/doküman analizi
- Notion / Anki entegrasyonu
- Çoklu video karşılaştırma
- Sınıf/grup çalışma modu
