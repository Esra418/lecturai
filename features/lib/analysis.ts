import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY ortam değişkeni tanımlı değil.");
}

const ai = new GoogleGenAI({ apiKey });

/** Gemini'den gelen ham metni JSON objesine dönüştürür. */
function extractJSON(raw: string): any {
  // 1) Markdown code block varsa temizle
  let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  // 2) İlk { ile başla
  const start = text.indexOf("{");
  if (start > 0) text = text.slice(start);

  // 3) Kontrol karakterlerini temizle (\n \t hariç)
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");

  // 4) Direkt parse dene
  try {
    return JSON.parse(text);
  } catch {
    // 5) Depth sayacıyla son geçerli } bul
    let depth = 0;
    let lastClose = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) { lastClose = i; break; }
      }
    }
    if (lastClose > 0) {
      const sliced = text.slice(0, lastClose + 1);
      try {
        return JSON.parse(sliced);
      } catch {
        // 6) Bozuk string'leri düzelt: kapatılmamış " içindeki newline'ları escape et
        const fixed = sliced
          .replace(/:\s*"((?:[^"\\]|\\.)*)(?=[,\}\]])/g, (_m, p1) =>
            ': "' + p1.replace(/\n/g, "\\n").replace(/\r/g, "") + '"'
          );
        try {
          return JSON.parse(fixed);
        } catch {
          throw new Error("JSON parse edilemedi: " + fixed.slice(0, 200));
        }
      }
    }
    throw new Error("Geçerli JSON bloğu bulunamadı.");
  }
}

export async function runGeminiAnalysis(transcriptFormatted: string) {
  try {
    const prompt = `Sen deneyimli bir üniversite hocasısın. Aşağıda bir YouTube ders videosunun zaman damgalı transkripti var.
Öğrencinin elinde kaliteli bir ders notu olması için aşağıdaki görevi eksiksiz yap.

Transkript:
${transcriptFormatted}

SADECE şu JSON formatında yanıt ver. Başka hiçbir şey yazma, markdown kullanma, açıklama ekleme.
Tüm string değerler tek satırda olmalı — newline karakteri içermemeli.
Türkçe karakter kullanabilirsin ama JSON yapısını bozma.

{
  "summary": "Videonun genel özeti (2-3 cümle)",
  "studyNotes": {
    "title": "Dersin başlığı",
    "sections": [
      {
        "heading": "Bölüm başlığı",
        "content": "Bu bölümün detaylı açıklaması. Öğrenci bu notu okuyunca konuyu anlayabilmeli.",
        "keyPoints": ["Anahtar nokta 1", "Anahtar nokta 2", "Anahtar nokta 3"],
        "timestamp": "MM:SS"
      }
    ],
    "importantTerms": [
      {"term": "Terim adı", "definition": "Terimin kısa açıklaması"}
    ],
    "conclusion": "Dersin genel sonucu ve öğrenciye tavsiyeler"
  },
  "criticalMoments": [
    {"timestamp": "MM:SS", "title": "Konu başlığı", "reason": "Neden önemli, sınavda çıkabilir mi"}
  ],
  "difficulty": "kolay",
  "questions": [
    {
      "question": "Soru metni",
      "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
      "correct": 0,
      "timestamp": "MM:SS"
    }
  ]
}`;

    const response = await ai.models.generateContent({
     model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.2,
      },
    });

    const text = response.text ?? "";
    const parsed = extractJSON(text);

    if (parsed.criticalMoments) {
      parsed.criticalMoments = parsed.criticalMoments.map((m: any) => {
        const parts = (m.timestamp ?? "0:00").split(":");
        const seconds =
          parts.length === 2
            ? parseInt(parts[0]) * 60 + parseInt(parts[1])
            : parseInt(parts[0]);
        return { ...m, startSeconds: isNaN(seconds) ? 0 : seconds };
      });
    }

    if (parsed.studyNotes?.sections) {
      parsed.studyNotes.sections = parsed.studyNotes.sections.map((s: any) => {
        const parts = (s.timestamp ?? "0:00").split(":");
        const seconds =
          parts.length === 2
            ? parseInt(parts[0]) * 60 + parseInt(parts[1])
            : parseInt(parts[0]);
        return { ...s, startSeconds: isNaN(seconds) ? 0 : seconds };
      });
    }

    return parsed;
  } catch (error) {
    console.error("GEMINI HATA DETAYI:", error);
    throw error;
  }
}
