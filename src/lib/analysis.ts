import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey ="AIzaSyCHk_cv4OuHtxFLoNm_3UtXNvj6qbtq_nk"
const ai = new GoogleGenerativeAI(apiKey);

export async function runGeminiAnalysis(transcriptFormatted: string) {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Sen üniversite öğrencilerine sınav hazırlığında yardımcı olan bir asistansın.
Aşağıda bir YouTube ders videosunun zaman damgalı transkripti var.

Görevin:
1) Ana fikirleri özetle
2) "Sınav sorusu potansiyeli" taşıyan veya özellikle üzerinde durulan kısımları işaretle
3) Tüm içeriğe göre zorluk seviyesini belirle (kolay/orta/zor)
4) 5 adet çoktan seçmeli sınav sorusu üret

Transkript:
${transcriptFormatted}

SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "summary": "genel özet buraya",
  "criticalMoments": [
    {"timestamp": "00:00", "title": "konu başlığı", "reason": "neden önemli"}
  ],
  "difficulty": "kolay",
  "questions": [
    {
      "question": "soru metni",
      "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
      "correct": 0,
      "timestamp": "00:00"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Gemini yanıtı:", text);

    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);

  } catch (error) {
    console.error("HATA DETAYI:", error);
    throw new Error(`Analiz hatası: ${error}`);
  }
}