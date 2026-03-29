import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY ortam değişkeni tanımlı değil.");
}

const ai = new GoogleGenAI({ apiKey });

/** Gemini'den gelen ham metni JSON objesine dönüştürür. */
function extractJSON(raw: string): any {
  let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const start = text.indexOf("{");
  if (start > 0) text = text.slice(start);
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");

  try {
    return JSON.parse(text);
  } catch {
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
        const fixed = sliced.replace(/:\s*"((?:[^"\\]|\\.)*)(?=[,\}\]])/g, (_m, p1) =>
          ': "' + p1.replace(/\n/g, "\\n").replace(/\r/g, "") + '"'
        );
        return JSON.parse(fixed);
      }
    }
    throw new Error("Geçerli JSON bloğu bulunamadı.");
  }
}

function postProcess(parsed: any) {
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
}

const JSON_SCHEMA = `{
  "summary": "Videonun genel özeti (2-3 cümle)",
  "studyNotes": {
    "title": "Dersin başlığı",
    "sections": [
      {
        "heading": "Bölüm başlığı",
        "content": "Bu bölümün detaylı açıklaması. Öğrenci bu notu okuyunca konuyu anlayabilmeli.",
        "keyPoints": ["Anahtar nokta 1", "Anahtar nokta 2"],
        "timestamp": "MM:SS"
      }
    ],
    "importantTerms": [
      {"term": "Terim adı", "definition": "Kısa açıklama"}
    ],
    "conclusion": "Dersin genel sonucu ve öğrenciye tavsiyeler"
  },
  "criticalMoments": [
    {"timestamp": "MM:SS", "title": "Konu başlığı", "reason": "Neden önemli"}
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

/**
 * Gemini'ye doğrudan YouTube URL'si vererek analiz yaptırır.
 * Transkript çekmeye gerek yok — Gemini videoyu kendisi izler.
 */
export async function runGeminiAnalysis(youtubeUrl: string) {
  try {
    const prompt = `Sen deneyimli bir üniversite hocasısın. Aşağıdaki YouTube ders videosunu izle ve öğrencinin elinde kaliteli bir ders notu olması için analiz et.

Video URL: ${youtubeUrl}

SADECE şu JSON formatında yanıt ver. Başka hiçbir şey yazma, markdown kullanma, açıklama ekleme.
Tüm string değerler tek satırda olmalı — newline karakteri içermemeli.
Türkçe karakter kullanabilirsin ama JSON yapısını bozma.
Timestamp değerleri videodaki gerçek dakika:saniye bilgilerini yansıtmalı.

${JSON_SCHEMA}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: "video/youtube",
                fileUri: youtubeUrl,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.2,
      },
    });

    const text = response.text ?? "";
    const parsed = extractJSON(text);
    return postProcess(parsed);
  } catch (error) {
    console.error("GEMINI HATA DETAYI:", error);
    throw error;
  }
}
