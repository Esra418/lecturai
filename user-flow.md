# Lecturai — User Flow

## İlk Giriş Akışı (Onboarding)

1. Kullanıcı uygulamayı ilk kez açar
2. Onboarding ekranı karşılar:
   - Adım 1: İsim gir
   - Adım 2: Bölüm gir (Tıp, Hukuk, YKS vb.)
   - Adım 3: Sınav tarihi seç
3. "Koçumu Başlat" butonuna tıklar
4. Ana sayfaya yönlendirilir (sınava kaç gün kaldığı hesaplanır)

---

## Ana Akış

1. Kullanıcı ana sayfayı açar (ismi ve Dashboard linki görünür)
2. YouTube ders videosu linkini giriş kutusuna yapıştırır
3. "Analiz Et" butonuna tıklar
4. Yükleniyor ekranı görür (5 adımlı animasyon):
   - Video transkripti alınıyor
   - İçerik analiz ediliyor
   - Kritik dakikalar tespit ediliyor
   - Ders notları hazırlanıyor
   - Sınav soruları üretiliyor
5. Sonuç ekranı 4 sekmeli açılır

---

## Sekme Akışları

### 📖 Ders Notları
1. Bölüm başlıkları + tıklanabilir timestamp'ler görünür
2. Kullanıcı bölüme tıklar → YouTube o saniyeden açılır
3. Anahtar kavramlar ve terimler görünür
4. "PDF İndir" butonuna tıklar → ders notu PDF olarak indirilir

### 🔥 Kritik Dakikalar
1. Konu geçişleri ve sınav vurguları listelenir
2. Her madde tıklanabilir → YouTube o saniyeden açılır

### 🎯 Sınav
1. Soru sayısı seçilir (1-20, slider veya yazarak)
2. Zorluk seviyesi seçilir (Kolay / Orta / Zor / Karışık)
3. "Sınavı Başlat" butonuna tıklar
4. Her soruyu cevaplar:
   - Doğruysa → yeşil, açıklama gösterilir, sonraki soru
   - Yanlışsa → kırmızı, açıklama gösterilir, "Bu konuya git →" butonu çıkar
5. Sınav biter → skor ekranı görünür
6. Yanlış konular listelenir
7. "Yanlış Konulardan Yeni Sorular" butonuna tıklar (3 hak)
8. Gemini yeni sorular üretir → tekrar sınav başlar

### 💬 AI Koç
1. Koç selamlama mesajıyla başlar
2. Kullanıcı video hakkında soru sorar
3. Çalışma programı ister → koç sınav tarihini baz alarak plan yapar
4. Sınav stratejisi ister → koç zayıf konulara göre öneri verir

---

## Dashboard Akışı

1. Sağ üstteki "Dashboard" butonuna tıklar
2. Dashboard açılır:
   - Streak (günlük çalışma serisi) görünür
   - İstatistik kartları: video sayısı, quiz sayısı, başarı oranı
   - Zayıf konular analizi
   - AI koçtan günlük öneri
   - Son analiz edilen videolar
   - Son çözülen sınavlar
3. "Yeni Video Analiz Et" butonuyla ana sayfaya döner

---

## Hata Durumları

- Geçersiz link → "Lütfen geçerli bir YouTube linki girin"
- Altyazısız video → "Bu videoda altyazı bulunamadı. Lütfen altyazısı olan bir video deneyin"
- API hatası → "Bir sorun oluştu, tekrar deneyin"
- Gemini limit → "Bir sorun oluştu, tekrar deneyin"
