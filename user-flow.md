# Lecturai — User Flow

## Ana Akış

1. Kullanıcı uygulamayı açar
2. YouTube ders videosu linkini giriş kutusuna yapıştırır
3. "Analiz Et" butonuna tıklar
4. Yükleniyor ekranı görür (Gemini API çalışıyor)
5. Sonuç ekranı açılır:
   - Bölüm başlıkları + tıklanabilir timestamp'ler
   - Kritik dakikalar (sınav sorusu potansiyeli etiketli)
   - Genel özet
6. Kullanıcı ilgilendiği bölüme tıklar → YouTube o saniyeden açılır
7. "Sınavı Başlat" butonuna tıklar
8. 5 soruluk test ekranı açılır
9. Her soruyu cevaplar:
   - Doğruysa → sonraki soru
   - Yanlışsa → "Bu konuya git →" butonu çıkar, o saniyeye yönlendirir
10. Test biter → skor ekranı görünür

## Hata Durumları
- Geçersiz link → "Lütfen geçerli bir YouTube linki girin"
- API hatası → "Bir sorun oluştu, tekrar deneyin"
- Çok uzun video (2 saat+) → "Video 2 saatten kısa olmalı"
