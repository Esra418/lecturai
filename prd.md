# Lecturai — Product Requirements Document (PRD)

## Genel Bakış
Lecturai, üniversite öğrencilerinin YouTube ders videolarını ve
podcast'leri hızlıca analiz etmesini sağlayan AI destekli bir web
uygulamasıdır. Kullanıcı bir link yapıştırır, Lecturai hangi dakikayı
izleyeceğini, sınava çıkması muhtemel konuları ve kişisel sınav
sorularını 60 saniyede sunar.

## Kullanıcı Hikayesi
"Sınava 2 gün kaldı. 3 saatlik bir ders videosu var.
Lecturai'a linki yapıştırıyorum, kritik dakikaları görüyorum,
tıklıyorum — direkt o konuya atlıyorum."

## Özellikler

### 1. Video analizi (MVP çekirdeği)
- Kullanıcı YouTube linki girer
- Gemini API ses dosyasını metne çevirir
- Zaman damgalı transkript oluşturulur

### 2. Kritik dakika tespiti
- Gemini transkripti analiz eder
- "Burası sınavda çıkar", "Bunu unutmayın" gibi vurgular tespit edilir
- "Sınav Sorusu Potansiyeli" etiketiyle işaretlenir

### 3. Deep-link navigasyon
- Her özet maddesi videonun ilgili saniyesine bağlanır
- Tıkla → video tam o andan başlar

### 4. Sınav simülatörü
- Video bitiminde 5 soruluk kişisel test üretilir
- Yanlış cevapta kullanıcı o konunun anlatıldığı saniyeye yönlendirilir

## Ekranlar

### Ana ekran
- YouTube link giriş kutusu
- "Analiz Et" butonu

### Sonuç ekranı
- Bölüm başlıkları + her birine tıklanabilir timestamp
- Kritik dakikalar (kırmızı etiketli)
- Özet listesi

### Sınav ekranı
- 5 çoktan seçmeli soru
- Yanlış cevapta "Bu konuya git →" butonu

## Teknik Gereksinimler
- Frontend: Next.js + Tailwind CSS
- AI: Gemini API (ses-metin + analiz)
- Deploy: Vercel veya Lovable
- API anahtarı: Google AI Studio (ücretsiz)

## Başarı Kriteri
- Kullanıcı linki yapıştırır, 60 saniyede sonuç alır
- Kritik dakika tespiti doğruluk oranı yüksek
- Sınav soruları videodaki konularla örtüşüyor
- Mobilde sorunsuz çalışıyor

## Kapsam Dışı (v2)
- Whiteboard extractor
- Notion / Anki entegrasyonu
- Micro-learning kartlar
- Türkçe arayüz lokalizasyonu
