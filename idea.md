# Lecturai — idea.md

## Problem
Üniversite öğrencileri sınav hazırlığında 2+ saatlik ders videolarını
baştan sona izlemek zorunda kalıyor. Videonun yalnızca birkaç dakikası
aradıkları konuyu içeriyor, ancak hangi dakika olduğunu bilmiyorlar.

## Kullanıcı
Vize ve final sınavına hazırlanan üniversite öğrencileri (Z kuşağı).
Bilgiyi hızlı tüketmek isteyen, telefon ve dizüstü bilgisayar kullanan,
zamanı kısıtlı öğrenciler.

## AI'ın Rolü
1. Kullanıcının yapıştırdığı YouTube linkindeki sesi Gemini API ile
   metne dönüştürür ve zaman damgaları (timestamp) üretir.
2. Transkripti analiz ederek "Burası sınavda çıkar", "Bunu unutmayın"
   gibi vurguları tespit eder ve "Kritik Dakika" (Semantic Highlight) etiketi ekler.
3. Her özet maddesini videonun ilgili saniyesine bağlayan deep-link
   navigasyon oluşturur.
4. Videodan 5 soruluk kişiselleştirilmiş sınav simülatörü üretir;
   yanlış cevaplarda kullanıcıyı doğrudan ilgili videoya yönlendirir.

## Rakip Durum
| Araç | Eksik yön |
|------|-----------|
| Eightify | Yüzeysel 8 madde, timestamp zayıf, öğrenciye özel değil |
| NoteGPT | Her şeyi yapıyor ama hiçbirinde uzmanlaşmamış |
| Snipd | Sadece podcast, video desteği yok |
| TubeOnAI | Zaman damgası navigasyonu yok |

**Lecturai'ın farkı:** Rakiplerin hiçbirinde olmayan üç özellik —
Kritik Dakika tespiti, tıklanabilir timestamp deep-link ve
video bazlı sınav simülatörü.

## Başarı Kriteri
Öğrenci YouTube linkini yapıştırır; 60 saniye içinde hangi dakikayı
izleyeceğini, sınava çıkması muhtemel konuları ve kendine özel 5
soruyu görür.
