# Lecturai 🎓

## Problem
Üniversite öğrencileri sınava hazırlıkta 2+ saatlik ders videolarını baştan sona izlemek zorunda kalıyor. Videonun yalnızca birkaç dakikası aradıkları konuyu içeriyor, ancak hangi dakika olduğunu bilmiyorlar.

## Çözüm
Lecturai, YouTube ders videosunun linkini yapıştırınca 60 saniyede şunları sunar:
- 📍 Tıklanabilir timestamp'lerle bölüm bazlı ders notları
- 🔥 "Sınav sorusu potansiyeli" etiketli kritik dakikalar
- 🎯 Kişiselleştirilmiş sınav simülatörü (soru sayısı ve zorluk seçilebilir)
- 💬 Video içeriğine özel AI koç sohbeti

## Canlı Demo
Yayın Linki: (yakında eklenecek)
Demo Video: (yakında eklenecek)

## Kullanılan Teknolojiler
- **Next.js + Tailwind CSS** — Frontend
- **Gemini API (Google AI Studio)** — Video analizi ve AI koç
- **Vercel** — Deploy
- **Cursor** — AI destekli kod editörü
- **Claude (Anthropic)** — Kod geliştirme ve mimari kararlar
- **ChatGPT (OpenAI)** — Fikir geliştirme ve araştırma
- **Loom** — Demo video
- **GitHub** — Versiyon kontrolü

## Nasıl Çalıştırılır?
1. Repoyu klonla
2. `npm install` çalıştır
3. `.env` dosyası oluştur, `GEMINI_API_KEY=senin_keyin` ekle
4. `npm run dev` ile başlaturai
AI-powered video &amp; podcast summarizer for students
