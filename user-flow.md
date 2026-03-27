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
11. **Paylaşım ve Sosyal Etkileşim:**
    - Kullanıcı, sonuç ekranında veya sınav bitiminde "Çalışma Grubuna Gönder" butonuna tıklar.
    - Uygulama, o analize ait özel bir URL oluşturur ve "Link başarıyla kopyalandı! Discord veya WhatsApp grubuna yapıştırabilirsin 🚀" bildirimiyle panoya kopyalar.
    - Kullanıcı, sınav skorunu veya kritik dakikaları tek tıkla arkadaşlarıyla paylaşır.
## Hata Durumları
- Geçersiz link → "Lütfen geçerli bir YouTube linki girin"
- API hatası → "Bir sorun oluştu, tekrar deneyin"
- Çok uzun video (2 saat+) → "Video 2 saatten kısa olmalı"
