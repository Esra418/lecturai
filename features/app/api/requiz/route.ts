import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY ortam değişkeni tanımlı değil.");
}

const ai = new GoogleGenAI({ apiKey });

const bodySchema = z.object({
  wrongTopics: z.array(z.object({
    question: z.string(),
    correctAnswer: z.string(),
    topic: z.string().optional(),
    timestamp: z.string().optional(),
  })),
  transcript: z.string(),
  difficulty: z.enum(["kolay", "orta", "zor", "karisik"]).default("orta"),
  round: z.number().min(1).max(3).default(1),
});

function extractJSON(raw: string): any {
  let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const start = text.indexOf("[");
  if (start > 0) text = text.slice(start);
  try {
    return JSON.parse(text);
  } catch {
    const arrEnd = text.lastIndexOf("]");
    if (arrEnd > 0) {
      try {
        return JSON.parse(text.slice(0, arrEnd + 1));
      } catch {
        throw new Error("JSON parse edilemedi");
      }
    }
    throw new Error("Geçerli JSON bulunamadı");
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Gerekli alanlar eksik." }, { status: 400 });
  }

  const { wrongTopics, transcript, difficulty, round } = parsed.data;

  if (wrongTopics.length === 0) {
    return NextResponse.json({ error: "Yanlış soru yok." }, { status: 400 });
  }

  const topicList = wrongTopics
    .map((t, i) => `${i + 1}. Konu: "${t.question}" — Doğru cevap: "${t.correctAnswer}"`)
    .join("\n");

  const difficultyMap = {
    kolay: "kolay seviyede, temel kavram soruları",
    orta: "orta seviyede, anlama ve uygulama soruları",
    zor: "zor seviyede, analiz ve değerlendirme soruları",
    karisik: "karışık zorlukta sorular",
  }[difficulty];

  const roundNote = round > 1
    ? `Bu ${round}. tekrar turu. Öğrenci bu konuları daha önce de yanlış yaptı — soruları farklı açıdan sor, aynı soruyu tekrarlama.`
    : "Bu ilk tekrar turu.";

  const prompt = `Sen deneyimli bir sınav hazırlayıcısısın. Öğrenci aşağıdaki konularda yanlış cevap verdi.
Bu konulardan TAMAMEN YENİ ve FARKLI sorular üret. Aynı soruları kopyalama.

${roundNote}

Öğrencinin yanlış yaptığı konular:
${topicList}

Video transkripti (referans için):
${transcript.slice(0, 30000)}

KURALLAR:
1. Her konu için 1 yeni soru üret (toplam ${wrongTopics.length} soru)
2. ${difficultyMap} üret
3. Soruları farklı açıdan sor — aynı bilgiyi farklı şekilde test et
4. Her soru için 4 şık ve doğru cevap indexi belirt
5. Kısa açıklama ekle

SADECE şu JSON array formatında yanıt ver, başka hiçbir şey yazma:
[
  {
    "question": "Yeni soru metni",
    "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
    "correct": 0,
    "timestamp": "MM:SS",
    "explanation": "Doğru cevabın açıklaması"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.4 },
    });

    const text = response.text ?? "";
    const questions = extractJSON(text);

    return NextResponse.json({ questions, round });
  } catch (error) {
    console.error("[requiz]", error);
    return NextResponse.json({ error: "Sorular üretilemedi, tekrar dene." }, { status: 502 });
  }
}
