# Lecturai — idea.md

## Problem
Üniversite öğrencileri sınav hazırlığında 2+ saatlik ders videolarını
baştan sona izlemek zorunda kalıyor. Videonun yalnızca birkaç dakikası
aradıkları konuyu içeriyor, ancak hangi dakika olduğunu bilmiyorlar.
Zaman kaybı, motivasyon düşüşü ve verimsiz çalışma döngüsü.

## Kullanıcı
Başta YKS (TYT/AYT) hazırlık öğrencileri ve üniversite öğrencileri.
YouTube'dan ders izleyen, zamanı kısıtlı, akıllı çalışmak isteyen Z kuşağı.

## AI'ın Rolü
1. YouTube linkindeki video transkriptini RapidAPI ile çeker.
2. Gemini 2.5 Flash ile transkripti analiz ederek bölüm bazlı ders notları üretir.
3. Kritik konu geçişlerini ve sınavda çıkabilecek noktaları tespit eder.
4. Her bölümü videonun ilgili saniyesine bağlayan deep-link navigasyon oluşturur.
5. Kullanıcının seçtiği zorluk ve sayıda sınav sorusu üretir.
6. Yanlış yapılan konulardan otomatik yeni sorular üretir (3 tur).
7. Video içeriğine özel AI koç olarak öğrencinin sorularını yanıtlar.
8. Çalışma programı yapar, sınav stratejisi önerir.

## Rakip Durum
| Araç | Eksik yön |
|------|-----------|
| Eightify | Yüzeysel 8 madde, timestamp zayıf, öğrenciye özel değil |
| NoteGPT | Her şeyi yapıyor ama hiçbirinde uzmanlaşmamış |
| Snipd | Sadece podcast, video desteği yok |
| TubeOnAI | Zaman damgası navigasyonu yok, quiz yok |

**Lecturai'ın farkı:** Rakiplerin hiçbirinde olmayan özellikler:
- Kritik dakika tespiti (konu geçişleri + sınav vurguları)
- Tıklanabilir timestamp deep-link navigasyon
- Zorluk ve sayı seçilebilir sınav simülatörü
- Yanlış konulardan otomatik yeni soru üretimi (3 tur)
- Video içeriğine özel AI öğrenci koçu
- Kişisel dashboard (streak, istatistik, zayıf konu analizi)
- Onboarding ile kişiselleştirme (isim, bölüm, sınav tarihi)
- PDF indirme

## Başarı Kriteri
Öğrenci YouTube linkini yapıştırır; 60 saniye içinde:
- Tüm ders notlarına sahip olur
- Kritik dakikaları tek tıkla izler
- Kişiselleştirilmiş sınav soruları çözer
- Yanlış konulardan yeni sorular üretir
- AI koçuna soru sorar
- Gelişimini dashboard'dan takip eder
